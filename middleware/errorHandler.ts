import { NextResponse } from 'next/server';

// Custom API Error class
export class APIError extends Error {
  statusCode: number;
  code: string;
  details?: any;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR', details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Common error types
export const Errors = {
  BAD_REQUEST: (message: string = 'Bad request', details?: any) => 
    new APIError(message, 400, 'BAD_REQUEST', details),
  
  UNAUTHORIZED: (message: string = 'Unauthorized') => 
    new APIError(message, 401, 'UNAUTHORIZED'),
  
  FORBIDDEN: (message: string = 'Forbidden') => 
    new APIError(message, 403, 'FORBIDDEN'),
  
  NOT_FOUND: (message: string = 'Resource not found') => 
    new APIError(message, 404, 'NOT_FOUND'),
  
  CONFLICT: (message: string = 'Conflict', details?: any) => 
    new APIError(message, 409, 'CONFLICT', details),
  
  VALIDATION_ERROR: (message: string = 'Validation error', details?: any) => 
    new APIError(message, 422, 'VALIDATION_ERROR', details),
  
  RATE_LIMIT: (message: string = 'Too many requests') => 
    new APIError(message, 429, 'RATE_LIMIT'),
  
  INTERNAL_ERROR: (message: string = 'Internal server error') => 
    new APIError(message, 500, 'INTERNAL_ERROR'),
  
  SERVICE_UNAVAILABLE: (message: string = 'Service temporarily unavailable') => 
    new APIError(message, 503, 'SERVICE_UNAVAILABLE'),
};

// Error handler for API routes
export function handleError(error: any): NextResponse {
  console.error('API Error:', error);

  // Handle APIError instances
  if (error instanceof APIError) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
        code: error.code,
        details: error.details,
      },
      { status: error.statusCode }
    );
  }

  // Handle Mongoose validation errors
  if (error.name === 'ValidationError') {
    const details = Object.values(error.errors).map((err: any) => ({
      field: err.path,
      message: err.message,
    }));
    
    return NextResponse.json(
      {
        success: false,
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        details,
      },
      { status: 422 }
    );
  }

  // Handle Mongoose cast errors (invalid ObjectId)
  if (error.name === 'CastError') {
    return NextResponse.json(
      {
        success: false,
        message: `Invalid ${error.path}: ${error.value}`,
        code: 'CAST_ERROR',
      },
      { status: 400 }
    );
  }

  // Handle Mongoose duplicate key errors
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return NextResponse.json(
      {
        success: false,
        message: `${field} already exists`,
        code: 'DUPLICATE_ERROR',
        details: { field, value: error.keyValue[field] },
      },
      { status: 409 }
    );
  }

  // Handle Firebase auth errors
  if (error.code && error.code.startsWith('auth/')) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Authentication error',
        code: error.code,
      },
      { status: 401 }
    );
  }

  // Handle Razorpay errors
  if (error.error && error.error.code) {
    return NextResponse.json(
      {
        success: false,
        message: error.error.description || 'Payment error',
        code: error.error.code,
      },
      { status: 400 }
    );
  }

  // Default error response
  return NextResponse.json(
    {
      success: false,
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : error.message || 'Internal server error',
      code: 'INTERNAL_ERROR',
      ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
    },
    { status: 500 }
  );
}

// Async handler wrapper
export function asyncHandler(fn: Function) {
  return async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      return handleError(error);
    }
  };
}

// Global error handler for uncaught exceptions
export function setupGlobalErrorHandlers() {
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Give the process time to log before exiting
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });
}
