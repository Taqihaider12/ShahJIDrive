import { canonicalUrl } from '../services/seo';
import { breadcrumbListJsonLd } from '../services/seo/structured-data';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/authContext';
import { 
  ArrowLeft, Plus, Copy, Trash2, 
  Eye, EyeOff, Check, RefreshCw, BookOpen 
} from 'lucide-react';

export const ApiKeys: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Create Key Form
  const [keyName, setKeyName] = useState('');
  const [expiryDays, setExpiryDays] = useState('30');
  const [allowedDomain, setAllowedDomain] = useState('');
  const [creating, setCreating] = useState(false);

  // UI state
  const [visibleKeys, setVisibleKeys] = useState<Set<number>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showDocs, setShowDocs] = useState(false);

  useEffect(() => {
    if (token) {
      fetchKeys();
    }
  }, [token]);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/api-keys', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setKeys(data);
      }
    } catch (err) {
      console.error('Fetch keys error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim() || !token) return;

    setCreating(true);
    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          key_name: keyName,
          expires_in_days: expiryDays,
          allowed_domain: allowedDomain || null
        })
      });
      if (res.ok) {
        setKeyName('');
        setAllowedDomain('');
        setExpiryDays('30');
        fetchKeys();
      }
    } catch (err) {
      console.error('Create key error:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleKey = async (keyId: number, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/api-keys/${keyId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: !currentActive })
      });
      if (res.ok) {
        fetchKeys();
      }
    } catch (err) {
      console.error('Toggle key error:', err);
    }
  };

  const handleDeleteKey = async (keyId: number) => {
    if (!confirm('Are you sure you want to delete this API key? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/api-keys/${keyId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchKeys();
      }
    } catch (err) {
      console.error('Delete key error:', err);
    }
  };

  const handleCopy = (keyText: string) => {
    navigator.clipboard.writeText(keyText);
    setCopiedKey(keyText);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleVisibility = (id: number) => {
    setVisibleKeys(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const baseUrl = `${window.location.origin}/api/drive-api`;

  const apiEndpoints = [
    {
      action: 'clone',
      desc: 'Clone a Google Drive folder recursively',
      body: `{
  "folder_link": "https://drive.google.com/drive/folders/1abc...",
  "access_token": "ya29...",
  "remove_word": "[PROMO]",
  "credit_text": "- shahji",
  "destination_folder_id": "root"
}`
    },
    {
      action: 'upload-file',
      desc: 'Upload a base64 encoded file',
      body: `{
  "access_token": "ya29...",
  "file_name": "example.txt",
  "file_content_base64": "SGVsbG8gV29ybGQ=",
  "mime_type": "text/plain",
  "parent_folder_id": "root"
}`
    },
    {
      action: 'list-folders',
      desc: 'List all folders inside parent ID',
      body: `{
  "access_token": "ya29...",
  "parent_id": "root"
}`
    }
  ];

  return (
    <div className="min-h-screen bg-background text-white p-6 md:p-12">
      {/* SEO Metadata (Hoisted by React 19) */}
      <title>Developer API Keys | ShahJI Drive</title>
      <meta name="description" content="Generate and manage developer tokens to access ShahJI Drive API programmatically." />
      <link rel="canonical" href={canonicalUrl('/api-keys')} />
      
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbListJsonLd([
          { name: "Home", url: canonicalUrl('/') },
          { name: "Dashboard", url: canonicalUrl('/dashboard') },
          { name: "Developer API Keys", url: canonicalUrl('/api-keys') }
        ]))}
      </script>

      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-zinc-800 rounded-lg text-muted-foreground hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-3xl font-extrabold text-gradient-purple">Developer Portal</h1>
          </div>

          <button
            onClick={() => setShowDocs(!showDocs)}
            className="px-4 py-2 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 rounded-xl border border-border flex items-center gap-1.5"
          >
            <BookOpen className="h-4 w-4" /> {showDocs ? 'View Keys' : 'View API Docs'}
          </button>
        </div>

        {!showDocs ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {/* Create API Key Form */}
            <form onSubmit={handleCreateKey} className="bg-card border border-border p-6 rounded-2xl space-y-4 shadow-xl glow-purple">
              <h3 className="text-lg font-bold mb-2">Generate API Key</h3>

              <div>
                <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">Key Name</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. My Uploader Script"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  disabled={creating}
                  className="w-full bg-zinc-900 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">Expiry Term</label>
                <select
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(e.target.value)}
                  disabled={creating}
                  className="w-full bg-zinc-900 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
                >
                  <option value="7">7 Days</option>
                  <option value="30">30 Days</option>
                  <option value="90">90 Days</option>
                  <option value="365">1 Year</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">Allowed Host Domain (Optional)</label>
                <input 
                  type="text"
                  placeholder="e.g. mysite.com"
                  value={allowedDomain}
                  onChange={(e) => setAllowedDomain(e.target.value)}
                  disabled={creating}
                  className="w-full bg-zinc-900 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <button
                type="submit"
                disabled={creating || !keyName.trim()}
                className="w-full py-3 bg-primary text-black font-bold rounded-xl hover:scale-105 transition-transform flex items-center justify-center gap-1.5"
              >
                {creating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Generate Key
              </button>
            </form>

            {/* List API Keys */}
            <div className="md:col-span-2 space-y-4">
              {loading ? (
                <div className="flex justify-center items-center py-20">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : keys.length === 0 ? (
                <div className="bg-card border border-border rounded-2xl py-20 text-center text-muted-foreground text-sm">
                  No active API keys found. Generate one in the form on the left.
                </div>
              ) : (
                keys.map(k => {
                  const visible = visibleKeys.has(k.id);
                  const isCopied = copiedKey === k.api_key;
                  return (
                    <div key={k.id} className={`bg-card border p-5 rounded-2xl space-y-4 shadow-lg ${k.is_active ? 'border-primary/20 bg-primary/5' : 'border-border opacity-65'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold">{k.key_name}</h4>
                          <span className="text-xs text-muted-foreground">Created: {new Date(k.created_at).toLocaleDateString()}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleToggleKey(k.id, k.is_active)}
                            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold rounded-lg border border-border transition-colors"
                          >
                            {k.is_active ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={() => handleDeleteKey(k.id)}
                            className="p-2 hover:bg-red-500/10 rounded-lg text-red-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 bg-black/40 border border-border rounded-xl p-3 font-mono text-xs">
                        <span className="flex-1 truncate">
                          {visible ? k.api_key : `${k.api_key.substring(0, 10)}****************************************`}
                        </span>
                        
                        <button 
                          onClick={() => toggleVisibility(k.id)}
                          className="p-1.5 hover:bg-zinc-800 rounded-lg text-muted-foreground hover:text-white transition-colors"
                        >
                          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button 
                          onClick={() => handleCopy(k.api_key)}
                          className="p-1.5 hover:bg-zinc-800 rounded-lg text-muted-foreground hover:text-white transition-colors"
                        >
                          {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
                        <div><strong>Allowed Domain:</strong> {k.allowed_domain || 'Any'}</div>
                        <div><strong>Usage Count:</strong> {k.usage_count} times</div>
                        <div><strong>Expires:</strong> {new Date(k.expires_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* Documentation Tab */
          <div className="bg-card border border-border p-8 rounded-2xl space-y-8 shadow-2xl overflow-hidden">
            <div>
              <h2 className="text-xl font-bold mb-2">Base URL</h2>
              <div className="bg-zinc-900 border border-border p-3 rounded-xl font-mono text-sm flex items-center justify-between">
                <span>{baseUrl}</span>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-2">Authentication Headers</h2>
              <p className="text-sm text-muted-foreground mb-3">Include your generated client token in the header of all HTTP calls:</p>
              <div className="bg-zinc-900 border border-border p-3 rounded-xl font-mono text-sm">
                x-api-key: dup_YOUR_TOKEN_HERE
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-xl font-bold">API Actions</h2>
              
              {apiEndpoints.map((ep, idx) => (
                <div key={idx} className="border border-border rounded-xl p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-primary/20 text-primary border border-primary/30 rounded text-xs font-bold">POST</span>
                    <span className="font-mono text-sm font-bold">?action={ep.action}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{ep.desc}</p>
                  <pre className="bg-black/30 border border-border p-3 rounded-xl text-xs overflow-x-auto font-mono">
                    {ep.body}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
