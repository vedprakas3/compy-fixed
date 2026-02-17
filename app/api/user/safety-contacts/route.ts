import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/middleware/auth';
import { User } from '@/models';
import connectDB from '@/lib/mongodb';

// GET - Get safety contacts
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
      data: user.safety.panicContacts,
    });
  } catch (error: any) {
    console.error('Get safety contacts error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to get safety contacts' },
      { status: 500 }
    );
  }
}

// POST - Add safety contact
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error },
        { status: auth.status || 401 }
      );
    }

    const { name, phone, relationship } = await req.json();

    if (!name || !phone || !relationship) {
      return NextResponse.json(
        { success: false, message: 'Name, phone, and relationship are required' },
        { status: 400 }
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

    // Add new contact
    user.safety.panicContacts.push({
      name,
      phone,
      relationship,
    });

    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Safety contact added successfully',
      data: user.safety.panicContacts,
    });
  } catch (error: any) {
    console.error('Add safety contact error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to add safety contact' },
      { status: 500 }
    );
  }
}

// DELETE - Remove safety contact
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error },
        { status: auth.status || 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const contactIndex = parseInt(searchParams.get('index') || '-1');

    if (contactIndex < 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid contact index' },
        { status: 400 }
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

    if (contactIndex >= user.safety.panicContacts.length) {
      return NextResponse.json(
        { success: false, message: 'Contact not found' },
        { status: 404 }
      );
    }

    user.safety.panicContacts.splice(contactIndex, 1);
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Safety contact removed successfully',
      data: user.safety.panicContacts,
    });
  } catch (error: any) {
    console.error('Remove safety contact error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to remove safety contact' },
      { status: 500 }
    );
  }
}
