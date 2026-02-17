import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const { rateLimit } = await import('@/middleware/rateLimit');
    const rateLimitResult = await rateLimit(req, 'auth');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, message: rateLimitResult.error },
        { status: 429 }
      );
    }

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    // Send password reset email
    await sendPasswordResetEmail(auth, email);

    return NextResponse.json({
      success: true,
      message: 'Password reset email sent successfully',
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    
    // Handle Firebase errors
    if (error.code === 'auth/user-not-found') {
      // Don't reveal if user exists
      return NextResponse.json({
        success: true,
        message: 'If an account exists, a password reset email has been sent.',
      });
    }

    return NextResponse.json(
      { success: false, message: error.message || 'Failed to send reset email' },
      { status: 500 }
    );
  }
}
