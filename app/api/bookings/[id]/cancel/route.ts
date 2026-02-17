import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/middleware/auth';
import { Booking, Companion } from '@/models';
import connectDB from '@/lib/mongodb';
import { refundPayment } from '@/lib/razorpay';

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
    const { reason } = await req.json();

    await connectDB();

    const booking = await Booking.findByBookingId(id);

    if (!booking) {
      return NextResponse.json(
        { success: false, message: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if user has access to cancel this booking
    const isUser = booking.userId._id.toString() === auth.user!._id;
    const companion = await Companion.findById(booking.companionId);
    const isCompanion = companion && companion.userId.toString() === auth.user!._id;
    const isAdmin = auth.user!.role === 'admin';

    if (!isUser && !isCompanion && !isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check if booking can be cancelled
    if (!['pending', 'confirmed'].includes(booking.status)) {
      return NextResponse.json(
        { success: false, message: `Booking cannot be cancelled (current status: ${booking.status})` },
        { status: 400 }
      );
    }

    // Calculate refund amount based on cancellation time
    const now = new Date();
    const bookingStart = new Date(booking.dates.startDateTime);
    const hoursUntilBooking = (bookingStart.getTime() - now.getTime()) / (1000 * 60 * 60);

    let refundPercentage = 0;
    if (hoursUntilBooking >= 48) {
      refundPercentage = 100;
    } else if (hoursUntilBooking >= 24) {
      refundPercentage = 50;
    } else {
      refundPercentage = 0;
    }

    const refundAmount = (booking.pricing.total * refundPercentage) / 100;

    // Process refund if applicable
    if (refundAmount > 0 && booking.payment.razorpayPaymentId) {
      try {
        await refundPayment(booking.payment.razorpayPaymentId, refundAmount);
      } catch (error) {
        console.error('Refund error:', error);
        // Continue with cancellation even if refund fails (manual refund needed)
      }
    }

    await booking.cancel(auth.user!._id, reason, refundAmount);

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: {
        booking,
        refundAmount,
        refundPercentage,
      },
    });
  } catch (error: any) {
    console.error('Cancel booking error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to cancel booking' },
      { status: 500 }
    );
  }
}
