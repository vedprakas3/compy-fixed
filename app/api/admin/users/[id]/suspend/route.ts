import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/middleware/auth';
import { User } from '@/models';
import connectDB from '@/lib/mongodb';

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

    // Check if admin
    if (auth.user!.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { id } = params;
    const { reason } = await req.json();

    await connectDB();

    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent suspending admin
    if (user.role === 'admin') {
      return NextResponse.json(
        { success: false, message: 'Cannot suspend admin users' },
        { status: 403 }
      );
    }

    user.status = 'suspended';
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'User suspended successfully',
      data: user,
    });
  } catch (error: any) {
    console.error('Suspend user error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to suspend user' },
      { status: 500 }
    );
  }
}
