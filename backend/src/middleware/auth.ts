import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    userId: string;
    username: string;
    role: string;
    fullName: string;
  };
  body: any;
  params: any;
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token required'
      });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    
    // Verify user still exists and is active
    const user = await User.findOne({ _id: decoded.userId, isActive: true });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
      return;
    }

    req.user = {
      id: user._id.toString(),
      userId: user._id.toString(),
      username: user.username,
      role: user.role,
      fullName: user.fullName
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
      return;
    }

    next();
  };
};

// Role-based middleware shortcuts
export const requireAdmin = requireRole(['admin']);
export const requireManager = requireRole(['admin', 'manager']);
export const requireCashier = requireRole(['admin', 'manager', 'cashier']);