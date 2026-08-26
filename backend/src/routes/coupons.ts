import { Router, Response } from 'express';
import { db } from '../db/connection';
import { authenticateToken, AuthenticatedRequest, requireAdmin } from '../middlewares/authMiddleware';

const router = Router();

// 1. Redeem Coupon (Authenticated user)
router.post('/redeem', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { coupon_code } = req.body;
  const user = req.user;

  if (!coupon_code || !user) {
    return res.status(400).json({ error: 'Coupon code is required' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Fetch the coupon
    const couponRes = await client.query(
      'SELECT * FROM coupons WHERE code = $1 FOR UPDATE',
      [coupon_code.toUpperCase().trim()]
    );

    if (couponRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.json({ success: false, error: 'Invalid coupon code' });
    }

    const coupon = couponRes.rows[0];

    if (!coupon.is_active) {
      await client.query('ROLLBACK');
      return res.json({ success: false, error: 'Coupon is inactive' });
    }

    if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit) {
      await client.query('ROLLBACK');
      return res.json({ success: false, error: 'Coupon usage limit has been reached' });
    }

    // Determine expiry date (default 30 days, or lifetime = 100 years)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Update user profile subscription
    await client.query(
      `UPDATE profiles
       SET subscription_tier = $1, subscription_expires_at = $2
       WHERE user_id = $3`,
      [coupon.plan_type, expiresAt.toISOString(), user.user_id]
    );

    // Update coupon usage count
    await client.query(
      `UPDATE coupons
       SET usage_count = usage_count + 1
       WHERE id = $1`,
      [coupon.id]
    );

    await client.query('COMMIT');
    res.json({
      success: true,
      message: `Successfully redeemed coupon! Your account has been upgraded to ${coupon.plan_type.toUpperCase()} for 30 days.`
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Coupon redemption error:', error);
    res.status(500).json({ error: 'Internal server error during redemption' });
  } finally {
    client.release();
  }
});

// Admin coupon management

// 2. List Coupons
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const couponsRes = await db.query('SELECT * FROM coupons ORDER BY created_at DESC');
    res.json(couponsRes.rows);
  } catch (error) {
    console.error('Fetch coupons error:', error);
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
});

// 3. Create Coupon
router.post('/', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { code, plan_type, usage_limit } = req.body;
  const admin = req.user;

  if (!code || !plan_type) {
    return res.status(400).json({ error: 'Code and plan_type are required' });
  }

  try {
    const existing = await db.query('SELECT id FROM coupons WHERE code = $1', [code.toUpperCase().trim()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Coupon code already exists' });
    }

    const result = await db.query(
      `INSERT INTO coupons (code, plan_type, usage_limit, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [code.toUpperCase().trim(), plan_type, usage_limit ? parseInt(usage_limit) : null, admin?.user_id || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({ error: 'Failed to create coupon' });
  }
});

// 4. Toggle Active Status
router.patch('/:id/toggle', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  try {
    const result = await db.query(
      'UPDATE coupons SET is_active = $1 WHERE id = $2 RETURNING *',
      [is_active, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Toggle coupon error:', error);
    res.status(500).json({ error: 'Failed to update coupon status' });
  }
});

// 5. Delete Coupon
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM coupons WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({ error: 'Failed to delete coupon' });
  }
});

export default router;
