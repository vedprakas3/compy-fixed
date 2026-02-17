import { NextRequest, NextResponse } from 'next/server';
import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';

// Rate limiters for different endpoints
const rateLimiters = {
  // General API rate limiter: 100 requests per 15 minutes
  general: new RateLimiterMemory({
    keyPrefix: 'general',
    points: 100,
    duration: 900, // 15 minutes
  }),

  // Auth endpoints: 5 requests per minute
  auth: new RateLimiterMemory({
    keyPrefix: 'auth',
    points: 5,
    duration: 60, // 1 minute
  }),

  // Booking endpoints: 10 requests per minute
  booking: new RateLimiterMemory({
    keyPrefix: 'booking',
    points: 10,
    duration: 60,
  }),

  // Payment endpoints: 5 requests per minute
  payment: new RateLimiterMemory({
    keyPrefix: 'payment',
    points: 5,
    duration: 60,
  }),

  // Chat endpoints: 30 messages per minute
  chat: new RateLimiterMemory({
    keyPrefix: 'chat',
    points: 30,
    duration: 60,
  }),

  // Upload endpoints: 5 uploads per 10 minutes
  upload: new RateLimiterMemory({
    keyPrefix: 'upload',
    points: 5,
    duration: 600, // 10 minutes
  }),

  // Strict rate limiter for sensitive operations: 3 requests per 5 minutes
  strict: new RateLimiterMemory({
    keyPrefix: 'strict',
    points: 3,
    duration: 300, // 5 minutes
  }),
};

// Get client IP address
function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  return 'unknown';
}

// Rate limit middleware
export async function rateLimit(
  req: NextRequest,
  type: keyof typeof rateLimiters = 'general'
): Promise<{ success: boolean; limit?: number; remaining?: number; resetTime?: Date; error?: string }> {
  try {
    const clientIp = getClientIp(req);
    const limiter = rateLimiters[type];
    
    const result = await limiter.consume(clientIp);
    
    return {
      success: true,
      limit: limiter.points,
      remaining: result.remainingPoints,
      resetTime: new Date(Date.now() + result.msBeforeNext),
    };
  } catch (rejRes) {
    if (rejRes instanceof RateLimiterRes) {
      return {
        success: false,
        limit: rateLimiters[type].points,
        remaining: 0,
        resetTime: new Date(Date.now() + rejRes.msBeforeNext),
        error: 'Too many requests, please try again later',
      };
    }
    
    return {
      success: false,
      error: 'Rate limiting error',
    };
  }
}

// Middleware wrapper for API routes
export function withRateLimit(type: keyof typeof rateLimiters = 'general') {
  return function(handler: Function) {
    return async (req: NextRequest, res: NextResponse) => {
      const result = await rateLimit(req, type);
      
      if (!result.success) {
        const response = NextResponse.json(
          { success: false, message: result.error },
          { status: 429 }
        );
        
        // Add rate limit headers
        response.headers.set('X-RateLimit-Limit', result.limit?.toString() || '0');
        response.headers.set('X-RateLimit-Remaining', result.remaining?.toString() || '0');
        response.headers.set('X-RateLimit-Reset', result.resetTime?.toISOString() || '');
        
        return response;
      }
      
      const response = await handler(req, res);
      
      // Add rate limit headers to successful response
      if (response && response.headers) {
        response.headers.set('X-RateLimit-Limit', result.limit?.toString() || '0');
        response.headers.set('X-RateLimit-Remaining', result.remaining?.toString() || '0');
      }
      
      return response;
    };
  };
}

// Specific rate limit middlewares
export const withAuthRateLimit = withRateLimit('auth');
export const withBookingRateLimit = withRateLimit('booking');
export const withPaymentRateLimit = withRateLimit('payment');
export const withChatRateLimit = withRateLimit('chat');
export const withUploadRateLimit = withRateLimit('upload');
export const withStrictRateLimit = withRateLimit('strict');
