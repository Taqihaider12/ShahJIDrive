import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  user_id: string;
  email: string;
  full_name: string | null;
  subscription_tier: string;
  subscription_expires_at: string | null;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAdmin: boolean;
  isPro: boolean;
  isPremium: boolean;
  isExpiringSoon: boolean;
  daysUntilExpiry: number | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, fullName: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Computed states
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [isExpiringSoon, setIsExpiringSoon] = useState(false);
  const [daysUntilExpiry, setDaysUntilExpiry] = useState<number | null>(null);

  const calculateSubscription = (profile: User | null) => {
    if (!profile) {
      setIsAdmin(false);
      setIsPro(false);
      setIsPremium(false);
      setIsExpiringSoon(false);
      setDaysUntilExpiry(null);
      return;
    }

    setIsAdmin(profile.role === 'admin');

    const tier = profile.subscription_tier;
    if ((tier === 'pro' || tier === 'premium') && profile.subscription_expires_at) {
      const expiry = new Date(profile.subscription_expires_at);
      const now = new Date();
      const diffTime = expiry.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const active = diffDays > 0;

      setIsPro(active);
      setIsPremium(active && tier === 'premium');
      setDaysUntilExpiry(diffDays > 0 ? diffDays : 0);
      setIsExpiringSoon(diffDays <= 7 && diffDays > 0);
    } else {
      setIsPro(false);
      setIsPremium(false);
      setDaysUntilExpiry(null);
      setIsExpiringSoon(false);
    }
  };

  const fetchProfile = async (authToken: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        calculateSubscription(data.user);
      } else {
        // Token is invalid, clear it
        signOut();
      }
    } catch (err) {
      console.error('Fetch profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile(token);
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      calculateSubscription(data.user);
      return { success: true };
    } catch (err) {
      console.error('Login action error:', err);
      return { success: false, error: 'Connection to server failed' };
    }
  };

  const signup = async (email: string, password: string, fullName: string) => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName })
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Signup failed' };
      }

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      calculateSubscription(data.user);
      return { success: true };
    } catch (err) {
      console.error('Signup action error:', err);
      return { success: false, error: 'Connection to server failed' };
    }
  };

  const signOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_refresh_token');
    localStorage.removeItem('google_token_expiry');
    setToken(null);
    setUser(null);
    calculateSubscription(null);
  };

  const refreshProfile = async () => {
    if (token) {
      await fetchProfile(token);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAdmin,
      isPro,
      isPremium,
      isExpiringSoon,
      daysUntilExpiry,
      loading,
      login,
      signup,
      signOut,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
