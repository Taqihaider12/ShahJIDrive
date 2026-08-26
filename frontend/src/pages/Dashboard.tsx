import { canonicalUrl } from '../services/seo';
import { breadcrumbListJsonLd } from '../services/seo/structured-data';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/authContext';
import { jsPDF } from 'jspdf';
import { 
  FolderPlus, FolderOpen, LogOut, Key, FileText, 
  Crown, RefreshCw, AlertTriangle, CheckCircle, FolderSymlink, Trash2,
  Upload, FileSignature, Sparkles, Download, Check, Menu, X
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, token, isAdmin, signOut } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tabs navigation
  const [activeTab, setActiveTab] = useState<'clone' | 'upload' | 'manage' | 'watermark'>('clone');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Google Drive Connection State
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(localStorage.getItem('google_access_token'));
  const [rootFolders, setRootFolders] = useState<any[]>([]);
  const [foldersLoading, setFoldersLoading] = useState(false);

  // Banner state
  const [bannerVisible, setBannerVisible] = useState(true);

  // ==========================================
  // Tab 1: Clone Folder States
  // ==========================================
  const [folderLink, setFolderLink] = useState('');
  const [removeWord, setRemoveWord] = useState('');
  const [creditText, setCreditText] = useState('');
  const [destFolderId, setDestFolderId] = useState('root');
  
  const [cloning, setCloning] = useState(false);
  const [cloneStatus, setCloneStatus] = useState<string | null>(null);

  // Scanner States
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any | null>(null);
  // selectedWatermarks is not needed as we delete matched items directly

  // Cloned Folder tracking
  const [clonedFoldersList, setClonedFoldersList] = useState<any[]>([]);
  const [newName, setNewName] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [cloneResult, setCloneResult] = useState<any | null>(null);

  // ==========================================
  // Tab 2: Upload Files States
  // ==========================================
  const [uploadQueue, setUploadQueue] = useState<any[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadToAllFolders, setUploadToAllFolders] = useState(false);
  
  const [uploading, setUploading] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);

  // ==========================================
  // Tab 3: Manage Files States
  // ==========================================
  const [filesList, setFilesList] = useState<any[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [selectedTypes] = useState<string[]>(['pdf', 'txt']);
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);

  // ==========================================
  // Tab 4: Watermark PDF States
  // ==========================================
  const [category, setCategory] = useState('Educational Course');
  const [brandName, setBrandName] = useState('');
  const [pdfTitle, setPdfTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [channelLink, setChannelLink] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [targetFolderId, setTargetFolderId] = useState('');
  const [uploadToCloned, setUploadToCloned] = useState(false);
  
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  // ==========================================
  // Initial mounting & setup
  // ==========================================
  useEffect(() => {
    if (!token) {
      navigate('/auth');
    }
  }, [token, navigate]);

  useEffect(() => {
    // Read local storage for cloned list
    const cachedList = localStorage.getItem('cloned_folders');
    if (cachedList) {
      try {
        setClonedFoldersList(JSON.parse(cachedList));
      } catch (e) {}
    }

    // Check for Google Auth code in redirected URL
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      exchangeGoogleAuthCode(code);
    }
  }, []);

  useEffect(() => {
    if (googleAccessToken) {
      fetchRootFolders();
      if (activeTab === 'manage') {
        fetchFiles(false);
      }
    }
  }, [googleAccessToken, activeTab, selectedTypes]);

  // Real-time PDF Preview updates on Watermark Form field changes
  useEffect(() => {
    if (activeTab !== 'watermark') return;
    const timeout = setTimeout(() => {
      try {
        const doc = generatePDFDoc();
        const blobUrl = doc.output('bloburl').toString();
        setPdfPreviewUrl(prev => {
          if (prev && prev.startsWith('blob:')) {
            try { URL.revokeObjectURL(prev); } catch (e) {}
          }
          return blobUrl;
        });
      } catch (err) {
        console.warn("Failed to generate real-time PDF preview:", err);
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [activeTab, category, brandName, pdfTitle, tagline, channelLink, logoUrl]);

  // Format Bytes helper
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Google OAuth Connection handlers
  const connectGoogleDrive = async () => {
    try {
      const redirectUri = `${window.location.origin}/dashboard`;
      const res = await fetch(`/api/google-drive?action=oauth-url&redirect_uri=${encodeURIComponent(redirectUri)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Google auth url error:', err);
    }
  };

  const disconnectGoogleDrive = () => {
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_refresh_token');
    setGoogleAccessToken(null);
    setRootFolders([]);
    setFilesList([]);
    setCloneResult(null);
    setScanResult(null);
  };

  const exchangeGoogleAuthCode = async (code: string) => {
    setCloning(true);
    setCloneStatus('Connecting to Google Drive...');
    try {
      const res = await fetch('/api/google-drive?action=exchange-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code, redirect_uri: `${window.location.origin}/dashboard` })
      });
      const data = await res.json();
      if (res.ok && data.access_token) {
        localStorage.setItem('google_access_token', data.access_token);
        if (data.refresh_token) {
          localStorage.setItem('google_refresh_token', data.refresh_token);
        }
        setGoogleAccessToken(data.access_token);
        setCloneStatus('Connected successfully!');
        navigate('/dashboard', { replace: true });
      } else {
        setCloneStatus('Failed to authenticate Google account');
      }
    } catch (err) {
      setCloneStatus('OAuth connection failed');
    } finally {
      setCloning(false);
    }
  };

  const fetchRootFolders = async () => {
    if (!googleAccessToken) return;
    setFoldersLoading(true);
    try {
      const res = await fetch('/api/drive-api?action=list-folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ access_token: googleAccessToken })
      });
      if (res.ok) {
        const folders = await res.json();
        setRootFolders(folders);
      }
    } catch (err) {
      console.error('Fetch folders error:', err);
    } finally {
      setFoldersLoading(false);
    }
  };

  // ==========================================
  // Tab 1: Folder Scan & Cloning logic
  // ==========================================
  const scanFolder = async () => {
    if (!folderLink) {
      alert("Please enter a Google Drive folder link");
      return;
    }
    if (!googleAccessToken) {
      alert("Please connect your Google Drive first");
      return;
    }
    setScanning(true);
    setScanResult(null);
    try {
      const res = await fetch('/api/drive-api?action=scan-folder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ folder_link: folderLink, access_token: googleAccessToken })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Scan failed');
      
      setScanResult(data);
      if (data.folder_name) {
        setNewName(data.folder_name);
      }
      alert(`Scanned ${data.files} files successfully!`);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Scan failed');
    } finally {
      setScanning(false);
    }
  };

  const handleCloneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderLink || !googleAccessToken) return;
    
    setCloning(true);
    setCloneStatus('Initializing cloning traversal...');
    setCloneResult(null);

    try {
      const res = await fetch('/api/drive-api?action=clone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          folder_link: folderLink,
          access_token: googleAccessToken,
          remove_word: removeWord,
          credit_text: creditText,
          destination_folder_id: destFolderId
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const cloneData = {
          folderName: newName || data.folderName || 'Cloned Folder',
          folderId: data.destinationFolderId,
          size: formatBytes(scanResult?.totalSize || 0),
          files: scanResult?.files || 0,
          folders: scanResult?.folders || 0,
          time: data.time || 'Completed'
        };
        
        setCloneResult(cloneData);
        setCloneStatus(`Successfully cloned! Copied ${data.clonedCount} files.`);
        setFolderLink('');

        // Store into localStorage list of cloned folders
        const listObj = { id: cloneData.folderId, name: cloneData.folderName };
        setClonedFoldersList(prev => {
          const updated = [listObj, ...prev.filter(f => f.id !== listObj.id)];
          localStorage.setItem('cloned_folders', JSON.stringify(updated));
          return updated;
        });

      } else {
        setCloneStatus(`Cloning failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      setCloneStatus('Network error during cloning execution');
    } finally {
      setCloning(false);
    }
  };

  const renameFolder = async (fileId: string, newNameStr: string) => {
    if (!newNameStr.trim() || !googleAccessToken) return;
    setRenaming(true);
    try {
      const res = await fetch('/api/drive-api?action=rename', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ access_token: googleAccessToken, file_id: fileId, new_name: newNameStr.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Rename failed');
      alert(`Renamed successfully to "${data.name}"`);
      if (cloneResult && cloneResult.folderId === fileId) {
        setCloneResult({ ...cloneResult, folderName: data.name });
      }
      setClonedFoldersList(prev => {
        const updated = prev.map(f => f.id === fileId ? { ...f, name: data.name } : f);
        localStorage.setItem('cloned_folders', JSON.stringify(updated));
        return updated;
      });
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Rename failed');
    } finally {
      setRenaming(false);
    }
  };

  const deleteDuplicates = async (ids: string[]) => {
    if (!googleAccessToken || ids.length === 0) return;
    if (!confirm(`Permanently delete ${ids.length} files? This cannot be undone.`)) return;
    setScanning(true);
    try {
      const res = await fetch('/api/drive-api?action=delete-files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ access_token: googleAccessToken, file_ids: ids })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Deletion failed');
      alert(`Deleted ${data.deleted} files successfully.`);
      if (scanResult) {
        scanFolder(); // rescrawl
      }
    } catch (err: any) {
      alert(err.message || 'Deletion failed');
    } finally {
      setScanning(false);
    }
  };

  // ==========================================
  // Tab 2: Upload Files logic
  // ==========================================
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (!googleAccessToken) return;
    const files = e.dataTransfer.files;
    if (files) {
      addFilesToQueue(Array.from(files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      addFilesToQueue(Array.from(files));
    }
  };

  const addFilesToQueue = (files: File[]) => {
    const items = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      progress: 0,
      status: 'pending' as const,
      uploadedBytes: 0
    }));
    setUploadQueue(prev => [...prev, ...items]);
  };

  const removeQueueItem = (id: string) => {
    setUploadQueue(prev => prev.filter(q => q.id !== id));
  };

  const startUploadQueue = async () => {
    if (uploadQueue.length === 0 || !googleAccessToken) return;
    setUploading(true);
    setOverallProgress(0);
    const startTime = Date.now();
    const totalSize = uploadQueue.reduce((acc, f) => acc + f.size, 0);
    let uploadedTotalBytes = 0;

    for (const item of uploadQueue) {
      if (item.status === 'completed') continue;
      
      setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'uploading' } : q));

      const fileBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(item.file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
      });

      try {
        const res = await fetch('/api/drive-api?action=upload-file', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            access_token: googleAccessToken,
            file_name: item.name,
            file_content_base64: fileBase64,
            mime_type: item.type,
            parent_folder_id: destFolderId || 'root'
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');

        if (uploadToAllFolders && clonedFoldersList.length > 0 && data.id) {
          try {
            await fetch('/api/drive-api?action=upload-to-folders', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                access_token: googleAccessToken,
                file_id: data.id,
                folder_ids: clonedFoldersList.map(f => f.id)
              })
            });
          } catch (e) {}
        }

        setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'completed', progress: 100, uploadedBytes: item.size } : q));
        uploadedTotalBytes += item.size;
        
        const speed = uploadedTotalBytes / ((Date.now() - startTime) / 1000 || 1);
        setUploadSpeed(speed);
        setOverallProgress((uploadedTotalBytes / totalSize) * 100);
      } catch (err: any) {
        console.error(err);
        setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'error' } : q));
      }
    }
    setUploading(false);
    setOverallProgress(100);
    alert("Queue upload completed!");
  };

  // ==========================================
  // Tab 3: Manage Files logic
  // ==========================================
  const fetchFiles = async (loadMore = false) => {
    if (!googleAccessToken) return;
    setFilesLoading(true);
    try {
      const pageTokenVal = loadMore ? nextPageToken : null;
      const res = await fetch('/api/drive-api?action=list-all-files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          access_token: googleAccessToken,
          file_types: selectedTypes,
          page_token: pageTokenVal
        })
      });
      if (res.ok) {
        const data = await res.json();
        setFilesList(prev => loadMore ? [...prev, ...(data.files || [])] : (data.files || []));
        setNextPageToken(data.nextPageToken || null);
      }
    } catch (err) {
      console.error('Fetch files error:', err);
    } finally {
      setFilesLoading(false);
    }
  };

  const handleSingleDelete = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      const res = await fetch('/api/drive-api?action=delete-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ access_token: googleAccessToken, file_id: fileId })
      });
      if (res.ok) {
        setFilesList(prev => prev.filter(f => f.id !== fileId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFileIds.size === 0) return;
    if (!confirm(`Are you sure you want to permanently delete these ${selectedFileIds.size} files?`)) return;
    setFilesLoading(true);
    try {
      const res = await fetch('/api/drive-api?action=delete-files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ access_token: googleAccessToken, file_ids: Array.from(selectedFileIds) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      alert(`Deleted ${data.deleted} files successfully.`);
      setFilesList(prev => prev.filter(f => !selectedFileIds.has(f.id)));
      setSelectedFileIds(new Set());
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    } finally {
      setFilesLoading(false);
    }
  };

  const toggleSelectFile = (fileId: string) => {
    setSelectedFileIds(prev => {
      const next = new Set(prev);
      if (next.has(fileId)) next.delete(fileId);
      else next.add(fileId);
      return next;
    });
  };

  const toggleSelectAllFiles = () => {
    if (selectedFileIds.size === filesList.length) {
      setSelectedFileIds(new Set());
    } else {
      setSelectedFileIds(new Set(filesList.map(f => f.id)));
    }
  };

  // Group duplicate filenames
  const getDuplicateGroups = () => {
    const counts: { [name: string]: any[] } = {};
    filesList.forEach(f => {
      const lower = f.name.toLowerCase();
      if (!counts[lower]) counts[lower] = [];
      counts[lower].push(f);
    });
    return Object.entries(counts).filter(([_, list]) => list.length > 1);
  };

  // ==========================================
  // Tab 4: Watermark PDF logic
  // ==========================================
  const generatePDFDoc = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();
    
    // Background Dark Purple
    doc.setFillColor(15, 15, 20);
    doc.rect(0, 0, width, height, 'F');
    
    // Gold borders top & bottom
    doc.setFillColor(255, 200, 0);
    doc.rect(0, 0, width, 8, 'F');
    doc.rect(0, height - 8, width, 8, 'F');
    
    let yPos = 90;
    
    // Logo embed
    if (logoUrl) {
      try {
        doc.addImage(logoUrl, 'PNG', width / 2 - 50, yPos, 100, 100);
        yPos += 120;
      } catch (err) {
        console.warn("Logo embed failed:", err);
      }
    }
    
    // Brand Name
    doc.setTextColor(255, 200, 0);
    doc.setFontSize(34);
    doc.setFont('helvetica', 'bold');
    doc.text(brandName || 'ShahJI Drive', width / 2, yPos, { align: 'center' });
    yPos += 44;
    
    // Category Badge
    doc.setFillColor(255, 200, 0);
    const catText = (category || 'Educational Course').toUpperCase();
    doc.setFontSize(11);
    const textWidth = doc.getTextWidth(catText) + 30;
    doc.roundedRect(width / 2 - textWidth / 2, yPos - 14, textWidth, 22, 11, 11, 'F');
    
    doc.setTextColor(15, 15, 20);
    doc.text(catText, width / 2, yPos, { align: 'center' });
    yPos += 50;
    
    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    const displayTitle = pdfTitle || category;
    const titleLines = doc.splitTextToSize(displayTitle, width - 100);
    doc.text(titleLines, width / 2, yPos, { align: 'center' });
    yPos += titleLines.length * 26 + 16;
    
    // Tagline
    if (tagline) {
      doc.setFontSize(13);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(200, 200, 200);
      const tagLines = doc.splitTextToSize(tagline, width - 120);
      doc.text(tagLines, width / 2, yPos, { align: 'center' });
      yPos += tagLines.length * 18 + 16;
    }
    
    // Clickable link
    if (channelLink) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 200, 255);
      const linkLabel = "👉 Join Our Channel";
      const labelWidth = doc.getTextWidth(linkLabel);
      const startX = width / 2 - labelWidth / 2;
      doc.textWithLink(linkLabel, startX, yPos, { url: channelLink });
      yPos += 18;
      
      doc.setFontSize(9);
      doc.setTextColor(140, 180, 220);
      const linkLines = doc.splitTextToSize(channelLink, width - 80);
      linkLines.forEach((line: string, index: number) => {
        const lineW = doc.getTextWidth(line);
        doc.textWithLink(line, width / 2 - lineW / 2, yPos + index * 12, { url: channelLink });
      });
      yPos += linkLines.length * 12 + 10;
    }
    
    // Footer credits
    doc.setFontSize(10);
    doc.setTextColor(160, 160, 160);
    doc.text(`Provided by ${brandName || 'ShahJI Drive'}`, width / 2, height - 40, { align: 'center' });
    doc.text(`© ${new Date().getFullYear()} — All Rights Reserved`, width / 2, height - 24, { align: 'center' });
    
    return doc;
  };

  const handleAiFill = async () => {
    if (!aiPrompt.trim()) {
      alert("Please describe your PDF content first!");
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai-pdf-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompt: aiPrompt })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI Failed');
      
      if (data.brand) setBrandName(data.brand);
      if (data.title) setPdfTitle(data.title);
      if (data.tagline) setTagline(data.tagline);
      if (data.category) setCategory(data.category);
      if (data.channel_link) setChannelLink(data.channel_link);
      alert("Form fields automatically completed by AI!");
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'AI generation failed');
    } finally {
      setAiLoading(false);
    }
  };

  const generateWatermarkPdf = async (downloadOnlyMode: boolean) => {
    if (!brandName.trim() && !pdfTitle.trim()) {
      alert("Please enter a brand name or title first.");
      return;
    }
    setPdfGenerating(true);
    try {
      const doc = generatePDFDoc();
      const filename = `${(brandName || 'ShahJI').replace(/\s+/g, '_')}_${(pdfTitle || category).replace(/\s+/g, '_')}.pdf`;
      
      if (downloadOnlyMode || !googleAccessToken) {
        doc.save(filename);
        alert("Watermark PDF downloaded successfully!");
        return;
      }
      
      const pdfBlob = doc.output('blob');
      const reader = new FileReader();
      reader.readAsDataURL(pdfBlob);
      reader.onloadend = async () => {
        const base64data = (reader.result as string).split(',')[1];
        
        try {
          const res = await fetch('/api/drive-api?action=upload-file', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              access_token: googleAccessToken,
              file_name: filename,
              file_content_base64: base64data,
              mime_type: 'application/pdf',
              parent_folder_id: targetFolderId || 'root'
            })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Upload failed');
          
          if (uploadToCloned && clonedFoldersList.length > 0 && data.id) {
            await fetch('/api/drive-api?action=upload-to-folders', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                access_token: googleAccessToken,
                file_id: data.id,
                folder_ids: clonedFoldersList.map(f => f.id)
              })
            });
            alert(`Watermark PDF uploaded and copied to ${clonedFoldersList.length} folders successfully!`);
          } else {
            alert("Watermark PDF generated and uploaded to your Drive!");
          }
        } catch (uploadErr: any) {
          console.error(uploadErr);
          alert(`Upload failed: ${uploadErr.message}`);
        }
      };
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to generate PDF');
    } finally {
      setPdfGenerating(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setLogoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-background text-white flex flex-col md:flex-row relative overflow-x-hidden">
      {/* SEO Metadata (Hoisted by React 19) */}
      <title>Dashboard | ShahJI Drive</title>
      <meta name="description" content="Manage your Google Drive connections, clone folders, bulk upload files, and watermark PDFs." />
      <link rel="canonical" href={canonicalUrl('/dashboard')} />
      
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbListJsonLd([
          { name: "Home", url: canonicalUrl('/') },
          { name: "Dashboard", url: canonicalUrl('/dashboard') }
        ]))}
      </script>

      {/* Mobile Top Sticky Header Bar */}
      <header className="md:hidden flex items-center justify-between p-4 bg-card border-b border-border z-30 sticky top-0">
        <div className="flex items-center gap-2 cursor-pointer animate-fade-in" onClick={() => navigate('/')}>
          <div className="h-8 w-8 rounded-lg overflow-hidden flex items-center justify-center bg-zinc-900 border border-white/10 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
            <img src="/logo.png" alt="ShahJI Drive Logo" className="h-full w-full object-cover" />
          </div>
          <span className="font-extrabold text-sm tracking-tight">ShahJI Drive</span>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 hover:bg-zinc-850 rounded-lg text-muted-foreground hover:text-white transition-colors cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-45 md:hidden animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-card border-r border-border p-6 flex flex-col justify-between shrink-0 select-none z-50 transition-transform duration-350 md:relative md:translate-x-0 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="space-y-8">
          {/* Brand Logo with hover rotation & mobile close button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => { navigate('/'); setMobileMenuOpen(false); }}>
              <div className="h-9 w-9 rounded-xl overflow-hidden flex items-center justify-center bg-zinc-900 border border-white/10 shadow-md transition-transform duration-300 group-hover:rotate-12 group-hover:scale-105">
                <img src="/logo.png" alt="ShahJI Drive Logo" className="h-full w-full object-cover" />
              </div>
              <div className="font-extrabold text-lg tracking-tight text-white group-hover:text-primary transition-colors">SHAHJI DRIVE</div>
            </div>
            
            {/* Close Button on Mobile Drawer */}
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1.5 hover:bg-zinc-800 rounded-lg text-muted-foreground hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Account Tier Status Panel */}
          <div className="p-4 bg-zinc-950/40 border border-border/50 rounded-xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-secondary to-primary" />
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1.5">Account Status</div>
            <div className="text-sm font-extrabold text-gradient-primary capitalize flex items-center gap-2">
              <Crown className="h-4 w-4 text-primary animate-pulse" /> {user?.subscription_tier}
            </div>
          </div>

          {/* Sidebar Nav List with left-sliding neon indicator stripes */}
          <nav className="space-y-1.5">
            <button 
              onClick={() => { setActiveTab('clone'); setMobileMenuOpen(false); }}
              className={`relative w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 group cursor-pointer ${
                activeTab === 'clone' 
                  ? 'bg-gradient-to-r from-secondary to-primary text-black shadow-[0_4px_15px_rgba(6,182,212,0.15)]' 
                  : 'text-muted-foreground hover:text-white hover:bg-zinc-900/30 hover:translate-x-1.5'
              }`}
            >
              {!activeTab || activeTab !== 'clone' ? (
                <div className="absolute left-1 w-1 h-5 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-3 group-hover:translate-x-0" />
              ) : null}
              <FolderPlus className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:scale-110" /> 
              <span>Clone Folder</span>
            </button>

            <button 
              onClick={() => { setActiveTab('upload'); setMobileMenuOpen(false); }}
              className={`relative w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 group cursor-pointer ${
                activeTab === 'upload' 
                  ? 'bg-gradient-to-r from-secondary to-primary text-black shadow-[0_4px_15px_rgba(6,182,212,0.15)]' 
                  : 'text-muted-foreground hover:text-white hover:bg-zinc-900/30 hover:translate-x-1.5'
              }`}
            >
              {!activeTab || activeTab !== 'upload' ? (
                <div className="absolute left-1 w-1 h-5 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-3 group-hover:translate-x-0" />
              ) : null}
              <Upload className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:scale-110" /> 
              <span>Upload Files</span>
            </button>
            
            <button 
              onClick={() => { setActiveTab('manage'); setMobileMenuOpen(false); }}
              className={`relative w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 group cursor-pointer ${
                activeTab === 'manage' 
                  ? 'bg-gradient-to-r from-secondary to-primary text-black shadow-[0_4px_15px_rgba(6,182,212,0.15)]' 
                  : 'text-muted-foreground hover:text-white hover:bg-zinc-900/30 hover:translate-x-1.5'
              }`}
            >
              {!activeTab || activeTab !== 'manage' ? (
                <div className="absolute left-1 w-1 h-5 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-3 group-hover:translate-x-0" />
              ) : null}
              <FolderOpen className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:scale-110" /> 
              <span>Manage Files</span>
            </button>

            <button 
              onClick={() => { setActiveTab('watermark'); setMobileMenuOpen(false); }}
              className={`relative w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 group cursor-pointer ${
                activeTab === 'watermark' 
                  ? 'bg-gradient-to-r from-secondary to-primary text-black shadow-[0_4px_15px_rgba(6,182,212,0.15)]' 
                  : 'text-muted-foreground hover:text-white hover:bg-zinc-900/30 hover:translate-x-1.5'
              }`}
            >
              {!activeTab || activeTab !== 'watermark' ? (
                <div className="absolute left-1 w-1 h-5 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-3 group-hover:translate-x-0" />
              ) : null}
              <FileSignature className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:scale-110" /> 
              <span>Watermark PDF</span>
            </button>

            {/* Gradient Separator */}
            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-5" />

            <button 
              onClick={() => { navigate('/coupon'); setMobileMenuOpen(false); }}
              className="relative w-full flex items-center gap-3 px-4 py-3.5 text-muted-foreground hover:text-white hover:bg-zinc-900/30 hover:translate-x-1.5 rounded-xl text-sm font-bold transition-all duration-300 group cursor-pointer"
            >
              <div className="absolute left-1 w-1 h-5 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-3 group-hover:translate-x-0" />
              <FileText className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:scale-110" /> 
              <span>Redeem Coupon</span>
            </button>

            <button 
              onClick={() => { navigate('/api-keys'); setMobileMenuOpen(false); }}
              className="relative w-full flex items-center gap-3 px-4 py-3.5 text-muted-foreground hover:text-white hover:bg-zinc-900/30 hover:translate-x-1.5 rounded-xl text-sm font-bold transition-all duration-300 group cursor-pointer"
            >
              <div className="absolute left-1 w-1 h-5 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-3 group-hover:translate-x-0" />
              <Key className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:scale-110" /> 
              <span>Developer API</span>
            </button>

            {isAdmin && (
              <button 
                onClick={() => { navigate('/admin'); setMobileMenuOpen(false); }}
                className="relative w-full flex items-center gap-3 px-4 py-3.5 text-primary hover:text-white hover:bg-zinc-900/30 hover:translate-x-1.5 rounded-xl text-sm font-bold transition-all duration-300 group cursor-pointer"
              >
                <div className="absolute left-1 w-1 h-5 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-3 group-hover:translate-x-0" />
                <Crown className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:scale-110" /> 
                <span>Admin Console</span>
              </button>
            )}
          </nav>
        </div>

        {/* Bottom Sign Out button */}
        <button 
          onClick={() => { signOut(); setMobileMenuOpen(false); }}
          className="relative w-full flex items-center gap-3 px-4 py-3.5 text-red-500 hover:text-red-400 hover:bg-red-500/5 hover:translate-x-1.5 rounded-xl text-sm font-bold transition-all duration-300 group mt-8 cursor-pointer"
        >
          <div className="absolute left-1 w-1 h-5 rounded-full bg-red-500 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-3 group-hover:translate-x-0" />
          <LogOut className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:scale-110" /> 
          <span>Sign Out</span>
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 md:p-12 overflow-y-auto w-full">
        {bannerVisible && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-primary/30 bg-primary/10 p-4 glow-purple">
            <div className="flex items-center gap-3">
              <div className="rounded-full p-2 bg-primary/20 text-primary">
                <Crown className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <div className="font-bold">Current Speed: {user?.subscription_tier !== 'free' ? '1000x (Pro)' : '100x (Free)'}</div>
                <div className="text-xs text-muted-foreground">Upgrade to Pro/Premium for 1000x speed, unlimited watermark replications and developer keys!</div>
              </div>
            </div>
            <button onClick={() => setBannerVisible(false)} className="text-xs text-muted-foreground hover:text-white font-bold">&times; Close</button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8 pb-4 border-b border-border">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold capitalize">
            {activeTab === 'clone' ? 'Clone Folder' : activeTab === 'upload' ? 'Upload Files' : activeTab === 'manage' ? 'Manage Files' : 'Watermark PDF'}
          </h1>
          
          {/* Connection state */}
          {googleAccessToken ? (
            <div className="flex items-center gap-4">
              <span className="text-xs text-green-500 font-bold bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <CheckCircle className="h-3 w-3" /> Drive Connected
              </span>
              <button 
                onClick={disconnectGoogleDrive}
                className="text-xs text-muted-foreground hover:text-white underline"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button 
              onClick={connectGoogleDrive}
              className="px-4 py-2 bg-primary text-black text-xs font-bold rounded-xl hover:scale-[1.01] transition-transform flex items-center gap-2"
            >
              Connect Google Drive
            </button>
          )}
        </div>

        {/* Outer grid split layout */}
        <div className="grid gap-5 sm:gap-8 lg:grid-cols-2">
          
          {/* LEFT PANEL: Action controls per tab */}
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6">
            
            {/* TAB 1: Clone Folder */}
            {activeTab === 'clone' && (
              <div className="space-y-6">
                {!googleAccessToken && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 rounded-xl p-4 flex gap-3 text-sm">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold mb-1">Google Drive Disconnected</h4>
                      <p>You must connect your Google Drive account using the button at the top-right before you can run folder cloning operations.</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleCloneSubmit} className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">Google Drive Folder Link</label>
                    <input 
                      type="text"
                      required
                      placeholder="https://drive.google.com/drive/folders/..."
                      value={folderLink}
                      onChange={(e) => setFolderLink(e.target.value)}
                      disabled={!googleAccessToken || cloning}
                      className="w-full bg-zinc-900 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-sm"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={scanFolder}
                      disabled={scanning || !googleAccessToken || !folderLink}
                      className="px-4 py-2 border border-border text-sm font-semibold rounded-xl hover:bg-zinc-800 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {scanning ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Scan Folder First'}
                    </button>
                    {scanResult && (
                      <span className="self-center text-xs text-muted-foreground">
                        Found {scanResult.folders} folders · {scanResult.files} files · {scanResult.pdfs} PDFs
                      </span>
                    )}
                  </div>

                  {/* Scan Deep Analysis Results Card */}
                  {scanResult && (
                    <div className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-foreground">📊 Scan Summary: {scanResult.folder_name}</h4>
                        <span className="text-xs text-muted-foreground">in {scanResult.duration}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-zinc-900 border border-border rounded p-2">
                          <div className="font-bold text-primary">{scanResult.folders}</div>
                          <div className="text-[10px] text-muted-foreground">Folders</div>
                        </div>
                        <div className="bg-zinc-900 border border-border rounded p-2">
                          <div className="font-bold text-primary">{scanResult.files}</div>
                          <div className="text-[10px] text-muted-foreground">Files</div>
                        </div>
                        <div className="bg-zinc-900 border border-border rounded p-2">
                          <div className="font-bold text-primary">{scanResult.pdfs}</div>
                          <div className="text-[10px] text-muted-foreground">PDFs</div>
                        </div>
                      </div>

                      {scanResult.duplicates?.length > 0 && (
                        <div className="border border-yellow-500/20 bg-yellow-500/5 p-3 rounded-lg text-xs space-y-2">
                          <div className="font-bold text-yellow-500">Repeated Filenames Detected</div>
                          <div className="max-h-24 overflow-y-auto space-y-1">
                            {scanResult.duplicates.slice(0, 5).map((d: any) => (
                              <div key={d.name} className="flex justify-between text-muted-foreground">
                                <span className="truncate pr-2">{d.name}</span>
                                <span>x{d.count}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {scanResult.watermarks?.length > 0 && (
                        <div className="border border-amber-500/20 bg-amber-500/5 p-3 rounded-lg text-xs space-y-2">
                          <div className="flex justify-between items-center font-bold text-amber-500">
                            <span>Watermark/Promo Links Matched ({scanResult.watermarks.length})</span>
                            <button
                              type="button"
                              onClick={() => deleteDuplicates(scanResult.watermarks.map((w: any) => w.id))}
                              className="text-[10px] text-red-500 underline font-bold"
                            >
                              Delete All Promo Items
                            </button>
                          </div>
                          <div className="max-h-24 overflow-y-auto space-y-1">
                            {scanResult.watermarks.slice(0, 5).map((w: any) => (
                              <div key={w.id} className="text-muted-foreground truncate">
                                {w.isFolder ? '📁' : '📄'} {w.name} <span className="text-[10px] bg-amber-500/20 text-amber-600 px-1 rounded">{w.pattern}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">Rename Folder Before Cloning (Optional)</label>
                    <input 
                      type="text"
                      placeholder="Leave blank to keep original name"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      disabled={!googleAccessToken || cloning}
                      className="w-full bg-zinc-900 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">Remove Word (Optional)</label>
                      <input 
                        type="text"
                        placeholder="e.g. [PROMO]"
                        value={removeWord}
                        onChange={(e) => setRemoveWord(e.target.value)}
                        disabled={!googleAccessToken || cloning}
                        className="w-full bg-zinc-900 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">Append Credit (Optional)</label>
                      <input 
                        type="text"
                        placeholder="e.g. - ShahJIDrive"
                        value={creditText}
                        onChange={(e) => setCreditText(e.target.value)}
                        disabled={!googleAccessToken || cloning}
                        className="w-full bg-zinc-900 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">Destination Directory</label>
                    <select
                      value={destFolderId}
                      onChange={(e) => setDestFolderId(e.target.value)}
                      disabled={!googleAccessToken || cloning || foldersLoading}
                      className="w-full bg-zinc-900 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-sm"
                    >
                      <option value="root">My Drive (Root)</option>
                      {rootFolders.map((f: any) => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={!googleAccessToken || cloning}
                    className="w-full py-4 bg-primary text-black font-bold text-lg rounded-xl hover:scale-[1.01] transition-transform flex items-center justify-center gap-2 glow-gold disabled:opacity-50"
                  >
                    {cloning ? (
                      <>
                        <RefreshCw className="h-5 w-5 animate-spin" /> Cloning Files...
                      </>
                    ) : (
                      <>
                        <FolderSymlink className="h-5 w-5" /> Start Folder Clone
                      </>
                    )}
                  </button>
                </form>

                {cloneStatus && (
                  <div className="bg-zinc-900 border border-border rounded-xl p-4 text-sm font-mono text-center">
                    {cloneStatus}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Upload Files */}
            {activeTab === 'upload' && (
              <div className="space-y-6">
                {!googleAccessToken && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 rounded-xl p-4 flex gap-3 text-sm">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold mb-1">Google Drive Disconnected</h4>
                      <p>Connect your Google Drive account before uploading files.</p>
                    </div>
                  </div>
                )}

                <div 
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`cursor-pointer rounded-xl border-2 border-dashed p-6 sm:p-8 text-center transition-all ${
                    googleAccessToken 
                      ? isDragging ? 'border-primary bg-primary/10' : 'border-border bg-muted/20 hover:border-primary/50'
                      : 'cursor-not-allowed opacity-50'
                  }`}
                >
                  <input 
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={!googleAccessToken}
                  />
                  <div className="mb-4 inline-flex rounded-full bg-primary/10 p-4">
                    <Upload className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">Drop files here</h3>
                  <p className="text-sm text-muted-foreground">or click to browse from your computer</p>
                </div>

                {uploadQueue.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm">Queue ({uploadQueue.length} files)</span>
                      <span className="text-xs text-muted-foreground">
                        Total size: {formatBytes(uploadQueue.reduce((acc, f) => acc + f.size, 0))}
                      </span>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-2 border border-border rounded-xl p-2 bg-zinc-900/30">
                      {uploadQueue.map(item => (
                        <div key={item.id} className="p-3 border border-border rounded-lg bg-zinc-950 flex items-center justify-between text-xs gap-3">
                          <div className="truncate flex-1">
                            <div className="font-semibold truncate">{item.name}</div>
                            <div className="text-muted-foreground">{formatBytes(item.size)}</div>
                          </div>

                          <div className="flex items-center gap-3">
                            {item.status === 'completed' && <span className="text-green-500 font-bold">✓ Done</span>}
                            {item.status === 'uploading' && <span className="text-primary font-mono">{item.progress.toFixed(0)}%</span>}
                            {item.status === 'error' && <span className="text-red-500">Error</span>}
                            {item.status === 'pending' && (
                              <button 
                                onClick={() => removeQueueItem(item.id)}
                                className="text-muted-foreground hover:text-red-500 p-1"
                              >
                                &times;
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-lg border border-border p-4 bg-zinc-900/30 flex justify-between items-center text-xs">
                      <div>
                        <div className="font-semibold">Upload to All Cloned Folders</div>
                        <div className="text-muted-foreground">Replicates file copy inside your cloned directories list</div>
                      </div>
                      <input 
                        type="checkbox"
                        checked={uploadToAllFolders}
                        onChange={(e) => setUploadToAllFolders(e.target.checked)}
                        className="h-5 w-5 rounded border-border accent-primary cursor-pointer"
                      />
                    </div>

                    <button
                      onClick={startUploadQueue}
                      disabled={uploading || !googleAccessToken}
                      className="w-full py-3 bg-primary text-black font-bold rounded-xl hover:scale-[1.01] transition-transform flex justify-center items-center gap-2 disabled:opacity-50"
                    >
                      <Upload className="h-4 w-4" /> Start Uploading Queue
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Manage Files */}
            {activeTab === 'manage' && (
              <div className="space-y-6">
                {!googleAccessToken && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 rounded-xl p-4 flex gap-3 text-sm">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold mb-1">Google Drive Disconnected</h4>
                      <p>Connect your Google Drive account before managing files.</p>
                    </div>
                  </div>
                )}

                {googleAccessToken && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2 justify-between items-center">
                      <div className="flex gap-2">
                        <button
                          onClick={() => fetchFiles(false)}
                          disabled={filesLoading}
                          className="px-4 py-2 border border-border text-xs font-semibold rounded-xl hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
                        >
                          <RefreshCw className={`h-3 w-3 ${filesLoading ? 'animate-spin' : ''}`} /> Refresh
                        </button>
                        <button
                          onClick={() => setShowDuplicates(!showDuplicates)}
                          className={`px-4 py-2 text-xs font-semibold border rounded-xl transition-colors ${showDuplicates ? 'bg-primary text-black border-primary' : 'border-border hover:bg-zinc-800'}`}
                        >
                          Show Duplicates ({getDuplicateGroups().length})
                        </button>
                      </div>

                      {filesList.length > 0 && (
                        <div className="flex gap-2 text-xs">
                          <button onClick={toggleSelectAllFiles} className="underline text-muted-foreground hover:text-white">
                            {selectedFileIds.size === filesList.length ? 'Deselect All' : 'Select All'}
                          </button>
                          {selectedFileIds.size > 0 && (
                            <button onClick={handleBulkDelete} className="text-red-500 font-bold hover:underline">
                              Delete ({selectedFileIds.size})
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {filesLoading && filesList.length === 0 ? (
                      <div className="flex justify-center items-center py-20">
                        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : showDuplicates ? (
                      <div className="space-y-2">
                        <h4 className="text-xs uppercase font-bold text-muted-foreground mb-2">Duplicate Filenames</h4>
                        {getDuplicateGroups().length === 0 ? (
                          <div className="text-center py-10 border border-border rounded-xl text-muted-foreground text-sm">
                            No duplicate filenames found.
                          </div>
                        ) : (
                          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                            {getDuplicateGroups().map(([name, list]) => (
                              <div key={name} className="p-3 border border-border rounded-xl bg-zinc-950 flex items-center justify-between text-xs">
                                <div>
                                  <div className="font-semibold text-foreground truncate max-w-[220px]">{list[0].name}</div>
                                  <div className="text-muted-foreground">{list.length} duplicate copies</div>
                                </div>
                                <button
                                  onClick={() => deleteDuplicates(list.slice(1).map(f => f.id))}
                                  className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white font-bold rounded-lg transition-colors"
                                >
                                  Clean Duplicates
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : filesList.length === 0 ? (
                      <div className="text-center py-14 border border-border rounded-xl text-muted-foreground text-sm">
                        No files matching selection. Click Refresh to load.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                        {filesList.map(f => {
                          const isSelected = selectedFileIds.has(f.id);
                          return (
                            <div 
                              key={f.id}
                              onClick={() => toggleSelectFile(f.id)}
                              className={`p-3 border rounded-xl flex items-center justify-between text-xs cursor-pointer transition-colors ${
                                isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-zinc-900/40'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <input 
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}} // handled by row click
                                  className="h-4 w-4 accent-primary"
                                />
                                <div className="truncate">
                                  <div className="font-semibold truncate">{f.name}</div>
                                  <div className="text-muted-foreground">{formatBytes(parseInt(f.size || '0'))}</div>
                                </div>
                              </div>

                              <button 
                                onClick={(e) => { e.stopPropagation(); handleSingleDelete(f.id); }}
                                className="p-2 hover:bg-red-500/10 rounded-lg text-red-500 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          );
                        })}
                        {nextPageToken && (
                          <button
                            onClick={() => fetchFiles(true)}
                            className="w-full py-2 border border-border text-xs rounded-xl hover:bg-zinc-900 transition-colors"
                          >
                            Load More Files
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: Watermark PDF */}
            {activeTab === 'watermark' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-zinc-900 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-sm"
                  >
                    {["Educational Course","Business / Marketing","Programming / Tech","Design / Creative","Finance / Trading","Health / Fitness","Self Development","Language Learning","Other"].map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">Brand Name</label>
                    <input 
                      type="text"
                      placeholder="e.g. ShahJI Drive"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      className="w-full bg-zinc-900 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">Course / PDF Title</label>
                    <input 
                      type="text"
                      placeholder="e.g. Complete Mastery 2025"
                      value={pdfTitle}
                      onChange={(e) => setPdfTitle(e.target.value)}
                      className="w-full bg-zinc-900 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">Tagline (Optional)</label>
                  <input 
                    type="text"
                    placeholder="e.g. The premium learning experience"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="w-full bg-zinc-900 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">Promo Link (Clickable in PDF)</label>
                  <input 
                    type="text"
                    placeholder="https://whatsapp.com/channel/..."
                    value={channelLink}
                    onChange={(e) => setChannelLink(e.target.value)}
                    className="w-full bg-zinc-900 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-sm"
                  />
                </div>

                <div className="border border-secondary/20 bg-secondary/5 p-4 rounded-xl space-y-3">
                  <label className="text-xs font-bold uppercase text-secondary flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4" /> AI Auto-Fill Form
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="Describe course (e.g. Python backend by Taqi)"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      className="flex-1 bg-zinc-950 border border-border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-secondary"
                    />
                    <button
                      type="button"
                      onClick={handleAiFill}
                      disabled={aiLoading}
                      className="px-4 py-2 bg-secondary text-black text-xs font-bold rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center gap-1 shrink-0"
                    >
                      {aiLoading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} AI Fill
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">Brand Logo Image (PNG/JPG)</label>
                  <input 
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="block w-full text-xs text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-xs file:font-semibold file:text-black cursor-pointer"
                  />
                  {logoUrl && (
                    <img src={logoUrl} alt="Logo" className="mt-2 h-14 w-14 rounded border border-border object-contain bg-white p-1" />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">Upload to Drive Folder ID (Optional)</label>
                  <input 
                    type="text"
                    placeholder="Leave blank for root"
                    value={targetFolderId}
                    onChange={(e) => setTargetFolderId(e.target.value)}
                    className="w-full bg-zinc-900 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-sm"
                  />
                </div>

                <div className="rounded-xl border border-border p-4 bg-zinc-900/30 flex justify-between items-center text-xs">
                  <div>
                    <div className="font-semibold">Replicate to Cloned Folders</div>
                    <div className="text-muted-foreground">Uploads a copy of the PDF to all directories in your cloned list</div>
                  </div>
                  <input 
                    type="checkbox"
                    checked={uploadToCloned}
                    onChange={(e) => setUploadToCloned(e.target.checked)}
                    className="h-5 w-5 rounded border-border accent-primary cursor-pointer"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => generateWatermarkPdf(false)}
                    disabled={pdfGenerating || !googleAccessToken}
                    className="flex-1 py-3 bg-primary text-black font-bold rounded-xl hover:scale-[1.01] transition-transform flex justify-center items-center gap-2 disabled:opacity-50"
                  >
                    <FileSignature className="h-4 w-4" /> Generate & Upload
                  </button>
                  <button
                    onClick={() => generateWatermarkPdf(true)}
                    disabled={pdfGenerating}
                    className="px-5 py-3 border border-border text-sm font-semibold rounded-xl hover:bg-zinc-800 transition-colors flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" /> Download Only
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* RIGHT PANEL: Live Feedback / Progress / PDF Preview */}
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6">
            
            {/* Real-time PDF preview pane */}
            {activeTab === 'watermark' ? (
              <div className="space-y-4">
                <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-primary" /> Live PDF Preview
                </div>
                
                <div className="overflow-hidden rounded-xl border border-border bg-zinc-900/40">
                  {pdfPreviewUrl ? (
                    <iframe 
                      src={pdfPreviewUrl}
                      title="PDF Preview"
                      className="h-[500px] w-full bg-white border-0"
                    />
                  ) : (
                    <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground">
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Rendering A4 page...
                    </div>
                  )}
                </div>
                <div className="text-[10px] text-muted-foreground text-center">
                  Updates automatically as you type. Click the promo links inside the PDF preview frame to test.
                </div>
              </div>
            ) : uploading && activeTab === 'upload' ? (
              <div className="space-y-6">
                <h3 className="font-bold text-lg">Upload Progress</h3>
                <div className="rounded-xl bg-zinc-900/40 p-6 border border-border">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="font-semibold text-xs text-muted-foreground">Overall Completion</span>
                    <span className="font-mono text-2xl font-bold text-primary">{overallProgress.toFixed(1)}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-zinc-800">
                    <div className="h-full bg-primary transition-all duration-300" style={{ width: `${overallProgress}%` }} />
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Speed: <span className="font-mono text-primary font-bold">{formatBytes(uploadSpeed)}/s</span></span>
                    <span>{uploadQueue.filter(q => q.status === 'completed').length} / {uploadQueue.length} files</span>
                  </div>
                </div>
              </div>
            ) : cloneResult && activeTab === 'clone' ? (
              <div className="space-y-6">
                <div className="flex items-center gap-3 rounded-xl bg-green-500/10 border border-green-500/20 p-4">
                  <Check className="h-6 w-6 text-green-500" />
                  <div>
                    <h3 className="font-bold text-foreground truncate max-w-[200px]">{cloneResult.folderName}</h3>
                    <p className="text-xs text-muted-foreground">Cloned successfully in {cloneResult.time}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-border bg-zinc-900/30 p-4 text-center">
                    <div className="text-xl font-extrabold text-foreground">{cloneResult.size}</div>
                    <div className="text-xs text-muted-foreground">Total Size</div>
                  </div>
                  <div className="rounded-xl border border-border bg-zinc-900/30 p-4 text-center">
                    <div className="text-xl font-extrabold text-foreground">{cloneResult.files}</div>
                    <div className="text-xs text-muted-foreground">Files Copied</div>
                  </div>
                </div>

                <div className="flex gap-3 text-xs">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(`https://drive.google.com/drive/folders/${cloneResult.folderId}`);
                      alert("Drive link copied to clipboard!");
                    }}
                    className="flex-1 py-3 border border-border rounded-xl font-bold hover:bg-zinc-800 transition-colors"
                  >
                    Copy Folder Link
                  </button>
                  <button 
                    onClick={() => window.open(`https://drive.google.com/drive/folders/${cloneResult.folderId}`, '_blank')}
                    className="flex-1 py-3 bg-zinc-850 text-white rounded-xl font-bold hover:bg-zinc-800 transition-colors"
                  >
                    Open in Drive
                  </button>
                </div>

                <div className="space-y-3 rounded-xl border border-border bg-zinc-900/20 p-4">
                  <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">Rename Cloned Folder</label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="New folder name"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="flex-1 bg-zinc-950 border border-border rounded-xl px-4 py-2 text-xs focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => renameFolder(cloneResult.folderId, newName)}
                      disabled={renaming || !newName.trim()}
                      className="px-4 py-2 bg-primary text-black text-xs font-bold rounded-xl disabled:opacity-50"
                    >
                      {renaming ? '...' : 'Rename'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground text-sm space-y-4">
                <div className="rounded-full bg-zinc-900 p-4 border border-border">
                  <Check className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Status Panel</h4>
                  <p className="text-xs">Operation logs and live analytics will populate here as you run tasks.</p>
                </div>
              </div>
            )}

          </div>

        </div>
      </main>

    </div>
  );
};
