import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/middleware/auth';
import { Report, User } from '@/models';
import connectDB from '@/lib/mongodb';
import { validate, schemas } from '@/middleware/validation';
import { moderateContent } from '@/utils/ai';

// GET - Get user's reports
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

    const reports = await Report.findByReporter(auth.user!._id);

    return NextResponse.json({
      success: true,
      data: reports,
    });
  } catch (error: any) {
    console.error('Get reports error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

// POST - Create report
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error },
        { status: auth.status || 401 }
      );
    }

    // Validate request body
    const validation = await validate(schemas.reportCreate)(req);
    if (!validation.success) {
      return validation.error;
    }

    const reportData = validation.data;

    await connectDB();

    // Check if reported user exists
    const reportedUser = await User.findById(reportData.reportedId);
    if (!reportedUser) {
      return NextResponse.json(
        { success: false, message: 'Reported user not found' },
        { status: 404 }
      );
    }

    // Prevent self-reporting
    if (reportData.reportedId === auth.user!._id) {
      return NextResponse.json(
        { success: false, message: 'Cannot report yourself' },
        { status: 400 }
      );
    }

    // Determine severity based on report type
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    switch (reportData.type) {
      case 'safety_concern':
      case 'harassment':
        severity = 'critical';
        break;
      case 'scam':
      case 'fake_profile':
        severity = 'high';
        break;
      case 'inappropriate_behavior':
      case 'no_show':
        severity = 'medium';
        break;
      default:
        severity = 'low';
    }

    // Create report
    const report = await Report.create({
      reporterId: auth.user!._id,
      reportedId: reportData.reportedId,
      bookingId: reportData.bookingId,
      type: reportData.type,
      description: reportData.description,
      evidence: reportData.evidence || [],
      status: 'pending',
      severity,
    });

    // If critical severity, auto-suspend reported user pending investigation
    if (severity === 'critical') {
      await User.findByIdAndUpdate(reportData.reportedId, { status: 'suspended' });
    }

    return NextResponse.json({
      success: true,
      message: 'Report submitted successfully',
      data: report,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create report error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create report' },
      { status: 500 }
    );
  }
}
