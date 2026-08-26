import { Router, Response } from 'express';
import { db } from '../db/connection';
import { authenticateToken, AuthenticatedRequest } from '../middlewares/authMiddleware';
import crypto from 'crypto';

const router = Router();

// Generate key helper
const generateApiKeyString = (): string => {
  return 'dup_' + crypto.randomBytes(24).toString('hex');
};

// 1. List User's Keys
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const keysRes = await db.query(
      'SELECT * FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC',
      [user.user_id]
    );
    res.json(keysRes.rows);
  } catch (error) {
    console.error('Fetch API keys error:', error);
    res.status(500).json({ error: 'Failed to retrieve API keys' });
  }
});

// 2. Create Key
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { key_name, expires_in_days, allowed_domain } = req.body;
  const user = req.user;

  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  if (!key_name || !key_name.trim()) {
    return res.status(400).json({ error: 'Key name is required' });
  }

  try {
    const apiKey = generateApiKeyString();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (expires_in_days ? parseInt(expires_in_days) : 30));

    const domain = allowed_domain
      ? allowed_domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '')
      : null;

    const result = await db.query(
      `INSERT INTO api_keys (user_id, key_name, api_key, expires_at, allowed_domain)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user.user_id, key_name.trim(), apiKey, expiryDate.toISOString(), domain]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create API key error:', error);
    res.status(500).json({ error: 'Failed to generate API key' });
  }
});

// 3. Toggle Key Status
router.patch('/:id/toggle', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { is_active } = req.body;
  const user = req.user;

  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const result = await db.query(
      'UPDATE api_keys SET is_active = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [is_active, id, user.user_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Toggle API key error:', error);
    res.status(500).json({ error: 'Failed to update key status' });
  }
});

// 4. Renew Key
router.patch('/:id/renew', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { days } = req.body;
  const user = req.user;

  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const renewDays = days ? parseInt(days) : 30;

  try {
    const currentKey = await db.query(
      'SELECT expires_at FROM api_keys WHERE id = $1 AND user_id = $2',
      [id, user.user_id]
    );

    if (currentKey.rows.length === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }

    const currentExpiry = new Date(currentKey.rows[0].expires_at);
    const newExpiry = new Date(Math.max(Date.now(), currentExpiry.getTime()));
    newExpiry.setDate(newExpiry.getDate() + renewDays);

    const result = await db.query(
      'UPDATE api_keys SET expires_at = $1, is_active = true WHERE id = $2 AND user_id = $3 RETURNING *',
      [newExpiry.toISOString(), id, user.user_id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Renew API key error:', error);
    res.status(500).json({ error: 'Failed to renew API key' });
  }
});

// 5. Delete Key
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user;

  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const result = await db.query(
      'DELETE FROM api_keys WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, user.user_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }
    res.json({ message: 'API key deleted successfully' });
  } catch (error) {
    console.error('Delete API key error:', error);
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

export default router;
