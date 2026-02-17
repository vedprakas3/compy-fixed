import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/middleware/auth';
import { Companion } from '@/models';
import connectDB from '@/lib/mongodb';

export async function POST(
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

    // Check if admin
    if (auth.user!.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { id } = params;
    const { reason } = await req.json();

    await connectDB();

    const companion = await Companion.findById(id);

    if (!companion) {
      return NextResponse.json(
        { success: false, message: 'Companion not found' },
        { status: 404 }
      );
    }

    await companion.rejectKYC(reason);

    return NextResponse.json({
      success: true,
      message: 'Companion rejected successfully',
      data: companion,
    });
  } catch (error: any) {
    console.error('Reject companion error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to reject companion' },
      { status: 500 }
    );
  }
}
