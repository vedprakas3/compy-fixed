import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError, ZodSchema } from 'zod';

// Common validation schemas
export const schemas = {
  // User schemas
  userSignup: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    phone: z.string().regex(/^[+]?[\d\s-]{10,}$/, 'Invalid phone number').optional(),
    role: z.enum(['user', 'companion']).default('user'),
  }),

  userLogin: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),

  userProfile: z.object({
    firstName: z.string().min(2).optional(),
    lastName: z.string().min(2).optional(),
    bio: z.string().max(500).optional(),
    dateOfBirth: z.string().datetime().optional(),
    gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
    location: z.object({
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
    }).optional(),
  }),

  // Companion schemas
  companionProfile: z.object({
    pricing: z.object({
      hourlyRate: z.number().min(100),
      halfDayRate: z.number().min(0).optional(),
      fullDayRate: z.number().min(0).optional(),
    }),
    services: z.array(z.string()).optional(),
    profile: z.object({
      about: z.string().max(2000).optional(),
      languages: z.array(z.string()).optional(),
      interests: z.array(z.string()).optional(),
      personalityTraits: z.array(z.string()).optional(),
      availabilityNotes: z.string().max(500).optional(),
    }).optional(),
    settings: z.object({
      autoAccept: z.boolean().optional(),
      minBookingHours: z.number().min(1).max(24).optional(),
      maxBookingHours: z.number().min(1).max(24).optional(),
      advanceBookingDays: z.number().min(0).max(90).optional(),
      instantBooking: z.boolean().optional(),
    }).optional(),
  }),

  companionAvailability: z.object({
    schedule: z.array(z.object({
      day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
      startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
      endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
      isAvailable: z.boolean(),
    })),
    exceptions: z.array(z.object({
      date: z.string().datetime(),
      isAvailable: z.boolean(),
      reason: z.string().optional(),
    })).optional(),
    timezone: z.string().optional(),
  }),

  // Booking schemas
  bookingCreate: z.object({
    companionId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid companion ID'),
    startDateTime: z.string().datetime(),
    endDateTime: z.string().datetime(),
    location: z.object({
      type: z.enum(['user_place', 'companion_place', 'public', 'hotel']),
      address: z.string().optional(),
      city: z.string(),
      notes: z.string().optional(),
    }),
    requirements: z.string().max(1000).optional(),
    specialRequests: z.string().max(500).optional(),
  }),

  bookingAction: z.object({
    action: z.enum(['confirm', 'reject', 'start', 'complete', 'cancel']),
    reason: z.string().max(500).optional(),
  }),

  // Review schemas
  reviewCreate: z.object({
    bookingId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid booking ID'),
    rating: z.number().min(1).max(5),
    comment: z.string().min(10).max(1000),
    categories: z.object({
      punctuality: z.number().min(1).max(5).optional(),
      communication: z.number().min(1).max(5).optional(),
      behavior: z.number().min(1).max(5).optional(),
      overall: z.number().min(1).max(5).optional(),
    }).optional(),
  }),

  // Report schemas
  reportCreate: z.object({
    reportedId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
    bookingId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid booking ID').optional(),
    type: z.enum([
      'inappropriate_behavior',
      'harassment',
      'fake_profile',
      'scam',
      'no_show',
      'payment_issue',
      'safety_concern',
      'other',
    ]),
    description: z.string().min(20).max(2000),
    evidence: z.array(z.string().url()).optional(),
  }),

  // Payment schemas
  paymentVerify: z.object({
    orderId: z.string(),
    paymentId: z.string(),
    signature: z.string(),
  }),

  // Withdrawal schemas
  withdrawalCreate: z.object({
    amount: z.number().min(500, 'Minimum withdrawal amount is 500'),
    method: z.enum(['bank_transfer', 'upi', 'paypal']),
    details: z.object({
      accountNumber: z.string().optional(),
      ifscCode: z.string().optional(),
      accountHolderName: z.string().optional(),
      upiId: z.string().optional(),
      paypalEmail: z.string().email().optional(),
    }),
  }),

  // Search schemas
  searchFilters: z.object({
    location: z.string().optional(),
    gender: z.string().optional(),
    minAge: z.number().min(18).max(100).optional(),
    maxAge: z.number().min(18).max(100).optional(),
    languages: z.array(z.string()).optional(),
    interests: z.array(z.string()).optional(),
    minPrice: z.number().min(0).optional(),
    maxPrice: z.number().min(0).optional(),
    rating: z.number().min(0).max(5).optional(),
    availability: z.string().datetime().optional(),
    services: z.array(z.string()).optional(),
    verified: z.boolean().optional(),
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(50).default(20),
  }),

  // Chat schemas
  chatMessage: z.object({
    content: z.string().min(1).max(2000),
    type: z.enum(['text', 'image', 'file']).default('text'),
    fileUrl: z.string().url().optional(),
  }),

  // Panic alert schema
  panicAlert: z.object({
    location: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }).optional(),
    message: z.string().max(500).optional(),
  }),
};

// Validation middleware
export function validate(schema: ZodSchema) {
  return async (req: NextRequest): Promise<{ success: true; data: any } | { success: false; error: NextResponse }> => {
    try {
      let data;
      
      // Parse request body based on content type
      const contentType = req.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        data = await req.json();
      } else if (contentType.includes('multipart/form-data')) {
        // For file uploads, validate other fields
        const formData = await req.formData();
        data = Object.fromEntries(formData.entries());
      } else {
        // Try to parse as JSON anyway
        try {
          data = await req.json();
        } catch {
          data = {};
        }
      }

      const validatedData = schema.parse(data);
      
      return { success: true, data: validatedData };
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        const response = NextResponse.json(
          {
            success: false,
            message: 'Validation error',
            code: 'VALIDATION_ERROR',
            details,
          },
          { status: 422 }
        );

        return { success: false, error: response };
      }

      const response = NextResponse.json(
        {
          success: false,
          message: 'Invalid request data',
          code: 'PARSE_ERROR',
        },
        { status: 400 }
      );

      return { success: false, error: response };
    }
  };
}

// Query parameter validation
export function validateQuery(schema: ZodSchema) {
  return (req: NextRequest): { success: true; data: any } | { success: false; error: NextResponse } => {
    try {
      const { searchParams } = new URL(req.url);
      const query: any = {};

      searchParams.forEach((value, key) => {
        // Try to parse numbers and booleans
        if (value === 'true') {
          query[key] = true;
        } else if (value === 'false') {
          query[key] = false;
        } else if (!isNaN(Number(value)) && value !== '') {
          query[key] = Number(value);
        } else {
          query[key] = value;
        }
      });

      const validatedData = schema.parse(query);
      
      return { success: true, data: validatedData };
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        const response = NextResponse.json(
          {
            success: false,
            message: 'Invalid query parameters',
            code: 'QUERY_VALIDATION_ERROR',
            details,
          },
          { status: 400 }
        );

        return { success: false, error: response };
      }

      const response = NextResponse.json(
        {
          success: false,
          message: 'Invalid query parameters',
          code: 'QUERY_ERROR',
        },
        { status: 400 }
      );

      return { success: false, error: response };
    }
  };
}

// Sanitize input
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .trim();
}

// Sanitize object recursively
export function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeInput(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
}
