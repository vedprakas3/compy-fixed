import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { User } from '@/models';
import connectDB from '@/lib/mongodb';
import { validate, schemas } from '@/middleware/validation';
import { withRateLimit } from '@/middleware/rateLimit';

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
    const validation = await validate(schemas.userSignup)(req);
    if (!validation.success) {
      return validation.error;
    }

    const { email, password, firstName, lastName, phone, role } = validation.data;

    await connectDB();

    // Check if user already exists in MongoDB
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'User already exists' },
        { status: 409 }
      );
    }

    // Create user in Firebase
    const firebaseUser = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update profile
    await updateProfile(firebaseUser.user, {
      displayName: `${firstName} ${lastName}`,
    });

    // Create user in MongoDB
    const newUser = await User.create({
      firebaseUid: firebaseUser.user.uid,
      email: email.toLowerCase(),
      phone,
      role: role || 'user',
      status: 'active',
      profile: {
        firstName,
        lastName,
        avatar: null,
      },
      verification: {
        email: firebaseUser.user.emailVerified,
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

    // Get Firebase token
    const token = await firebaseUser.user.getIdToken();

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      data: {
        user: newUser,
        token,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Signup error:', error);
    
    // Handle Firebase errors
    if (error.code === 'auth/email-already-in-use') {
      return NextResponse.json(
        { success: false, message: 'Email already in use' },
        { status: 409 }
      );
    }
    
    if (error.code === 'auth/weak-password') {
      return NextResponse.json(
        { success: false, message: 'Password is too weak' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}
