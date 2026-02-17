import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/middleware/auth';
import { Companion, Booking } from '@/models';
import connectDB from '@/lib/mongodb';

// GET - Get companion availability
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    await connectDB();

    const companion = await Companion.findBySlug(slug);

    if (!companion) {
      return NextResponse.json(
        { success: false, message: 'Companion not found' },
        { status: 404 }
      );
    }

    // Get existing bookings for the date range
    let bookings: any[] = [];
    if (startDate && endDate) {
      bookings = await Booking.find({
        companionId: companion._id,
        status: { $in: ['pending', 'confirmed', 'in_progress'] },
        'dates.startDateTime': {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      }).select('dates.startDateTime dates.endDateTime');
    }

    return NextResponse.json({
      success: true,
      data: {
        availability: companion.availability,
        bookings: bookings.map((b) => ({
          start: b.dates.startDateTime,
          end: b.dates.endDateTime,
        })),
      },
    });
  } catch (error: any) {
    console.error('Get availability error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}

// PUT - Update companion availability
export async function PUT(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const auth = await verifyAuth(req);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error },
        { status: auth.status || 401 }
      );
    }

    const { slug } = params;
    const availabilityData = await req.json();

    await connectDB();

    const companion = await Companion.findBySlug(slug);

    if (!companion) {
      return NextResponse.json(
        { success: false, message: 'Companion not found' },
        { status: 404 }
      );
    }

    // Check if user owns this profile
    if (companion.userId._id.toString() !== auth.user!._id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Update availability
    companion.availability = {
      ...companion.availability,
      ...availabilityData,
    };

    await companion.save();

    return NextResponse.json({
      success: true,
      message: 'Availability updated successfully',
      data: companion.availability,
    });
  } catch (error: any) {
    console.error('Update availability error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update availability' },
      { status: 500 }
    );
  }
}
