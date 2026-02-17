import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/middleware/auth';
import { Booking, Companion, User } from '@/models';
import connectDB from '@/lib/mongodb';
import { validate, schemas } from '@/middleware/validation';
import { calculateBookingPrice } from '@/utils/helpers';
import { createOrder } from '@/lib/razorpay';
import { withRateLimit } from '@/middleware/rateLimit';

// GET - Get user's bookings
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error },
        { status: auth.status || 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const upcoming = searchParams.get('upcoming') === 'true';
    const past = searchParams.get('past') === 'true';

    await connectDB();

    const filters: any = {};

    // Filter by user role
    if (auth.user!.role === 'companion') {
      const companion = await Companion.findByUserId(auth.user!._id);
      if (companion) {
        filters.companionId = companion._id;
      }
    } else {
      filters.userId = auth.user!._id;
    }

    // Filter by status
    if (status) {
      filters.status = status;
    }

    // Filter by date
    if (upcoming) {
      filters['dates.startDateTime'] = { $gte: new Date() };
      filters.status = { $in: ['pending', 'confirmed'] };
    }

    if (past) {
      filters['dates.endDateTime'] = { $lt: new Date() };
    }

    const bookings = await Booking.find(filters)
      .populate('userId', 'profile.firstName profile.lastName profile.avatar')
      .populate('companionId', 'slug profile.photos pricing.hourlyRate userId')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: bookings,
    });
  } catch (error: any) {
    console.error('Get bookings error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

// POST - Create new booking
export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const { rateLimit } = await import('@/middleware/rateLimit');
    const rateLimitResult = await rateLimit(req, 'booking');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, message: rateLimitResult.error },
        { status: 429 }
      );
    }

    const auth = await verifyAuth(req);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error },
        { status: auth.status || 401 }
      );
    }

    // Validate request body
    const validation = await validate(schemas.bookingCreate)(req);
    if (!validation.success) {
      return validation.error;
    }

    const bookingData = validation.data;

    await connectDB();

    // Get companion
    const companion = await Companion.findById(bookingData.companionId);

    if (!companion) {
      return NextResponse.json(
        { success: false, message: 'Companion not found' },
        { status: 404 }
      );
    }

    // Check if companion is available
    if (companion.status !== 'approved' || companion.kyc.status !== 'verified') {
      return NextResponse.json(
        { success: false, message: 'Companion is not available for booking' },
        { status: 400 }
      );
    }

    // Calculate duration
    const startDateTime = new Date(bookingData.startDateTime);
    const endDateTime = new Date(bookingData.endDateTime);
    const durationMs = endDateTime.getTime() - startDateTime.getTime();
    const durationHours = Math.ceil(durationMs / (1000 * 60 * 60));

    // Check minimum and maximum booking hours
    if (durationHours < companion.settings.minBookingHours) {
      return NextResponse.json(
        { success: false, message: `Minimum booking is ${companion.settings.minBookingHours} hours` },
        { status: 400 }
      );
    }

    if (durationHours > companion.settings.maxBookingHours) {
      return NextResponse.json(
        { success: false, message: `Maximum booking is ${companion.settings.maxBookingHours} hours` },
        { status: 400 }
      );
    }

    // Check for overlapping bookings
    const overlappingBookings = await Booking.findOverlapping(
      companion._id.toString(),
      startDateTime,
      endDateTime
    );

    if (overlappingBookings.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Selected time slot is not available' },
        { status: 409 }
      );
    }

    // Calculate pricing
    const commissionPercent = parseInt(process.env.PLATFORM_COMMISSION_PERCENTAGE || '15');
    const pricing = calculateBookingPrice(
      companion.pricing.hourlyRate,
      durationHours,
      commissionPercent,
      18 // GST
    );

    // Create Razorpay order
    const receipt = `booking_${Date.now()}`;
    const razorpayOrder = await createOrder(
      pricing.total,
      'INR',
      receipt,
      {
        userId: auth.user!._id,
        companionId: companion._id.toString(),
      }
    );

    // Create booking
    const booking = await Booking.create({
      userId: auth.user!._id,
      companionId: companion._id,
      status: 'pending',
      paymentStatus: 'pending',
      dates: {
        startDateTime,
        endDateTime,
        duration: durationHours,
      },
      location: bookingData.location,
      pricing: {
        hourlyRate: companion.pricing.hourlyRate,
        totalHours: durationHours,
        subtotal: pricing.subtotal,
        platformFee: pricing.platformFee,
        tax: pricing.tax,
        total: pricing.total,
        currency: 'INR',
      },
      payment: {
        razorpayOrderId: razorpayOrder.id,
      },
      commission: {
        percentage: commissionPercent,
        platformAmount: pricing.platformFee,
        companionAmount: pricing.companionEarnings,
      },
      requirements: bookingData.requirements,
      specialRequests: bookingData.specialRequests,
    });

    await booking.populate('userId companionId');

    return NextResponse.json({
      success: true,
      message: 'Booking created successfully',
      data: {
        booking,
        razorpayOrderId: razorpayOrder.id,
        amount: pricing.total,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create booking error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create booking' },
      { status: 500 }
    );
  }
}
