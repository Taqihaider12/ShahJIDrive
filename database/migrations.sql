-- Empire Drive Database Schema Migration

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
    user_id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(255),
    subscription_tier VARCHAR(50) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'premium')),
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    is_banned BOOLEAN DEFAULT false,
    ban_reason TEXT,
    banned_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. User Roles Table
CREATE TABLE IF NOT EXISTS user_roles (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES profiles(user_id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_role UNIQUE(user_id, role)
);

-- 3. API Keys Table
CREATE TABLE IF NOT EXISTS api_keys (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES profiles(user_id) ON DELETE CASCADE,
    key_name VARCHAR(255) NOT NULL,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    allowed_domain VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Coupons Table
CREATE TABLE IF NOT EXISTS coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    plan_type VARCHAR(50) DEFAULT 'pro' CHECK (plan_type IN ('pro', 'premium')),
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by VARCHAR(255) REFERENCES profiles(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Pricing Settings Table
CREATE TABLE IF NOT EXISTS pricing_settings (
    id SERIAL PRIMARY KEY,
    plan_name VARCHAR(50) UNIQUE NOT NULL CHECK (plan_name IN ('free', 'pro', 'premium')),
    price NUMERIC DEFAULT 0,
    price_usd NUMERIC DEFAULT 0,
    price_inr NUMERIC DEFAULT 0,
    price_pkr NUMERIC DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'PKR',
    duration_days INTEGER DEFAULT 30,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert Default Pricing Settings
INSERT INTO pricing_settings (plan_name, price, price_usd, price_inr, price_pkr, currency, duration_days, description, is_active)
VALUES 
('free', 0, 0, 0, 0, 'USD', 99999, 'Free tier with basic upload speed and 5 GB storage limit', true),
('pro', 500, 2, 170, 500, 'PKR', 30, 'Pro access with high speed clone, 300 GB limit, priority support', true),
('premium', 1200, 5, 420, 1200, 'PKR', 30, 'Premium access with 10,000 GB storage limit, ultra speed clone', true)
ON CONFLICT (plan_name) DO UPDATE 
SET price = EXCLUDED.price,
    price_usd = EXCLUDED.price_usd,
    price_inr = EXCLUDED.price_inr,
    price_pkr = EXCLUDED.price_pkr,
    description = EXCLUDED.description;
