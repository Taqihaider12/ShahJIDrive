import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../config/authHelper';
import { db } from '../db/connection';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set. Server cannot start securely.');
}

export interface AuthenticatedRequest extends Request {
  user?: {
    user_id: string;
    email: string;
    subscription_tier: string;
    subscription_expires_at: string | null;
    is_banned: boolean;
    role: string;
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  const payload = verifyToken(token, JWT_SECRET);
  if (!payload || !payload.user_id) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  try {
    // Fetch profile and role from the database
    const profileRes = await db.query(
      `SELECT p.user_id, p.email, p.subscription_tier, p.subscription_expires_at, p.is_banned, COALESCE(r.role, 'user') as role
       FROM profiles p
       LEFT JOIN user_roles r ON p.user_id = r.user_id
       WHERE p.user_id = $1`,
      [payload.user_id]
    );

    if (profileRes.rows.length === 0) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const user = profileRes.rows[0];
    if (user.is_banned) {
      return res.status(403).json({ error: 'User is banned' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
};

export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }
  next();
};
