import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/middleware/auth';
import { User, Companion } from '@/models';
import connectDB from '@/lib/mongodb';

// GET - Get user's wishlist
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error },
        { status: auth.status || 401 }
      );
    }

    await connectDB();

    const user = await User.findById(auth.user!._id)
      .populate({
        path: 'wishlist',
        populate: {
          path: 'userId',
          select: 'profile.firstName profile.lastName profile.avatar',
        },
      });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user.wishlist,
    });
  } catch (error: any) {
    console.error('Get wishlist error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to get wishlist' },
      { status: 500 }
    );
  }
}
