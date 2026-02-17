import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/middleware/auth';
import { Review, Booking, Companion } from '@/models';
import connectDB from '@/lib/mongodb';
import { validate, schemas } from '@/middleware/validation';
import { moderateReview } from '@/utils/ai';

// GET - Get reviews (with filters)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const revieweeId = searchParams.get('revieweeId');
    const bookingId = searchParams.get('bookingId');

    await connectDB();

    let reviews;

    if (revieweeId) {
      reviews = await Review.findByReviewee(revieweeId);
    } else if (bookingId) {
      reviews = await Review.findByBooking(bookingId);
    } else {
      return NextResponse.json(
        { success: false, message: 'revieweeId or bookingId is required' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: reviews,
    });
  } catch (error: any) {
    console.error('Get reviews error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST - Create review
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error },
        { status: auth.status || 401 }
      );
    }

    // Validate request body
    const validation = await validate(schemas.reviewCreate)(req);
    if (!validation.success) {
      return validation.error;
    }

    const reviewData = validation.data;

    await connectDB();

    // Get booking
    const booking = await Booking.findById(reviewData.bookingId);

    if (!booking) {
      return NextResponse.json(
        { success: false, message: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if user has access to review this booking
    const isUser = booking.userId.toString() === auth.user!._id;
    const companion = await Companion.findById(booking.companionId);
    const isCompanion = companion && companion.userId.toString() === auth.user!._id;

    if (!isUser && !isCompanion) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check if booking is completed
    if (booking.status !== 'completed') {
      return NextResponse.json(
        { success: false, message: 'Can only review completed bookings' },
        { status: 400 }
      );
    }

    // Determine reviewer and reviewee
    const reviewerId = auth.user!._id;
    const revieweeId = isUser ? companion!.userId.toString() : booking.userId.toString();
    const reviewerRole = isUser ? 'user' : 'companion';

    // Check if review already exists
    const existingReview = await Review.findOne({
      bookingId: reviewData.bookingId,
      reviewerId,
    });

    if (existingReview) {
      return NextResponse.json(
        { success: false, message: 'You have already reviewed this booking' },
        { status: 409 }
      );
    }

    // Moderate review content
    const moderationResult = moderateReview(reviewData.comment);
    
    if (moderationResult.action === 'block') {
      return NextResponse.json(
        { success: false, message: 'Review contains inappropriate content' },
        { status: 400 }
      );
    }

    // Create review
    const review = await Review.create({
      bookingId: reviewData.bookingId,
      reviewerId,
      revieweeId,
      reviewerRole,
      rating: reviewData.rating,
      comment: reviewData.comment,
      categories: reviewData.categories,
      isVisible: moderationResult.action === 'allow',
      moderated: moderationResult.flagged,
      moderationNotes: moderationResult.flagged ? JSON.stringify(moderationResult.categories) : undefined,
    });

    // Update booking with review
    if (isUser) {
      await booking.addUserReview(reviewData.rating, reviewData.comment);
    } else {
      await booking.addCompanionReview(reviewData.rating, reviewData.comment);
    }

    // Update companion rating
    if (isUser && companion) {
      await companion.updateRating();
    }

    return NextResponse.json({
      success: true,
      message: 'Review submitted successfully',
      data: review,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create review error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create review' },
      { status: 500 }
    );
  }
}
