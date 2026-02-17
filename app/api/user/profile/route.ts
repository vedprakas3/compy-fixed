import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/middleware/auth';
import { User } from '@/models';
import connectDB from '@/lib/mongodb';
import { validate, schemas } from '@/middleware/validation';
import { uploadImage } from '@/lib/cloudinary';

// GET - Get user profile
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error },
        { status: auth.status || 401 }
      );
    }

    await connectDB();

    const user = await User.findById(auth.user!._id);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to get profile' },
      { status: 500 }
    );
  }
}

// PUT - Update user profile
export async function PUT(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error },
        { status: auth.status || 401 }
      );
    }

    // Handle multipart form data for avatar upload
    const contentType = req.headers.get('content-type') || '';
    let updateData: any = {};
    let avatarFile: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      avatarFile = formData.get('avatar') as File;
      
      const profileData = formData.get('profile');
      if (profileData) {
        updateData = JSON.parse(profileData as string);
      }
    } else {
      updateData = await req.json();
    }

    await connectDB();

    const user = await User.findById(auth.user!._id);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Upload avatar if provided
    if (avatarFile) {
      const bytes = await avatarFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64Image = `data:${avatarFile.type};base64,${buffer.toString('base64')}`;
      
      const uploadResult = await uploadImage(base64Image, 'avatars');
      user.profile.avatar = uploadResult.url;
    }

    // Update profile fields
    if (updateData.firstName) user.profile.firstName = updateData.firstName;
    if (updateData.lastName) user.profile.lastName = updateData.lastName;
    if (updateData.bio !== undefined) user.profile.bio = updateData.bio;
    if (updateData.dateOfBirth) user.profile.dateOfBirth = new Date(updateData.dateOfBirth);
    if (updateData.gender) user.profile.gender = updateData.gender;
    if (updateData.location) user.profile.location = { ...user.profile.location, ...updateData.location };
    if (updateData.phone) user.phone = updateData.phone;

    // Update preferences
    if (updateData.preferences) {
      user.preferences = { ...user.preferences, ...updateData.preferences };
    }

    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}
