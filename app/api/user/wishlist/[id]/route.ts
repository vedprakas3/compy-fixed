import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/middleware/auth';
import { User } from '@/models';
import connectDB from '@/lib/mongodb';

// POST - Add to wishlist
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAuth(req);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error },
        { status: auth.status || 401 }
      );
    }

    const { id } = params;

    await connectDB();

    const user = await User.findById(auth.user!._id);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    await user.addToWishlist(id);

    return NextResponse.json({
      success: true,
      message: 'Added to wishlist successfully',
    });
  } catch (error: any) {
    console.error('Add to wishlist error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to add to wishlist' },
      { status: 500 }
    );
  }
}

// DELETE - Remove from wishlist
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAuth(req);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error },
        { status: auth.status || 401 }
      );
    }

    const { id } = params;

    await connectDB();

    const user = await User.findById(auth.user!._id);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    await user.removeFromWishlist(id);

    return NextResponse.json({
      success: true,
      message: 'Removed from wishlist successfully',
    });
  } catch (error: any) {
    console.error('Remove from wishlist error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to remove from wishlist' },
      { status: 500 }
    );
  }
}
