import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase-admin';
import { User } from '@/models';
import connectDB from '@/lib/mongodb';

// Extend NextRequest to include user
export interface AuthenticatedRequest extends NextRequest {
  user?: {
    uid: string;
    email: string;
    role: string;
    _id: string;
  };
}

// Verify Firebase token and attach user to request
export async function verifyAuth(req: AuthenticatedRequest): Promise<{ user?: any; error?: string; status?: number }> {
  try {
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { error: 'No authorization token provided', status: 401 };
    }

    const token = authHeader.split('Bearer ')[1];
    
    if (!token) {
      return { error: 'Invalid token format', status: 401 };
    }

    // Verify Firebase token
    const decodedToken = await verifyIdToken(token);
    
    // Connect to database
    await connectDB();
    
    // Find user in database
    const user = await User.findByFirebaseUid(decodedToken.uid);
    
    if (!user) {
      return { error: 'User not found', status: 404 };
    }

    // Check if user is active
    if (user.status === 'banned' || user.status === 'suspended') {
      return { error: 'Account is suspended or banned', status: 403 };
    }

    return {
      user: {
        uid: decodedToken.uid,
        email: user.email,
        role: user.role,
        _id: user._id.toString(),
      },
    };
  } catch (error: any) {
    console.error('Auth middleware error:', error);
    return { error: 'Invalid or expired token', status: 401 };
  }
}

// Middleware wrapper for API routes
export function withAuth(handler: Function) {
  return async (req: AuthenticatedRequest, res: NextResponse) => {
    const { user, error, status } = await verifyAuth(req);
    
    if (error) {
      return NextResponse.json(
        { success: false, message: error },
        { status: status || 401 }
      );
    }

    req.user = user;
    return handler(req, res);
  };
}

// Role-based access control middleware
export function withRole(allowedRoles: string[]) {
  return function(handler: Function) {
    return async (req: AuthenticatedRequest, res: NextResponse) => {
      const { user, error, status } = await verifyAuth(req);
      
      if (error) {
        return NextResponse.json(
          { success: false, message: error },
          { status: status || 401 }
        );
      }

      if (!allowedRoles.includes(user.role)) {
        return NextResponse.json(
          { success: false, message: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      req.user = user;
      return handler(req, res);
    };
  };
}

// Specific role middlewares
export const withUser = withRole(['user', 'companion', 'admin']);
export const withCompanion = withRole(['companion', 'admin']);
export const withAdmin = withRole(['admin']);

// Optional auth middleware (doesn't require auth but attaches user if available)
export function withOptionalAuth(handler: Function) {
  return async (req: AuthenticatedRequest, res: NextResponse) => {
    try {
      const authHeader = req.headers.get('authorization');
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await verifyIdToken(token);
        await connectDB();
        const user = await User.findByFirebaseUid(decodedToken.uid);
        
        if (user && user.status === 'active') {
          req.user = {
            uid: decodedToken.uid,
            email: user.email,
            role: user.role,
            _id: user._id.toString(),
          };
        }
      }
    } catch (error) {
      // Silently fail for optional auth
    }

    return handler(req, res);
  };
}
