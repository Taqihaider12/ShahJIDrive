import { Router, Response } from 'express';
import { db } from '../db/connection';
import { authenticateToken, AuthenticatedRequest, requireAdmin } from '../middlewares/authMiddleware';

const router = Router();

// Admin-only endpoints

// 1. Get All Users List
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.user_id, p.email, p.full_name, p.subscription_tier, p.subscription_expires_at, p.is_banned, p.ban_reason, p.banned_at, p.created_at, COALESCE(r.role, 'user') as role
      FROM profiles p
      LEFT JOIN user_roles r ON p.user_id = r.user_id
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Admin fetch users error:', error);
    res.status(500).json({ error: 'Failed to fetch users list' });
  }
});

// 2. Ban User
router.post('/users/:id/ban', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    const result = await db.query(
      `UPDATE profiles
       SET is_banned = true, ban_reason = $1, banned_at = CURRENT_TIMESTAMP
       WHERE user_id = $2
       RETURNING *`,
      [reason || 'Violation of terms of service', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User banned successfully', profile: result.rows[0] });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({ error: 'Failed to ban user' });
  }
});

// 3. Unban User
router.post('/users/:id/unban', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `UPDATE profiles
       SET is_banned = false, ban_reason = null, banned_at = null
       WHERE user_id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User unbanned successfully', profile: result.rows[0] });
  } catch (error) {
    console.error('Unban user error:', error);
    res.status(500).json({ error: 'Failed to unban user' });
  }
});

// 4. Upgrade User Subscription
router.post('/users/:id/upgrade', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { tier, duration } = req.body; // duration: '1week', '1month', '3months', '6months', '1year', 'lifetime'

  if (!tier || !['pro', 'premium'].includes(tier)) {
    return res.status(400).json({ error: 'Invalid subscription tier. Must be pro or premium.' });
  }

  try {
    const expiresAt = new Date();
    switch (duration) {
      case '1week':
        expiresAt.setDate(expiresAt.getDate() + 7);
        break;
      case '1month':
        expiresAt.setDate(expiresAt.getDate() + 30);
        break;
      case '3months':
        expiresAt.setDate(expiresAt.getDate() + 90);
        break;
      case '6months':
        expiresAt.setDate(expiresAt.getDate() + 180);
        break;
      case '1year':
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        break;
      case 'lifetime':
        expiresAt.setFullYear(expiresAt.getFullYear() + 100);
        break;
      default:
        expiresAt.setDate(expiresAt.getDate() + 30); // fallback 30 days
    }

    const result = await db.query(
      `UPDATE profiles
       SET subscription_tier = $1, subscription_expires_at = $2
       WHERE user_id = $3
       RETURNING *`,
      [tier, expiresAt.toISOString(), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User subscription upgraded', profile: result.rows[0] });
  } catch (error) {
    console.error('Upgrade user error:', error);
    res.status(500).json({ error: 'Failed to upgrade subscription' });
  }
});

// 5. Downgrade User Subscription
router.post('/users/:id/downgrade', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `UPDATE profiles
       SET subscription_tier = 'free', subscription_expires_at = null
       WHERE user_id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User subscription downgraded to free', profile: result.rows[0] });
  } catch (error) {
    console.error('Downgrade user error:', error);
    res.status(500).json({ error: 'Failed to downgrade subscription' });
  }
});

// 6. Assign Admin Role
router.post('/users/:id/role', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body; // 'admin' or 'user'

  if (!role || !['admin', 'user'].includes(role)) {
    return res.status(400).json({ error: 'Role must be admin or user' });
  }

  try {
    if (role === 'admin') {
      await db.query(
        `INSERT INTO user_roles (user_id, role)
         VALUES ($1, 'admin')
         ON CONFLICT (user_id, role) DO NOTHING`,
        [id]
      );
    } else {
      await db.query('DELETE FROM user_roles WHERE user_id = $1 AND role = \'admin\'', [id]);
    }
    res.json({ message: `User role updated to ${role}` });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Pricing settings management

// 7. Get Pricing Settings (Public or Authenticated)
router.get('/pricing', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM pricing_settings ORDER BY plan_name ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch pricing error:', error);
    res.status(500).json({ error: 'Failed to fetch pricing' });
  }
});

// 8. Update Pricing Settings
router.put('/pricing/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { price_usd, price_inr, price_pkr } = req.body;

  try {
    const result = await db.query(
      `UPDATE pricing_settings
       SET price_usd = $1, price_inr = $2, price_pkr = $3, price = $3
       WHERE id = $4
       RETURNING *`,
      [price_usd, price_inr, price_pkr, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pricing plan not found' });
    }

    res.json({ message: 'Pricing plan updated successfully', plan: result.rows[0] });
  } catch (error) {
    console.error('Update pricing error:', error);
    res.status(500).json({ error: 'Failed to update pricing plan' });
  }
});

export default router;
