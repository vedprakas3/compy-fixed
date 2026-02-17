import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/middleware/auth';
import { User, Companion, Booking, Report, Withdrawal } from '@/models';
import connectDB from '@/lib/mongodb';

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

    await connectDB();

    // Get counts
    const [
      totalUsers,
      totalCompanions,
      pendingCompanions,
      totalBookings,
      pendingBookings,
      completedBookings,
      totalReports,
      pendingReports,
      withdrawalStats,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Companion.countDocuments(),
      Companion.countDocuments({ status: 'pending' }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'pending' }),
      Booking.countDocuments({ status: 'completed' }),
      Report.countDocuments(),
      Report.countDocuments({ status: { $in: ['pending', 'investigating'] } }),
      Withdrawal.getWithdrawalStats(),
    ]);

    // Calculate revenue
    const revenueStats = await Booking.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$pricing.total' },
          platformEarnings: { $sum: '$commission.platformAmount' },
          companionEarnings: { $sum: '$commission.companionAmount' },
        },
      },
    ]);

    // Recent bookings
    const recentBookings = await Booking.find()
      .populate('userId', 'profile.firstName profile.lastName')
      .populate('companionId', 'slug')
      .sort({ createdAt: -1 })
      .limit(10);

    // Recent reports
    const recentReports = await Report.findPending()
      .limit(10);

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          users: {
            total: totalUsers,
            companions: totalCompanions,
            pendingCompanions,
          },
          bookings: {
            total: totalBookings,
            pending: pendingBookings,
            completed: completedBookings,
          },
          reports: {
            total: totalReports,
            pending: pendingReports,
          },
          revenue: revenueStats[0] || {
            totalRevenue: 0,
            platformEarnings: 0,
            companionEarnings: 0,
          },
          withdrawals: withdrawalStats,
        },
        recent: {
          bookings: recentBookings,
          reports: recentReports,
        },
      },
    });
  } catch (error: any) {
    console.error('Admin dashboard error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
