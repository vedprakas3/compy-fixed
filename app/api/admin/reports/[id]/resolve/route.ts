import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/middleware/auth';
import { Report, User } from '@/models';
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
    const { action, notes } = await req.json();

    await connectDB();

    const report = await Report.findById(id);

    if (!report) {
      return NextResponse.json(
        { success: false, message: 'Report not found' },
        { status: 404 }
      );
    }

    await report.resolve(action, notes, auth.user!._id);

    // Apply action to reported user
    if (action === 'suspension') {
      await User.findByIdAndUpdate(report.reportedId, { status: 'suspended' });
    } else if (action === 'ban') {
      await User.findByIdAndUpdate(report.reportedId, { status: 'banned' });
    }

    return NextResponse.json({
      success: true,
      message: 'Report resolved successfully',
      data: report,
    });
  } catch (error: any) {
    console.error('Resolve report error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to resolve report' },
      { status: 500 }
    );
  }
}
