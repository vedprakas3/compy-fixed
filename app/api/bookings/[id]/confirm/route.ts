import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/middleware/auth';
import { Booking, Companion } from '@/models';
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

    const { id } = params;

    await connectDB();

    const booking = await Booking.findByBookingId(id);

    if (!booking) {
      return NextResponse.json(
        { success: false, message: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if user is the companion
    const companion = await Companion.findById(booking.companionId);
    if (!companion || companion.userId.toString() !== auth.user!._id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check if booking can be confirmed
    if (booking.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: `Booking cannot be confirmed (current status: ${booking.status})` },
        { status: 400 }
      );
    }

    await booking.confirm();

    return NextResponse.json({
      success: true,
      message: 'Booking confirmed successfully',
      data: booking,
    });
  } catch (error: any) {
    console.error('Confirm booking error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to confirm booking' },
      { status: 500 }
    );
  }
}
