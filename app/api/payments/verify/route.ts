import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/middleware/auth';
import { Booking } from '@/models';
import connectDB from '@/lib/mongodb';
import { verifyPaymentSignature } from '@/lib/razorpay';
import { validate, schemas } from '@/middleware/validation';
import { withRateLimit } from '@/middleware/rateLimit';

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const { rateLimit } = await import('@/middleware/rateLimit');
    const rateLimitResult = await rateLimit(req, 'payment');
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
    const validation = await validate(schemas.paymentVerify)(req);
    if (!validation.success) {
      return validation.error;
    }

    const { orderId, paymentId, signature } = validation.data;

    await connectDB();

    // Find booking by order ID
    const booking = await Booking.findOne({ 'payment.razorpayOrderId': orderId });

    if (!booking) {
      return NextResponse.json(
        { success: false, message: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if user owns this booking
    if (booking.userId.toString() !== auth.user!._id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Verify payment signature
    const isValid = verifyPaymentSignature(orderId, paymentId, signature);

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // Update booking payment status
    await booking.markAsPaid(orderId, paymentId, signature);

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      data: booking,
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
