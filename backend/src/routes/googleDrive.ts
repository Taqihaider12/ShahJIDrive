import { Router } from 'express';
import { getAuthUrl, exchangeCodeForTokens, refreshAccessToken, listDriveFolders } from '../services/driveService';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

// Dispatch route mirroring the Supabase edge function
router.all('/', authenticateToken, async (req, res) => {
  const action = req.query.action || req.body.action;

  try {
    if (action === 'oauth-url') {
      const redirectUri = (req.query.redirect_uri || req.body.redirect_uri) as string;
      const url = getAuthUrl(redirectUri);
      return res.json({ url });
    }

    if (action === 'exchange-token') {
      const { code, redirect_uri } = req.body;
      if (!code) {
        return res.status(400).json({ error: 'OAuth authorization code is required' });
      }
      const tokens = await exchangeCodeForTokens(code, redirect_uri);
      return res.json(tokens);
    }

    if (action === 'refresh-token') {
      const { refresh_token } = req.body;
      if (!refresh_token) {
        return res.status(400).json({ error: 'Refresh token is required' });
      }
      const credentials = await refreshAccessToken(refresh_token);
      return res.json(credentials);
    }

    if (action === 'list-root-folders') {
      const { access_token } = req.body;
      if (!access_token) {
        return res.status(400).json({ error: 'Access token is required' });
      }
      const folders = await listDriveFolders(access_token, 'root');
      return res.json(folders);
    }

    return res.status(400).json({ error: `Unsupported google-drive action: ${action}` });
  } catch (error: any) {
    console.error(`Google Drive Router error [action: ${action}]:`, error);
    res.status(500).json({ error: error.message || 'Action failed' });
  }
});

export default router;
