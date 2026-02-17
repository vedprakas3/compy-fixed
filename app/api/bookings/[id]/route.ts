import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/middleware/auth';
import { Booking } from '@/models';
import connectDB from '@/lib/mongodb';

// GET - Get booking by ID
export async function GET(
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

    // Check if user has access to this booking
    const isUser = booking.userId._id.toString() === auth.user!._id;
    const isCompanion = booking.companionId.userId?.toString() === auth.user!._id;
    const isAdmin = auth.user!.role === 'admin';

    if (!isUser && !isCompanion && !isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: booking,
    });
  } catch (error: any) {
    console.error('Get booking error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch booking' },
      { status: 500 }
    );
  }
}
