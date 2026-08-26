import { google } from 'googleapis';
import { Readable } from 'stream';

const createOAuthClient = (redirectUri?: string) => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri || process.env.GOOGLE_REDIRECT_URI
  );
};

export const getAuthUrl = (redirectUri?: string) => {
  const oauth2Client = createOAuthClient(redirectUri);
  const scopes = [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file'
  ];
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });
};

export const exchangeCodeForTokens = async (code: string, redirectUri?: string) => {
  const oauth2Client = createOAuthClient(redirectUri);
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
};

export const refreshAccessToken = async (refreshToken: string) => {
  const oauth2Client = createOAuthClient();
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials;
};

const getDriveClient = (accessToken: string) => {
  const oauth2Client = createOAuthClient();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.drive({ version: 'v3', auth: oauth2Client });
};

const escapeRegExp = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Recursive Folder Cloner
export const cloneGoogleDriveFolder = async (
  accessToken: string,
  sourceFolderId: string,
  destinationParentId: string = 'root',
  options: { removeWord?: string; creditText?: string } = {}
): Promise<{ success: boolean; clonedCount: number; destinationFolderId: string }> => {
  const drive = getDriveClient(accessToken);
  let clonedCount = 0;

  // 1. Get source folder details
  const sourceFolder = await drive.files.get({
    fileId: sourceFolderId,
    fields: 'id, name, mimeType'
  });

  if (sourceFolder.data.mimeType !== 'application/vnd.google-apps.folder') {
    throw new Error('Source ID is not a folder');
  }

  // 2. Adjust name using clean options
  let folderName = sourceFolder.data.name || 'Cloned Folder';
  if (options.removeWord) {
    folderName = folderName.replace(new RegExp(escapeRegExp(options.removeWord), 'gi'), '').trim();
  }
  if (options.creditText) {
    folderName = `${folderName} ${options.creditText}`.trim();
  }

  // 3. Create destination root folder
  const destFolder = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [destinationParentId]
    },
    fields: 'id'
  });

  const destFolderId = destFolder.data.id!;

  // 4. Recursive cloner helper
  const recurseClone = async (srcId: string, destId: string) => {
    let pageToken: string | undefined = undefined;
    let response: any;
    do {
      response = await drive.files.list({
        q: `'` + srcId + `' in parents and trashed = false`,
        fields: 'nextPageToken, files(id, name, mimeType)',
        pageSize: 100,
        pageToken
      });

      const items = response.data.files || [];
      for (const item of items) {
        let itemName = item.name || '';
        if (options.removeWord) {
          itemName = itemName.replace(new RegExp(escapeRegExp(options.removeWord), 'gi'), '').trim();
        }

        if (item.mimeType === 'application/vnd.google-apps.folder') {
          // Replicate sub-folder
          const newSubFolder = await drive.files.create({
            requestBody: {
              name: itemName,
              mimeType: 'application/vnd.google-apps.folder',
              parents: [destId]
            },
            fields: 'id'
          });
          clonedCount++;
          await recurseClone(item.id!, newSubFolder.data.id!);
        } else {
          // Replicate file
          await drive.files.copy({
            fileId: item.id!,
            requestBody: {
              name: itemName,
              parents: [destId]
            }
          });
          clonedCount++;
        }
      }
      pageToken = response.data.nextPageToken || undefined;
    } while (pageToken);
  };

  await recurseClone(sourceFolderId, destFolderId);

  return {
    success: true,
    clonedCount,
    destinationFolderId: destFolderId
  };
};

export const listDriveFolders = async (accessToken: string, parentId: string = 'root') => {
  const drive = getDriveClient(accessToken);
  const response = await drive.files.list({
    q: `'` + parentId + `' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name)',
    pageSize: 100
  });
  return response.data.files || [];
};

export const uploadFileToFolder = async (
  accessToken: string,
  fileName: string,
  fileContentBase64: string,
  mimeType: string,
  parentFolderId: string = 'root'
) => {
  const drive = getDriveClient(accessToken);
  const buffer = Buffer.from(fileContentBase64, 'base64');
  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [parentFolderId]
    },
    media: {
      mimeType,
      body: Readable.from(buffer)
    },
    fields: 'id, name, webViewLink'
  });
  return response.data;
};

export const listAllFilesWithFilters = async (
  accessToken: string,
  fileTypes: string[] = [],
  pageToken?: string
) => {
  const drive = getDriveClient(accessToken);
  let q = 'trashed = false';
  if (fileTypes.length > 0) {
    const mimeQueries = fileTypes.map(t => {
      if (t === 'pdf') return "mimeType = 'application/pdf'";
      if (t === 'folder') return "mimeType = 'application/vnd.google-apps.folder'";
      return `name contains '.` + t + `'`;
    });
    q += ` and (` + mimeQueries.join(' or ') + `)`;
  }

  const response = await drive.files.list({
    q,
    fields: 'nextPageToken, files(id, name, mimeType, size, thumbnailLink, iconLink)',
    pageSize: 50,
    pageToken
  });
  return response.data;
};

export const deleteFile = async (accessToken: string, fileId: string) => {
  const drive = getDriveClient(accessToken);
  await drive.files.delete({ fileId });
  return { success: true };
};

export const scanGoogleDriveFolder = async (
  accessToken: string,
  folderId: string
) => {
  const drive = getDriveClient(accessToken);
  const startTime = Date.now();

  let folderName = 'Unknown Folder';
  try {
    const fInfo = await drive.files.get({ fileId: folderId, fields: 'name' });
    folderName = fInfo.data.name || folderName;
  } catch (e) {
    // ignore
  }

  const folders: any[] = [];
  const files: any[] = [];
  const queue = [folderId];
  const visited = new Set([folderId]);

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    let pageToken: string | undefined;

    do {
      const response: any = await drive.files.list({
        q: `'` + currentId + `' in parents and trashed = false`,
        fields: 'nextPageToken, files(id, name, mimeType, size, modifiedTime)',
        pageSize: 100,
        pageToken
      });

      if (response.data.files) {
        for (const file of response.data.files) {
          if (file.mimeType === 'application/vnd.google-apps.folder') {
            folders.push(file);
            if (!visited.has(file.id)) {
              visited.add(file.id);
              queue.push(file.id);
            }
          } else {
            files.push(file);
          }
        }
      }
      pageToken = response.data.nextPageToken || undefined;
    } while (pageToken);
  }

  const pdfs = files.filter(f => f.mimeType === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
  const images = files.filter(f => f.mimeType.startsWith('image/'));
  const videos = files.filter(f => f.mimeType.startsWith('video/'));
  const documents = files.filter(f => f.mimeType.includes('document') || f.mimeType.includes('text/plain') || f.name.toLowerCase().endsWith('.txt') || f.name.toLowerCase().endsWith('.docx'));
  const totalSize = files.reduce((acc, f) => acc + parseInt(f.size || '0'), 0);

  const nameGroups: { [key: string]: any[] } = {};
  files.forEach(f => {
    const nameLower = f.name.toLowerCase();
    if (!nameGroups[nameLower]) nameGroups[nameLower] = [];
    nameGroups[nameLower].push(f);
  });

  const duplicates = Object.entries(nameGroups)
    .filter(([_, group]) => group.length > 1)
    .map(([name, group]) => ({ name: group[0].name, count: group.length }));

  const pdfContentGroups: { [size: string]: any[] } = {};
  pdfs.forEach(f => {
    const size = f.size || '0';
    if (size !== '0') {
      if (!pdfContentGroups[size]) pdfContentGroups[size] = [];
      pdfContentGroups[size].push(f);
    }
  });

  const pdf_content_duplicates = Object.values(pdfContentGroups)
    .filter(group => group.length > 1);

  const wordCounts: { [word: string]: number } = {};
  files.forEach(f => {
    const nameWithoutExt = f.name.split('.').slice(0, -1).join('.');
    const words = nameWithoutExt.split(/[^a-zA-Z0-9]/).map((w: string) => w.trim()).filter((w: string) => w.length > 3);
    words.forEach((w: string) => {
      const lowerWord = w.toLowerCase();
      if (['with', 'from', 'this', 'that', 'course', 'class', 'video', 'pdf', 'txt', 'file'].includes(lowerWord)) return;
      wordCounts[lowerWord] = (wordCounts[lowerWord] || 0) + 1;
    });
  });

  const suggested_words = Object.entries(wordCounts)
    .filter(([_, count]) => count > 1)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const watermarkPatterns = [
    'join', 'telegram', 'whatsapp', 't.me', 'chat', 'group', 'link', 'promo', 'subscribe', 'channel', 'contact', 'website'
  ];
  const watermarks: any[] = [];
  
  files.forEach(f => {
    const nameLower = f.name.toLowerCase();
    const matchedPattern = watermarkPatterns.find(p => nameLower.includes(p));
    if (matchedPattern) {
      watermarks.push({
        id: f.id,
        name: f.name,
        isFolder: false,
        pattern: matchedPattern
      });
    }
  });

  folders.forEach(f => {
    const nameLower = f.name.toLowerCase();
    const matchedPattern = watermarkPatterns.find(p => nameLower.includes(p));
    if (matchedPattern) {
      watermarks.push({
        id: f.id,
        name: f.name,
        isFolder: true,
        pattern: matchedPattern
      });
    }
  });

  const duration = ((Date.now() - startTime) / 1000).toFixed(1) + 's';

  return {
    folder_name: folderName,
    folders: folders.length,
    files: files.length,
    pdfs: pdfs.length,
    images: images.length,
    videos: videos.length,
    documents: documents.length,
    totalSize,
    duration,
    duplicates,
    pdf_content_duplicates,
    suggested_words,
    watermarks
  };
};

export const renameGoogleDriveItem = async (accessToken: string, fileId: string, newName: string) => {
  const drive = getDriveClient(accessToken);
  const response = await drive.files.update({
    fileId,
    requestBody: { name: newName },
    fields: 'id, name'
  });
  return response.data;
};