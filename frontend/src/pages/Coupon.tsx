import { canonicalUrl } from '../services/seo';
import { breadcrumbListJsonLd } from '../services/seo/structured-data';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/authContext';
import { ArrowLeft, Ticket, CheckCircle, RefreshCw } from 'lucide-react';

export const Coupon: React.FC = () => {
  const navigate = useNavigate();
  const { token, refreshProfile } = useAuth();
  
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !token) return;

    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch('/api/coupons/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ coupon_code: code.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus({ success: true, message: data.message });
        setCode('');
        if (refreshProfile) {
          await refreshProfile();
        }
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } else {
        setStatus({ success: false, message: data.error || 'Failed to redeem coupon' });
      }
    } catch (err) {
      setStatus({ success: false, message: 'Connection to server failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-white flex flex-col justify-center items-center px-6 py-12">
      {/* SEO Metadata (Hoisted by React 19) */}
      <title>Redeem Coupon | ShahJI Drive</title>
      <meta name="description" content="Redeem dynamic discount coupons and promotional codes for ShahJI Drive." />
      <link rel="canonical" href={canonicalUrl('/coupon')} />
      
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbListJsonLd([
          { name: "Home", url: canonicalUrl('/') },
          { name: "Dashboard", url: canonicalUrl('/dashboard') },
          { name: "Redeem Coupon", url: canonicalUrl('/coupon') }
        ]))}
      </script>

      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-2xl relative glow-gold">
        <div className="absolute top-6 left-6">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-zinc-800 rounded-lg text-muted-foreground hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col items-center text-center mt-6 mb-8">
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
            <Ticket className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold">Redeem Promo Coupon</h2>
          <p className="text-sm text-muted-foreground mt-2">Enter your coupon code below to unlock premium subscription tiers instantly.</p>
        </div>

        {status && (
          <div className={`p-4 border rounded-xl text-sm text-center mb-6 ${status.success ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleRedeem} className="space-y-4">
          <div>
            <input 
              type="text"
              required
              placeholder="ENTER COUPON CODE..."
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              disabled={loading}
              className="w-full h-14 bg-zinc-900 border border-border rounded-xl text-center text-lg font-mono font-bold tracking-widest focus:outline-none focus:border-primary placeholder:text-zinc-700"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full h-14 bg-primary text-black font-bold rounded-xl transition-all hover:scale-[1.01] flex items-center justify-center gap-2 glow-gold disabled:opacity-50"
          >
            {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : 'Redeem Coupon'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-border">
          <h4 className="text-xs font-bold uppercase text-muted-foreground mb-4 text-center">What is included in Pro:</h4>
          <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-green-500" /> Turbo Speeds (50MB/s)
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-green-500" /> Unlimited Clones
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-green-500" /> Remove Word Filter
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-green-500" /> Developer API Keys
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
