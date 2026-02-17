import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { User } from '@/models';
import connectDB from '@/lib/mongodb';

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

    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json(
        { success: false, message: 'ID token is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify the ID token
    const { verifyIdToken } = await import('@/lib/firebase-admin');
    const decodedToken = await verifyIdToken(idToken);

    // Check if user exists
    let user = await User.findByFirebaseUid(decodedToken.uid);

    if (!user) {
      // Create new user
      const nameParts = (decodedToken.name || 'Unknown User').split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';

      user = await User.create({
        firebaseUid: decodedToken.uid,
        email: decodedToken.email?.toLowerCase(),
        role: 'user',
        status: 'active',
        profile: {
          firstName,
          lastName,
          avatar: decodedToken.picture || null,
        },
        verification: {
          email: true,
          phone: false,
          identity: 'unverified',
          badge: false,
        },
        wallet: {
          balance: 0,
          currency: 'INR',
          transactions: [],
        },
        preferences: {
          notifications: true,
          newsletter: false,
          language: 'en',
          currency: 'INR',
        },
        safety: {
          panicContacts: [],
        },
        blockedUsers: [],
        wishlist: [],
      });
    }

    // Check if user is active
    if (user.status === 'banned' || user.status === 'suspended') {
      return NextResponse.json(
        { success: false, message: 'Account is suspended or banned' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Google login successful',
      data: {
        user,
        token: idToken,
      },
    });
  } catch (error: any) {
    console.error('Google login error:', error);
    
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to login with Google' },
      { status: 500 }
    );
  }
}
