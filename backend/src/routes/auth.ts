import { Router, Response } from 'express';
import { db } from '../db/connection';
import { hashPassword, verifyPassword, signToken } from '../config/authHelper';
import { authenticateToken, AuthenticatedRequest } from '../middlewares/authMiddleware';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set. Server cannot start securely.');
}

// 1. SignUp
router.post('/signup', async (req, res) => {
  const { email, password, fullName } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Check if user exists
    const existing = await db.query('SELECT user_id FROM profiles WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const userId = crypto.randomUUID();
    const passHash = hashPassword(password);

    await db.query(
      `INSERT INTO profiles (user_id, email, password_hash, full_name, subscription_tier)
       VALUES ($1, $2, $3, $4, 'free')`,
      [userId, email.toLowerCase(), passHash, fullName || null]
    );

    // Generate JWT token
    const token = signToken({ user_id: userId }, JWT_SECRET);

    res.status(201).json({
      token,
      user: {
        user_id: userId,
        email: email.toLowerCase(),
        full_name: fullName || null,
        subscription_tier: 'free',
        subscription_expires_at: null,
        role: 'user'
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create user account' });
  }
});

// 2. Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const userRes = await db.query(
      `SELECT p.user_id, p.email, p.password_hash, p.full_name, p.subscription_tier, p.subscription_expires_at, p.is_banned, COALESCE(r.role, 'user') as role
       FROM profiles p
       LEFT JOIN user_roles r ON p.user_id = r.user_id
       WHERE p.email = $1`,
      [email.toLowerCase()]
    );

    if (userRes.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const user = userRes.rows[0];

    if (user.is_banned) {
      return res.status(403).json({ error: 'Your account is banned' });
    }

    if (!user.password_hash) {
      return res.status(400).json({ error: 'Please authenticate using the correct provider' });
    }

    const isValid = verifyPassword(password, user.password_hash);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = signToken({ user_id: user.user_id }, JWT_SECRET);

    res.json({
      token,
      user: {
        user_id: user.user_id,
        email: user.email,
        full_name: user.full_name,
        subscription_tier: user.subscription_tier,
        subscription_expires_at: user.subscription_expires_at,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// 3. Get Current User info
router.get('/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

export default router;
