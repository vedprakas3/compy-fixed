import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { User } from '@/models';
import connectDB from '@/lib/mongodb';
import { validate, schemas } from '@/middleware/validation';

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

    // Validate request body
    const validation = await validate(schemas.userLogin)(req);
    if (!validation.success) {
      return validation.error;
    }

    const { email, password } = validation.data;

    await connectDB();

    // Sign in with Firebase
    const firebaseUser = await signInWithEmailAndPassword(auth, email, password);
    
    // Get user from MongoDB
    const user = await User.findByEmail(email);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found in database' },
        { status: 404 }
      );
    }

    // Check if user is active
    if (user.status === 'banned' || user.status === 'suspended') {
      return NextResponse.json(
        { success: false, message: 'Account is suspended or banned' },
        { status: 403 }
      );
    }

    // Get Firebase token
    const token = await firebaseUser.user.getIdToken();

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        token,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    
    // Handle Firebase errors
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    if (error.code === 'auth/too-many-requests') {
      return NextResponse.json(
        { success: false, message: 'Too many failed attempts. Please try again later.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { success: false, message: error.message || 'Failed to login' },
      { status: 500 }
    );
  }
}
