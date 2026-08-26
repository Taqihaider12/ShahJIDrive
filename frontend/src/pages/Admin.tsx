import { canonicalUrl } from '../services/seo';
import { breadcrumbListJsonLd } from '../services/seo/structured-data';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/authContext';
import { 
  Users, Ticket, Settings, ArrowLeft, ShieldAlert, 
  Trash2, ShieldCheck, UserCheck, Plus, RefreshCw 
} from 'lucide-react';

export const Admin: React.FC = () => {
  const navigate = useNavigate();
  const { token, isAdmin, loading } = useAuth();
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'users' | 'coupons' | 'pricing'>('users');

  // List states
  const [usersList, setUsersList] = useState<any[]>([]);
  const [couponsList, setCouponsList] = useState<any[]>([]);
  const [pricingList, setPricingList] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Forms
  const [couponCode, setCouponCode] = useState('');
  const [couponTier, setCouponTier] = useState('pro');
  const [couponLimit, setCouponLimit] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Upgrade User Modal
  const [upgradeUser, setUpgradeUser] = useState<any | null>(null);
  const [upgradeTier, setUpgradeTier] = useState('pro');
  const [upgradeDuration, setUpgradeDuration] = useState('1month');

  // Pricing update
  const [editPricePlan, setEditPricePlan] = useState<any | null>(null);
  const [priceUSD, setPriceUSD] = useState('');
  const [priceINR, setPriceINR] = useState('');
  const [pricePKR, setPricePKR] = useState('');

  useEffect(() => {
    if (!loading && !isAdmin) {
      alert('Access denied. Admins only.');
      navigate('/dashboard');
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin && token) {
      fetchData();
    }
  }, [isAdmin, activeTab, token]);

  const fetchData = async () => {
    setDataLoading(true);
    try {
      if (activeTab === 'users') {
        const res = await fetch('/api/admin/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const users = await res.json();
          setUsersList(users);
        }
      } else if (activeTab === 'coupons') {
        const res = await fetch('/api/coupons', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const coupons = await res.json();
          setCouponsList(coupons);
        }
      } else if (activeTab === 'pricing') {
        const res = await fetch('/api/admin/pricing', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const pricing = await res.json();
          setPricingList(pricing);
        }
      }
    } catch (err) {
      console.error('Fetch admin data error:', err);
    } finally {
      setDataLoading(false);
    }
  };

  // User Actions
  const handleBanUser = async (userId: string, isBanned: boolean) => {
    if (isBanned && !confirm('Ban this user?')) return;
    try {
      const endpoint = `/api/admin/users/${userId}/${isBanned ? 'ban' : 'unban'}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Ban toggle error:', err);
    }
  };

  const handleUserRole = async (userId: string, makeAdmin: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: makeAdmin ? 'admin' : 'user' })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Role update error:', err);
    }
  };

  const handleUpgradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upgradeUser) return;
    
    setFormLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${upgradeUser.user_id}/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tier: upgradeTier, duration: upgradeDuration })
      });
      if (res.ok) {
        setUpgradeUser(null);
        fetchData();
      }
    } catch (err) {
      console.error('Upgrade subscription error:', err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDowngradeUser = async (userId: string) => {
    if (!confirm('Are you sure you want to downgrade this user to Free?')) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}/downgrade`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Downgrade error:', err);
    }
  };

  // Coupon Actions
  const handleGenerateCouponCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'ED_';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCouponCode(code);
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode) return;

    setFormLoading(true);
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code: couponCode,
          plan_type: couponTier,
          usage_limit: couponLimit || null
        })
      });
      if (res.ok) {
        setCouponCode('');
        setCouponLimit('');
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create coupon');
      }
    } catch (err) {
      console.error('Create coupon error:', err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleCoupon = async (couponId: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/coupons/${couponId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: isActive })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Toggle coupon error:', err);
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (!confirm('Delete this coupon?')) return;
    try {
      const res = await fetch(`/api/coupons/${couponId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Delete coupon error:', err);
    }
  };

  // Pricing Actions
  const handleEditPricing = (plan: any) => {
    setEditPricePlan(plan);
    setPriceUSD(plan.price_usd.toString());
    setPriceINR(plan.price_inr.toString());
    setPricePKR(plan.price_pkr.toString());
  };

  const handleUpdatePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPricePlan) return;

    setFormLoading(true);
    try {
      const res = await fetch(`/api/admin/pricing/${editPricePlan.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          price_usd: parseFloat(priceUSD),
          price_inr: parseFloat(priceINR),
          price_pkr: parseFloat(pricePKR)
        })
      });
      if (res.ok) {
        setEditPricePlan(null);
        fetchData();
      }
    } catch (err) {
      console.error('Update pricing error:', err);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-white p-6 md:p-12">
      {/* SEO Metadata (Hoisted by React 19) */}
      <title>Admin Panel | ShahJI Drive</title>
      <meta name="description" content="Admin dashboard for user management, transaction logs, and global configuration." />
      <link rel="canonical" href={canonicalUrl('/admin')} />
      
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbListJsonLd([
          { name: "Home", url: canonicalUrl('/') },
          { name: "Dashboard", url: canonicalUrl('/dashboard') },
          { name: "Admin", url: canonicalUrl('/admin') }
        ]))}
      </script>

      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-zinc-800 rounded-lg text-muted-foreground hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-3xl font-extrabold text-gradient-gold">Admin Dashboard</h1>
          </div>

          <div className="flex gap-2">
            {[
              { id: 'users', label: 'Users', icon: Users },
              { id: 'coupons', label: 'Coupons', icon: Ticket },
              { id: 'pricing', label: 'Pricing', icon: Settings }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 border transition-all ${activeTab === tab.id ? 'bg-primary text-black border-primary' : 'bg-card text-muted-foreground border-border hover:text-white'}`}
                >
                  <Icon className="h-4 w-4" /> {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {dataLoading ? (
          <div className="flex justify-center items-center py-20">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {activeTab === 'users' && (
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-zinc-900/50 border-b border-border text-muted-foreground font-bold">
                        <th className="p-4">Email</th>
                        <th className="p-4">Tier</th>
                        <th className="p-4">Expiry Date</th>
                        <th className="p-4">Role</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {usersList.map(u => (
                        <tr key={u.user_id} className={`hover:bg-zinc-900/20 transition-colors ${u.is_banned ? 'opacity-50 bg-red-950/10' : ''}`}>
                          <td className="p-4 font-semibold">
                            {u.email}
                            {u.is_banned && <span className="ml-2 text-xs text-red-500 font-bold bg-red-500/10 px-2 py-0.5 rounded-full">Banned</span>}
                          </td>
                          <td className="p-4 capitalize font-mono text-xs">{u.subscription_tier}</td>
                          <td className="p-4 font-mono text-xs text-muted-foreground">
                            {u.subscription_expires_at ? new Date(u.subscription_expires_at).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="p-4 uppercase text-xs font-bold">{u.role}</td>
                          <td className="p-4 text-right space-x-1">
                            {/* Ban toggle */}
                            <button
                              onClick={() => handleBanUser(u.user_id, !u.is_banned)}
                              className={`p-2 rounded-lg transition-colors ${u.is_banned ? 'text-green-500 hover:bg-green-500/10' : 'text-red-500 hover:bg-red-500/10'}`}
                              title={u.is_banned ? 'Unban User' : 'Ban User'}
                            >
                              {u.is_banned ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                            </button>

                            {/* Role Toggle */}
                            <button
                              onClick={() => handleUserRole(u.user_id, u.role !== 'admin')}
                              className="p-2 hover:bg-zinc-800 rounded-lg text-muted-foreground hover:text-white transition-colors"
                              title={u.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                            >
                              <UserCheck className="h-4 w-4" />
                            </button>

                            {/* Upgrade */}
                            <button
                              onClick={() => { setUpgradeUser(u); setUpgradeTier(u.subscription_tier === 'free' ? 'pro' : u.subscription_tier); }}
                              className="px-2.5 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 font-semibold rounded-lg border border-border"
                            >
                              Upgrade
                            </button>

                            {/* Downgrade */}
                            {u.subscription_tier !== 'free' && (
                              <button
                                onClick={() => handleDowngradeUser(u.user_id)}
                                className="px-2.5 py-1 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-500 font-semibold rounded-lg border border-red-500/20"
                              >
                                Reset
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'coupons' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                {/* Create Coupon Form */}
                <form onSubmit={handleCreateCoupon} className="bg-card border border-border p-6 rounded-2xl space-y-4 shadow-xl">
                  <h3 className="text-lg font-bold mb-2">Create Coupon</h3>
                  
                  <div>
                    <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">Coupon Code</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="ENTER_CODE"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="flex-1 bg-zinc-900 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={handleGenerateCouponCode}
                        className="px-3 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold rounded-xl border border-border"
                      >
                        Generate
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">Tier Level</label>
                    <select
                      value={couponTier}
                      onChange={(e) => setCouponTier(e.target.value)}
                      className="w-full bg-zinc-900 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
                    >
                      <option value="pro">Pro Plan</option>
                      <option value="premium">Premium Plan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">Redeem Limit (Optional)</label>
                    <input
                      type="number"
                      placeholder="e.g. 5"
                      value={couponLimit}
                      onChange={(e) => setCouponLimit(e.target.value)}
                      className="w-full bg-zinc-900 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={formLoading || !couponCode}
                    className="w-full py-3 bg-primary text-black font-bold rounded-xl hover:scale-105 transition-transform flex items-center justify-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" /> Create Coupon
                  </button>
                </form>

                {/* List Coupons */}
                <div className="md:col-span-2 bg-card border border-border rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-zinc-900/50 border-b border-border text-muted-foreground font-bold">
                          <th className="p-4">Code</th>
                          <th className="p-4">Tier</th>
                          <th className="p-4">Usage</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {couponsList.map(c => (
                          <tr key={c.id} className={`hover:bg-zinc-900/20 transition-colors ${!c.is_active ? 'opacity-50' : ''}`}>
                            <td className="p-4 font-mono font-bold text-primary">{c.code}</td>
                            <td className="p-4 uppercase font-mono text-xs">{c.plan_type}</td>
                            <td className="p-4 font-mono text-xs text-muted-foreground">
                              {c.usage_count} / {c.usage_limit || '∞'}
                            </td>
                            <td className="p-4 text-right space-x-1">
                              <button
                                onClick={() => handleToggleCoupon(c.id, !c.is_active)}
                                className={`px-2.5 py-1 text-xs font-bold border rounded-lg ${c.is_active ? 'bg-zinc-800 text-white border-border hover:bg-zinc-700' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}
                              >
                                {c.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                onClick={() => handleDeleteCoupon(c.id)}
                                className="p-2 hover:bg-red-500/10 rounded-lg text-red-500 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'pricing' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {pricingList.map(p => (
                  <div key={p.id} className="bg-card border border-border p-6 rounded-2xl flex flex-col justify-between shadow-lg">
                    <div>
                      <h3 className="text-xl font-bold uppercase mb-4 text-primary">{p.plan_name}</h3>
                      <div className="space-y-2 text-sm text-muted-foreground mb-8">
                        <div><strong className="text-white">USD:</strong> ${p.price_usd}</div>
                        <div><strong className="text-white">INR:</strong> ₹{p.price_inr}</div>
                        <div><strong className="text-white">PKR:</strong> Rs {p.price_pkr}</div>
                        <div className="text-xs italic pt-4">Duration: {p.duration_days} days</div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleEditPricing(p)}
                      className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold border border-border rounded-xl transition-colors"
                    >
                      Edit Rates
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Upgrade Subscription Modal */}
      {upgradeUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
          <form onSubmit={handleUpgradeSubmit} className="w-full max-w-md bg-card border border-border p-8 rounded-2xl space-y-6 shadow-2xl relative">
            <h3 className="text-xl font-bold text-gradient-gold">Upgrade User Subscription</h3>
            <p className="text-xs text-muted-foreground">Upgrading parameters for: <strong>{upgradeUser.email}</strong></p>

            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">Select Tier</label>
              <select
                value={upgradeTier}
                onChange={(e) => setUpgradeTier(e.target.value)}
                className="w-full bg-zinc-900 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-sm"
              >
                <option value="pro">Pro Plan</option>
                <option value="premium">Premium Plan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">Duration</label>
              <select
                value={upgradeDuration}
                onChange={(e) => setUpgradeDuration(e.target.value)}
                className="w-full bg-zinc-900 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-sm"
              >
                <option value="1week">1 Week</option>
                <option value="1month">1 Month</option>
                <option value="3months">3 Months</option>
                <option value="6months">6 Months</option>
                <option value="1year">1 Year</option>
                <option value="lifetime">Lifetime (100 Years)</option>
              </select>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setUpgradeUser(null)}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="flex-1 py-3 bg-primary text-black font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-1.5"
              >
                {formLoading ? 'Applying...' : 'Apply Upgrade'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Pricing Modal */}
      {editPricePlan && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
          <form onSubmit={handleUpdatePricing} className="w-full max-w-md bg-card border border-border p-8 rounded-2xl space-y-6 shadow-2xl relative">
            <h3 className="text-xl font-bold text-gradient-gold">Edit Pricing: {editPricePlan.plan_name.toUpperCase()}</h3>

            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">Price USD</label>
              <input
                type="number"
                required
                value={priceUSD}
                onChange={(e) => setPriceUSD(e.target.value)}
                className="w-full bg-zinc-900 border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">Price INR</label>
              <input
                type="number"
                required
                value={priceINR}
                onChange={(e) => setPriceINR(e.target.value)}
                className="w-full bg-zinc-900 border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">Price PKR</label>
              <input
                type="number"
                required
                value={pricePKR}
                onChange={(e) => setPricePKR(e.target.value)}
                className="w-full bg-zinc-900 border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary text-sm"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setEditPricePlan(null)}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="flex-1 py-3 bg-primary text-black font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-1.5"
              >
                {formLoading ? 'Saving...' : 'Save Rates'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
