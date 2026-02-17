import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, withOptionalAuth } from '@/middleware/auth';
import { Companion, Review } from '@/models';
import connectDB from '@/lib/mongodb';

// GET - Get companion by slug
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    await connectDB();

    const companion = await Companion.findBySlug(slug);

    if (!companion) {
      return NextResponse.json(
        { success: false, message: 'Companion not found' },
        { status: 404 }
      );
    }

    // Only show approved companions to public
    if (companion.status !== 'approved' || companion.kyc.status !== 'verified') {
      // Check if requester is the companion or admin
      const authHeader = req.headers.get('authorization');
      if (authHeader) {
        try {
          const { verifyIdToken } = await import('@/lib/firebase-admin');
          const token = authHeader.split('Bearer ')[1];
          const decodedToken = await verifyIdToken(token);
          const { User } = await import('@/models');
          const user = await User.findByFirebaseUid(decodedToken.uid);
          
          if (user && user._id.toString() !== companion.userId._id.toString() && user.role !== 'admin') {
            return NextResponse.json(
              { success: false, message: 'Companion not found' },
              { status: 404 }
            );
          }
        } catch {
          return NextResponse.json(
            { success: false, message: 'Companion not found' },
            { status: 404 }
          );
        }
      } else {
        return NextResponse.json(
          { success: false, message: 'Companion not found' },
          { status: 404 }
        );
      }
    }

    // Fetch reviews
    const reviews = await Review.findByReviewee(companion.userId._id.toString())
      .limit(5);

    return NextResponse.json({
      success: true,
      data: {
        companion,
        reviews,
      },
    });
  } catch (error: any) {
    console.error('Get companion error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch companion' },
      { status: 500 }
    );
  }
}

// PUT - Update companion profile
export async function PUT(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const auth = await verifyAuth(req);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error },
        { status: auth.status || 401 }
      );
    }

    const { slug } = params;
    const updateData = await req.json();

    await connectDB();

    const companion = await Companion.findBySlug(slug);

    if (!companion) {
      return NextResponse.json(
        { success: false, message: 'Companion not found' },
        { status: 404 }
      );
    }

    // Check if user owns this profile or is admin
    if (companion.userId._id.toString() !== auth.user!._id && auth.user!.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Update allowed fields
    if (updateData.pricing) {
      companion.pricing = { ...companion.pricing, ...updateData.pricing };
    }
    if (updateData.services) {
      companion.services = updateData.services;
    }
    if (updateData.profile) {
      companion.profile = { ...companion.profile, ...updateData.profile };
    }
    if (updateData.settings) {
      companion.settings = { ...companion.settings, ...updateData.settings };
    }
    if (updateData.availability) {
      companion.availability = { ...companion.availability, ...updateData.availability };
    }

    await companion.save();

    return NextResponse.json({
      success: true,
      message: 'Companion profile updated successfully',
      data: companion,
    });
  } catch (error: any) {
    console.error('Update companion error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update companion profile' },
      { status: 500 }
    );
  }
}
