import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/middleware/auth';
import { User } from '@/models';
import connectDB from '@/lib/mongodb';

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error },
        { status: auth.status || 401 }
      );
    }

    const { location, message } = await req.json();

    await connectDB();

    const user = await User.findById(auth.user!._id);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Update last panic alert time
    user.safety.lastPanicAlert = new Date();
    await user.save();

    // TODO: Implement actual panic alert system
    // - Send SMS to panic contacts
    // - Send email to emergency contacts
    // - Log incident for admin review
    // - Optionally notify nearby authorities

    // For now, just log the alert
    console.log('PANIC ALERT:', {
      userId: user._id,
      userName: `${user.profile.firstName} ${user.profile.lastName}`,
      location,
      message,
      timestamp: new Date(),
      panicContacts: user.safety.panicContacts,
    });

    return NextResponse.json({
      success: true,
      message: 'Panic alert sent successfully. Emergency contacts have been notified.',
    });
  } catch (error: any) {
    console.error('Panic alert error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to send panic alert' },
      { status: 500 }
    );
  }
}
