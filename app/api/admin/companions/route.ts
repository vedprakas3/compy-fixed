import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/middleware/auth';
import { Companion, User } from '@/models';
import connectDB from '@/lib/mongodb';

// GET - Get all companions (admin view)
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
    const kycStatus = searchParams.get('kycStatus');

    await connectDB();

    const query: any = {};
    if (status) query.status = status;
    if (kycStatus) query['kyc.status'] = kycStatus;

    const companions = await Companion.find(query)
      .populate('userId', 'profile.firstName profile.lastName email phone')
      .populate('kyc.verifiedBy', 'profile.firstName profile.lastName')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: companions,
    });
  } catch (error: any) {
    console.error('Get companions admin error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch companions' },
      { status: 500 }
    );
  }
}
