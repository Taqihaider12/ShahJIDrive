import { Router, Response } from 'express';
import { google } from 'googleapis';
import {
  cloneGoogleDriveFolder,
  listDriveFolders,
  uploadFileToFolder,
  listAllFilesWithFilters,
  deleteFile,
  scanGoogleDriveFolder,
  renameGoogleDriveItem
} from '../services/driveService';
import { authenticateToken, AuthenticatedRequest } from '../middlewares/authMiddleware';

const router = Router();

router.all('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const action = req.query.action || req.body.action;

  try {
    if (action === 'clone') {
      const { folder_link, access_token, remove_word, credit_text, destination_folder_id } = req.body;
      
      if (!folder_link || !access_token) {
        return res.status(400).json({ error: 'Folder link and access token are required' });
      }

      // Extract folder ID from link
      // e.g. https://drive.google.com/drive/folders/1abc123...
      const match = folder_link.match(/\/folders\/([a-zA-Z0-9_-]+)/) || folder_link.match(/id=([a-zA-Z0-9_-]+)/);
      const sourceFolderId = match ? match[1] : folder_link;

      const destParentId = destination_folder_id || 'root';

      const result = await cloneGoogleDriveFolder(
        access_token,
        sourceFolderId,
        destParentId,
        { removeWord: remove_word, creditText: credit_text }
      );

      return res.json(result);
    }

    if (action === 'upload-file') {
      const { access_token, file_name, file_content_base64, mime_type, parent_folder_id } = req.body;
      if (!access_token || !file_name || !file_content_base64) {
        return res.status(400).json({ error: 'access_token, file_name, and file_content_base64 are required' });
      }

      const result = await uploadFileToFolder(
        access_token,
        file_name,
        file_content_base64,
        mime_type || 'application/octet-stream',
        parent_folder_id || 'root'
      );
      return res.json(result);
    }

    if (action === 'list-folders') {
      const { access_token, parent_id } = req.body;
      if (!access_token) {
        return res.status(400).json({ error: 'access_token is required' });
      }
      const folders = await listDriveFolders(access_token, parent_id || 'root');
      return res.json(folders);
    }

    if (action === 'list-all-files') {
      const { access_token, file_types, page_token } = req.body;
      if (!access_token) {
        return res.status(400).json({ error: 'access_token is required' });
      }
      const result = await listAllFilesWithFilters(access_token, file_types || [], page_token);
      return res.json(result);
    }

    if (action === 'delete-file') {
      const { access_token, file_id } = req.body;
      if (!access_token || !file_id) {
        return res.status(400).json({ error: 'access_token and file_id are required' });
      }
      const result = await deleteFile(access_token, file_id);
      return res.json(result);
    }

    if (action === 'scan-folder') {
      const { folder_link, access_token } = req.body;
      if (!folder_link || !access_token) {
        return res.status(400).json({ error: 'Folder link and access token are required' });
      }
      const match = folder_link.match(/\/folders\/([a-zA-Z0-9_-]+)/) || folder_link.match(/id=([a-zA-Z0-9_-]+)/);
      const sourceFolderId = match ? match[1] : folder_link;

      const result = await scanGoogleDriveFolder(access_token, sourceFolderId);
      return res.json(result);
    }

    if (action === 'rename') {
      const { access_token, file_id, new_name } = req.body;
      if (!access_token || !file_id || !new_name) {
        return res.status(400).json({ error: 'access_token, file_id, and new_name are required' });
      }
      const result = await renameGoogleDriveItem(access_token, file_id, new_name);
      return res.json(result);
    }

    if (action === 'delete-files') {
      const { access_token, file_ids } = req.body;
      if (!access_token || !file_ids || !Array.isArray(file_ids)) {
        return res.status(400).json({ error: 'access_token and file_ids array are required' });
      }
      
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );
      oauth2Client.setCredentials({ access_token });
      const drive = google.drive({ version: 'v3', auth: oauth2Client });

      const results = [];
      for (const id of file_ids) {
        try {
          await drive.files.delete({ fileId: id });
          results.push({ id, success: true });
        } catch (err: any) {
          results.push({ id, success: false, error: err.message });
        }
      }
      return res.json({ success: true, results });
    }

    if (action === 'upload-to-folders') {
      const { access_token, file_id, folder_ids } = req.body;
      if (!access_token || !file_id || !folder_ids || !Array.isArray(folder_ids)) {
        return res.status(400).json({ error: 'access_token, file_id, and folder_ids array are required' });
      }

      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );
      oauth2Client.setCredentials({ access_token });
      const drive = google.drive({ version: 'v3', auth: oauth2Client });

      const results = [];
      for (const fId of folder_ids) {
        try {
          const copied = await drive.files.copy({
            fileId: file_id,
            requestBody: { parents: [fId] }
          });
          results.push({ folderId: fId, success: true, fileId: copied.data.id });
        } catch (err: any) {
          results.push({ folderId: fId, success: false, error: err.message });
        }
      }
      return res.json({ success: true, results });
    }

    if (action === 'folder-info') {
      const { access_token, folder_id } = req.body;
      if (!access_token || !folder_id) {
        return res.status(400).json({ error: 'access_token and folder_id are required' });
      }

      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );
      oauth2Client.setCredentials({ access_token });
      const drive = google.drive({ version: 'v3', auth: oauth2Client });

      const folder = await drive.files.get({
        fileId: folder_id,
        fields: 'id, name, mimeType'
      });
      return res.json(folder.data);
    }

    return res.status(400).json({ error: `Unsupported drive-api action: ${action}` });
  } catch (error: any) {
    console.error(`Drive API Router error [action: ${action}]:`, error);
    res.status(500).json({ error: error.message || 'Action failed' });
  }
});

export default router;
