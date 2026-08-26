import { canonicalUrl } from '../services/seo';
import { personJsonLd, websiteJsonLd } from '../services/seo/structured-data';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/authContext';
import { Zap, Shield, ArrowRight, Upload, FolderSync, FileText, Trash2, Menu, X } from 'lucide-react';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // States
  const [currency, setCurrency] = useState<'USD' | 'PKR' | 'INR'>('PKR');
  const [sliderVal, setSliderVal] = useState(50); // Speed slider percentage
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Pricing values (matching DB pricing configuration)
  const pricingData = {
    USD: { pro: '2', premium: '5', symbol: '$' },
    PKR: { pro: '500', premium: '1200', symbol: 'Rs' },
    INR: { pro: '170', premium: '420', symbol: '₹' }
  };

  const currentPrices = pricingData[currency];

  const getSliderText = () => {
    if (sliderVal < 25) return { speed: '5 MB/s', desc: 'Free Tier Limit', color: 'text-zinc-500' };
    if (sliderVal < 75) return { speed: '50 MB/s', desc: 'Pro Tier Turbo Speed', color: 'text-gradient-purple font-semibold' };
    return { speed: '150 MB/s+', desc: 'Premium Multi-threaded Speed!', color: 'text-gradient-gold font-bold' };
  };

  const sliderInfo = getSliderText();

  return (
    <div className="min-h-screen bg-background text-white flex flex-col overflow-x-hidden">
      {/* SEO Metadata (Hoisted by React 19) */}
      <title>ShahJI Drive - Fast Google Drive Folder Cloner & Bulk Uploader</title>
      <meta name="description" content="ShahJI Drive is the fastest Google Drive folder cloner and bulk file uploader. Copy entire directories, apply watermarks, and run transfers at 1000x speed." />
      <meta name="keywords" content="Google Drive cloner, folder copy Google Drive, Google Drive folder cloner, fast drive uploader, bulk file uploader" />
      <link rel="canonical" href={canonicalUrl('/')} />
      
      <meta property="og:title" content="ShahJI Drive - Fast Google Drive Folder Cloner" />
      <meta property="og:description" content="Copy entire directories instantly in the cloud at blazing fast speeds." />
      <meta property="og:url" content={canonicalUrl('/')} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={canonicalUrl('/og-image.png')} />
      
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="ShahJI Drive - Fast Google Drive Folder Cloner" />
      <meta name="twitter:description" content="Copy Google Drive folders instantly. Blazing fast transfer speeds directly in the cloud." />
      <meta name="twitter:image" content={canonicalUrl('/og-image.png')} />

      <script type="application/ld+json">
        {JSON.stringify(personJsonLd())}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(websiteJsonLd())}
      </script>

      {/* Hero Section Container (ResponsiveHeroBanner Structure) */}
      <section className="w-full isolate min-h-screen overflow-hidden relative flex flex-col border-b border-border">
        {/* Subtle grid overlay and radial glow gradients */}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-[-10%] left-1/2 -z-10 h-[350px] w-[650px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute top-[30%] left-1/3 -z-10 h-[250px] w-[450px] rounded-full bg-secondary/5 blur-[90px]" />

        {/* Floating Navbar */}
        <header className="z-10 w-full border-b border-border/40 bg-card/45 backdrop-blur-md sticky top-0">
          <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer animate-fade-in" onClick={() => navigate('/')}>
              <div className="h-10 w-10 rounded-xl overflow-hidden flex items-center justify-center bg-zinc-900 border border-white/10 shadow-[0_0_15px_rgba(6,182,212,0.35)] animate-pulse">
                <img src="/logo.png" alt="ShahJI Drive Logo" className="h-full w-full object-cover" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight">ShahJI</span>
                <span className="text-primary font-bold text-xl ml-1">Drive</span>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-muted-foreground hover:text-white transition-colors">Features</a>
              <a href="#speed" className="text-sm text-muted-foreground hover:text-white transition-colors">Speed</a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-white transition-colors">Pricing</a>
              {user ? (
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="px-5 py-2 bg-primary text-black font-bold rounded-full transition-all duration-300 hover:-translate-y-[1px] active:translate-y-0 active:scale-95 shadow-[0_4px_12px_rgba(6,182,212,0.15)] hover:shadow-[0_6px_20px_rgba(6,182,212,0.3)] cursor-pointer"
                >
                  Dashboard
                </button>
              ) : (
                <button 
                  onClick={() => navigate('/auth')}
                  className="px-5 py-2 bg-zinc-900/80 hover:bg-zinc-800 text-white font-bold rounded-full transition-all duration-300 hover:-translate-y-[1px] active:translate-y-0 active:scale-95 border border-border cursor-pointer"
                >
                  Sign In
                </button>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15 hover:bg-white/20 transition-colors cursor-pointer"
            >
              <Menu className="h-4 w-4 text-primary" />
            </button>
          </div>
        </header>

        {/* Hero Content */}
        <div className="flex-1 flex flex-col justify-center items-center relative z-10">
          <div className="container mx-auto px-4 sm:px-6 py-12 md:py-24 max-w-4xl text-center">
            {/* Glowing pill badge */}
            <div className="mb-8 inline-flex items-center gap-3 rounded-full bg-white/5 px-2.5 py-1.5 ring-1 ring-white/10 backdrop-blur shadow-sm">
              <span className="inline-flex items-center text-[10px] font-bold text-black bg-primary rounded-full py-0.5 px-2.5 uppercase tracking-wider">
                New
              </span>
              <span className="text-xs font-semibold text-white/90 font-sans tracking-wide">
                Recursive Google Drive Folder Cloner
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold leading-tight text-white tracking-tight">
              Upload Files at
              <br />
              <span className="text-gradient-primary">1000x Speed</span>
            </h1>

            {/* Description */}
            <p className="text-sm sm:text-base md:text-lg text-white/80 max-w-2xl mt-5 sm:mt-6 mx-auto leading-relaxed">
              The fastest and most professional Google Drive folder cloner & bulk uploader. Copy entire directories, apply watermarks, and run transfers at maximum speeds directly in the cloud.
            </p>

            {/* CTA Buttons with optimized hover transformations & shadow scaling */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-8 sm:mt-10 items-center justify-center w-full max-w-md mx-auto px-0">
              <button
                onClick={() => navigate(user ? '/dashboard' : '/auth')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary text-black font-extrabold text-base rounded-full py-3.5 px-8 transition-all duration-300 hover:-translate-y-[2px] active:translate-y-0 active:scale-95 shadow-[0_4px_20px_rgba(6,182,212,0.15)] hover:shadow-[0_8px_30px_rgba(6,182,212,0.3)] cursor-pointer"
              >
                Get Started Now
                <ArrowRight className="h-4.5 w-4.5" />
              </button>
              <a
                href="#pricing"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-zinc-950/80 hover:bg-zinc-900 border border-border px-8 py-3.5 text-base font-semibold text-white/90 hover:text-white transition-all duration-300 hover:-translate-y-[2px] active:translate-y-0 active:scale-95 cursor-pointer"
              >
                View Pricing Plans
              </a>
            </div>

            {/* Partners/Services Section */}
            <div className="mx-auto mt-12 sm:mt-20 max-w-4xl">
              <p className="text-xs text-white/60 font-bold tracking-widest text-center">
                Supported Cloud Integrations
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-white/70 mt-5 sm:mt-6 max-w-3xl mx-auto">
                {[
                  { name: 'Google Drive', logo: 'GD' },
                  { name: 'Dropbox', logo: 'DB' },
                  { name: 'OneDrive', logo: 'OD' },
                  { name: 'Mega.nz', logo: 'MG' },
                  { name: 'WebDAV', logo: 'WD' }
                ].map((service, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-center gap-2 sm:gap-2.5 py-2.5 sm:py-3 px-3 sm:px-5 rounded-xl bg-card/40 border border-border/40 text-xs sm:text-sm font-bold text-muted-foreground hover:text-white hover:border-primary/20 transition-all backdrop-blur-sm cursor-default"
                  >
                    <span className="h-6 w-6 sm:h-7 sm:w-7 rounded-md bg-zinc-800/80 flex items-center justify-center text-[10px] sm:text-[11px] font-mono text-primary font-bold">
                      {service.logo}
                    </span>
                    {service.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Speed Slider Section */}
      <section id="speed" className="py-20 bg-zinc-950 border-y border-border">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Simulate Transfer Speeds</h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-8 sm:mb-12">Drag the slider to preview the download/upload speed limits across tiers.</p>
          
          <div className="bg-card border border-border p-6 sm:p-8 rounded-2xl glow-purple mb-8">
            <div className="text-3xl sm:text-4xl font-extrabold mb-2 transition-all duration-300">
              <span className={sliderInfo.color}>{sliderInfo.speed}</span>
            </div>
            <div className="text-sm text-muted-foreground mb-8">{sliderInfo.desc}</div>
            
            <input 
              type="range" 
              min="1" 
              max="100" 
              value={sliderVal} 
              onChange={(e) => setSliderVal(Number(e.target.value))}
              className="speed-slider w-full h-4 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-primary"
            />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="container mx-auto px-6 py-20 max-w-5xl">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-4xl font-bold mb-3 sm:mb-4">Powerful Features</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Everything you need to clone and sync drives in the cloud.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {[
            {
              icon: Upload,
              title: 'Ultra Fast Uploads',
              desc: 'Upload files at blazing speeds. Pro users get 1000x faster uploads.',
              color: '#FFB300', // Gold
              shadow: 'rgba(255, 179, 0, 0.12)'
            },
            {
              icon: FolderSync,
              title: 'Folder Cloning',
              desc: 'Clone entire Google Drive folders with all files and subfolders instantly.',
              color: '#06B6D4', // Cyan
              shadow: 'rgba(6, 182, 212, 0.12)'
            },
            {
              icon: Zap,
              title: 'Batch Processing',
              desc: 'Upload multiple files simultaneously with our advanced queue system.',
              color: '#F97316', // Orange
              shadow: 'rgba(249, 115, 22, 0.12)'
            },
            {
              icon: Shield,
              title: 'Secure & Private',
              desc: 'Your files are encrypted and securely transferred to your Drive.',
              color: '#10B981', // Green
              shadow: 'rgba(16, 185, 129, 0.12)'
            },
            {
              icon: FileText,
              title: 'Document Management',
              desc: 'List, organize, and manage all your documents in one place.',
              color: '#22D3EE', // Teal/Cyan
              shadow: 'rgba(34, 211, 238, 0.12)'
            },
            {
              icon: Trash2,
              title: 'Bulk Delete',
              desc: 'Clean up duplicate files and manage storage efficiently.',
              color: '#EF4444', // Red
              shadow: 'rgba(239, 68, 68, 0.12)'
            }
          ].map((feat, index) => {
            const Icon = feat.icon;
            return (
              <div 
                key={index} 
                className="bg-[#0b0f19]/45 border p-6 sm:p-8 rounded-2xl transition-all duration-300 hover:-translate-y-1"
                style={{
                  borderColor: 'var(--color-border)',
                  boxShadow: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = feat.color;
                  e.currentTarget.style.boxShadow = `0 0 25px ${feat.shadow}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div 
                  className="h-12 w-12 rounded-xl flex items-center justify-center mb-6"
                  style={{
                    backgroundColor: `${feat.color}15`,
                    border: `1px solid ${feat.color}25`
                  }}
                >
                  <Icon className="h-5 w-5" style={{ color: feat.color }} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feat.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed font-medium">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 sm:py-20 bg-zinc-950 border-t border-border">
        <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-20 max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold mb-3 sm:mb-4">Choose Your Plan</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8">Select a tier that fits your clone volume requirements.</p>
            
            {/* Currency toggle */}
            <div className="inline-flex bg-card p-1 rounded-xl border border-border">
              {(['PKR', 'USD', 'INR'] as const).map((curr) => (
                <button
                  key={curr}
                  onClick={() => setCurrency(curr)}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${currency === curr ? 'bg-primary text-black' : 'text-muted-foreground hover:text-white'}`}
                >
                  {curr}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8 items-stretch">
            {/* Free */}
            <div className="bg-card border border-border p-6 sm:p-8 rounded-2xl flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold mb-4">Free</h3>
                <div className="text-3xl font-extrabold mb-6">Free</div>
                <ul className="space-y-3 text-sm text-muted-foreground mb-8">
                  <li>✓ 5 GB Storage Quota</li>
                  <li>✓ 2 Folder Clone Limits</li>
                  <li>✓ Basic Speeds (5 MB/s)</li>
                  <li className="line-through text-zinc-600">✗ Custom Remove-Word Filters</li>
                  <li className="line-through text-zinc-600">✗ Developer API Keys</li>
                </ul>
              </div>
              <button 
                onClick={() => navigate('/auth')}
                className="w-full py-3 bg-transparent border-2 border-primary/60 hover:border-primary hover:bg-primary/10 text-white font-semibold rounded-xl transition-all duration-200"
              >
                Sign Up
              </button>
            </div>

            {/* Pro */}
            <div className="bg-card border-2 border-primary p-6 sm:p-8 rounded-2xl flex flex-col justify-between relative glow-gold">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-black text-xs font-bold rounded-full uppercase tracking-wider">
                Popular
              </div>
              <div>
                <h3 className="text-xl font-bold mb-4">Pro</h3>
                <div className="text-3xl font-extrabold mb-6">
                  {currentPrices.symbol}{currentPrices.pro} <span className="text-sm font-normal text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-3 text-sm text-muted-foreground mb-8">
                  <li>✓ 300 GB Transfer Volume</li>
                  <li>✓ Unlimited Folder Clones</li>
                  <li>✓ Turbo Speed (50 MB/s)</li>
                  <li>✓ Custom Remove-Word Filters</li>
                  <li>✓ Developer API Keys</li>
                </ul>
              </div>
              <a 
                href="https://wa.me/923142209217?text=I%20want%20to%20upgrade%20to%20Pro"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-primary text-black font-bold text-center rounded-xl hover:scale-105 transition-transform"
              >
                Buy via WhatsApp
              </a>
            </div>

            {/* Premium */}
            <div className="bg-card border border-border p-6 sm:p-8 rounded-2xl flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold mb-4">Premium</h3>
                <div className="text-3xl font-extrabold mb-6">
                  {currentPrices.symbol}{currentPrices.premium} <span className="text-sm font-normal text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-3 text-sm text-muted-foreground mb-8">
                  <li>✓ 10,000 GB Storage Quota</li>
                  <li>✓ Unlimited Folder Clones</li>
                  <li>✓ Maximum Speeds (150 MB/s+)</li>
                  <li>✓ Priority Support & Custom Features</li>
                  <li>✓ Developer API Keys</li>
                </ul>
              </div>
              <a 
                href="https://wa.me/923142209217?text=I%20want%20to%20upgrade%20to%20Premium"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-transparent border-2 border-primary/60 hover:border-primary hover:bg-primary/10 text-white font-semibold text-center rounded-xl transition-all duration-200"
              >
                Request Access
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 sm:py-12 mt-auto bg-zinc-950">
        <div className="container mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
          <div>© {new Date().getFullYear()} ShahJI Drive. All rights reserved.</div>
          <div className="flex gap-6">
            <span className="hover:text-white cursor-pointer" onClick={() => navigate('/privacy')}>Privacy Policy</span>
            <span className="hover:text-white cursor-pointer" onClick={() => navigate('/terms')}>Terms of Service</span>
          </div>
        </div>
      </footer>
      {/* Mobile Drawer Menu for Landing Page */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      <aside className={`fixed inset-y-0 right-0 w-64 bg-card border-l border-border p-6 flex flex-col justify-between select-none z-50 transition-transform duration-300 md:hidden ${
        mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2" onClick={() => { navigate('/'); setMobileMenuOpen(false); }}>
              <div className="h-8 w-8 rounded-lg overflow-hidden flex items-center justify-center bg-zinc-900 border border-white/10 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                <img src="/logo.png" alt="ShahJI Drive Logo" className="h-full w-full object-cover" />
              </div>
              <span className="font-extrabold text-sm tracking-tight">ShahJI Drive</span>
            </div>
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 hover:bg-zinc-800 rounded-lg text-muted-foreground hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav className="flex flex-col gap-4">
            <a 
              href="#features" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-bold text-muted-foreground hover:text-white transition-colors py-2 border-b border-border/30"
            >
              Features
            </a>
            <a 
              href="#speed" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-bold text-muted-foreground hover:text-white transition-colors py-2 border-b border-border/30"
            >
              Speed
            </a>
            <a 
              href="#pricing" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-bold text-muted-foreground hover:text-white transition-colors py-2 border-b border-border/30"
            >
              Pricing
            </a>
          </nav>
        </div>

        <div className="mt-8">
          {user ? (
            <button 
              onClick={() => { navigate('/dashboard'); setMobileMenuOpen(false); }}
              className="w-full py-3 bg-primary text-black font-bold rounded-xl transition-all duration-300 shadow-[0_4px_12px_rgba(6,182,212,0.15)] hover:shadow-[0_6px_20px_rgba(6,182,212,0.3)] cursor-pointer text-center"
            >
              Dashboard
            </button>
          ) : (
            <button 
              onClick={() => { navigate('/auth'); setMobileMenuOpen(false); }}
              className="w-full py-3 bg-zinc-900/80 hover:bg-zinc-800 text-white font-bold rounded-xl transition-all border border-border cursor-pointer text-center"
            >
              Sign In / Register
            </button>
          )}
        </div>
      </aside>
    </div>
  );
};
