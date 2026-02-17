import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/middleware/auth';
import { Report } from '@/models';
import connectDB from '@/lib/mongodb';

// GET - Get all reports
export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');

    await connectDB();

    const query: any = {};
    if (status) query.status = status;
    if (severity) query.severity = severity;

    const reports = await Report.find(query)
      .populate('reporterId', 'profile.firstName profile.lastName email')
      .populate('reportedId', 'profile.firstName profile.lastName email')
      .populate('assignedTo', 'profile.firstName profile.lastName')
      .sort({ severity: -1, createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: reports,
    });
  } catch (error: any) {
    console.error('Get reports admin error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}
