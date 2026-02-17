import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, withOptionalAuth } from '@/middleware/auth';
import { Companion, User } from '@/models';
import connectDB from '@/lib/mongodb';
import { validateQuery } from '@/middleware/validation';
import { z } from 'zod';

// Search filters schema
const searchSchema = z.object({
  location: z.string().optional(),
  gender: z.string().optional(),
  minAge: z.coerce.number().optional(),
  maxAge: z.coerce.number().optional(),
  languages: z.string().optional(),
  interests: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  rating: z.coerce.number().optional(),
  availability: z.string().datetime().optional(),
  services: z.string().optional(),
  verified: z.enum(['true', 'false']).optional().transform((v) => v === 'true'),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().max(50).default(20),
});

// GET - Get all companions with filters
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Validate query params
    const validation = validateQuery(searchSchema)(req);
    if (!validation.success) {
      return validation.error;
    }

    const filters = validation.data;
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {
      status: 'approved',
      'kyc.status': 'verified',
    };

    // Price filter
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query['pricing.hourlyRate'] = {};
      if (filters.minPrice !== undefined) {
        query['pricing.hourlyRate'].$gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        query['pricing.hourlyRate'].$lte = filters.maxPrice;
      }
    }

    // Rating filter
    if (filters.rating !== undefined) {
      query['stats.rating'] = { $gte: filters.rating };
    }

    // Services filter
    if (filters.services) {
      const services = filters.services.split(',');
      query.services = { $in: services };
    }

    // Languages filter
    if (filters.languages) {
      const languages = filters.languages.split(',');
      query['profile.languages'] = { $in: languages };
    }

    // Interests filter
    if (filters.interests) {
      const interests = filters.interests.split(',');
      query['profile.interests'] = { $in: interests };
    }

    // Verified filter
    if (filters.verified) {
      query['verification.badge'] = true;
    }

    // Execute query with pagination
    const [companions, total] = await Promise.all([
      Companion.find(query)
        .populate('userId', 'profile.firstName profile.lastName profile.avatar profile.gender profile.dateOfBirth')
        .skip(skip)
        .limit(limit)
        .sort({ 'stats.rating': -1, 'stats.reviewCount': -1 }),
      Companion.countDocuments(query),
    ]);

    // Filter by age if specified (requires post-query filtering)
    let filteredCompanions = companions;
    if (filters.minAge !== undefined || filters.maxAge !== undefined) {
      filteredCompanions = companions.filter((companion: any) => {
        const user = companion.userId;
        if (!user?.profile?.dateOfBirth) return true;
        
        const age = Math.floor(
          (Date.now() - new Date(user.profile.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
        );
        
        if (filters.minAge !== undefined && age < filters.minAge) return false;
        if (filters.maxAge !== undefined && age > filters.maxAge) return false;
        
        return true;
      });
    }

    // Filter by gender if specified
    if (filters.gender) {
      filteredCompanions = filteredCompanions.filter((companion: any) => {
        return companion.userId?.profile?.gender === filters.gender;
      });
    }

    return NextResponse.json({
      success: true,
      data: filteredCompanions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Get companions error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch companions' },
      { status: 500 }
    );
  }
}

// POST - Create companion profile (for users becoming companions)
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error },
        { status: auth.status || 401 }
      );
    }

    const body = await req.json();

    await connectDB();

    // Check if user already has a companion profile
    const existingCompanion = await Companion.findByUserId(auth.user!._id);
    if (existingCompanion) {
      return NextResponse.json(
        { success: false, message: 'Companion profile already exists' },
        { status: 409 }
      );
    }

    // Create companion profile
    const companion = await Companion.create({
      userId: auth.user!._id,
      status: 'pending',
      kyc: {
        status: 'not_submitted',
        documents: [],
      },
      pricing: {
        hourlyRate: body.pricing?.hourlyRate || 500,
        currency: 'INR',
      },
      services: body.services || [],
      availability: {
        schedule: body.availability?.schedule || [],
        exceptions: [],
        timezone: 'Asia/Kolkata',
      },
      profile: {
        photos: body.profile?.photos || [],
        about: body.profile?.about || '',
        languages: body.profile?.languages || [],
        interests: body.profile?.interests || [],
        personalityTraits: body.profile?.personalityTraits || [],
      },
      settings: {
        autoAccept: false,
        minBookingHours: 1,
        maxBookingHours: 12,
        advanceBookingDays: 7,
        instantBooking: false,
      },
    });

    // Update user role
    await User.findByIdAndUpdate(auth.user!._id, { role: 'companion' });

    return NextResponse.json({
      success: true,
      message: 'Companion profile created successfully',
      data: companion,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create companion error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create companion profile' },
      { status: 500 }
    );
  }
}
