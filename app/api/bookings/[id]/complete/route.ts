import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/middleware/auth';
import { Booking, Companion, User } from '@/models';
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

    // Check if booking can be completed
    if (booking.status !== 'in_progress') {
      return NextResponse.json(
        { success: false, message: `Booking cannot be completed (current status: ${booking.status})` },
        { status: 400 }
      );
    }

    // Complete booking
    await booking.complete();

    // Update companion stats
    await companion.incrementBookings(true);
    await companion.addEarnings(booking.commission.companionAmount);

    // Release escrow to companion's wallet
    const companionUser = await User.findById(companion.userId);
    if (companionUser) {
      await companionUser.addToWallet(
        booking.commission.companionAmount,
        `Earnings from booking ${booking.bookingId}`,
        booking._id.toString()
      );
    }

    await booking.releaseEscrow();

    return NextResponse.json({
      success: true,
      message: 'Booking completed successfully',
      data: booking,
    });
  } catch (error: any) {
    console.error('Complete booking error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to complete booking' },
      { status: 500 }
    );
  }
}
