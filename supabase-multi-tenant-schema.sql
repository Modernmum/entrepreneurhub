-- ============================================================================
-- MULTI-TENANT SYSTEM FOR UNBOUND.TEAM EMPIRE
-- ============================================================================
-- Supports: Unbound.team, Maggie Forbes, Growth Manager Pro
-- White-label ready, revenue share tracking, social proof automation
-- ============================================================================

-- ============================================================================
-- 1. TENANTS (Partner Brands)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL, -- 'Unbound.team', 'Maggie Forbes', 'Growth Manager Pro'
  slug TEXT UNIQUE NOT NULL, -- 'unbound-team', 'maggie-forbes', 'growth-manager-pro'
  type TEXT NOT NULL, -- 'main', 'partner'

  -- Branding
  branding JSONB DEFAULT '{}', -- { logo, colors, fonts, favicon }
  domain TEXT, -- Custom domain (optional)
  subdomain TEXT, -- 'maggieforbes.unboundteam.app'

  -- Settings
  settings JSONB DEFAULT '{}', -- { features, limits, customization }

  -- Revenue share
  revenue_share_percent NUMERIC DEFAULT 0, -- 50.00 for 50% split

  -- Status
  status TEXT DEFAULT 'active', -- 'active', 'paused', 'suspended'

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 2. TENANT USERS (Client Assignment)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenant_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relationships
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Plan details
  plan TEXT DEFAULT 'free', -- 'free', 'starter', 'growth'
  plan_limits JSONB DEFAULT '{"problems_per_month": 1}', -- Usage limits

  -- Source tracking
  source TEXT, -- 'maggie-forbes', 'growth-manager-pro', 'direct', 'referral'
  referral_code TEXT, -- If referred

  -- Status
  status TEXT DEFAULT 'active', -- 'active', 'paused', 'canceled'

  -- Billing
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Unique constraint: user can only be in tenant once
  UNIQUE(tenant_id, user_id)
);

-- ============================================================================
-- 3. TENANT REVENUE (Revenue Share Tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenant_revenue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relationships
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

  -- Period
  month TEXT NOT NULL, -- '2025-11'

  -- Revenue metrics
  total_revenue NUMERIC DEFAULT 0, -- Total revenue generated
  partner_share NUMERIC DEFAULT 0, -- Amount owed to partner
  unbound_share NUMERIC DEFAULT 0, -- Amount kept by Unbound.team

  -- Breakdown
  revenue_breakdown JSONB DEFAULT '{}', -- { starter: 1000, growth: 500 }

  -- User counts
  active_users INTEGER DEFAULT 0,
  paying_users INTEGER DEFAULT 0,
  churned_users INTEGER DEFAULT 0,

  -- Payout
  payout_status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'paid'
  payout_date TIMESTAMP,
  payout_method TEXT, -- 'stripe', 'paypal', 'wire'

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Unique constraint: one record per tenant per month
  UNIQUE(tenant_id, month)
);

-- ============================================================================
-- 4. SOCIAL PROOF (Testimonials & Case Studies)
-- ============================================================================

CREATE TABLE IF NOT EXISTS social_proof (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relationships
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

  -- Type
  type TEXT NOT NULL, -- 'testimonial', 'case_study', 'review'

  -- Content
  title TEXT,
  content TEXT,
  quote TEXT, -- Short testimonial quote

  -- Client info
  client_name TEXT,
  client_business TEXT,
  client_title TEXT,
  client_avatar_url TEXT,

  -- Results/Metrics
  results JSONB DEFAULT '{}', -- { leads_generated: 50, revenue_increase: '25%' }

  -- Solution used
  solution_type TEXT, -- 'lead-generation', 'content-creation', etc.

  -- Ratings
  rating NUMERIC, -- 1-5 stars

  -- Publishing
  published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP,
  featured BOOLEAN DEFAULT FALSE, -- Featured on homepage

  -- SEO
  slug TEXT UNIQUE,
  meta_description TEXT,

  -- Permissions
  client_approved BOOLEAN DEFAULT FALSE,
  can_use_name BOOLEAN DEFAULT TRUE,
  can_use_business BOOLEAN DEFAULT TRUE,
  can_use_photo BOOLEAN DEFAULT FALSE,

  -- Cross-promotion
  share_with_tenants UUID[], -- Array of tenant IDs to share with

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 5. CLIENT PROVISIONING LOG (Partner Actions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS client_provisioning_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relationships
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Action
  action TEXT NOT NULL, -- 'created', 'upgraded', 'downgraded', 'canceled'

  -- Details
  from_plan TEXT, -- Previous plan (for upgrades/downgrades)
  to_plan TEXT, -- New plan

  -- Source
  provisioned_by TEXT, -- 'partner', 'admin', 'self-service'
  partner_user_id UUID, -- Which partner provisioned this

  -- Metadata
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 6. CROSS PROMOTION CAMPAIGNS (Auto Marketing)
-- ============================================================================

CREATE TABLE IF NOT EXISTS cross_promotion_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Source
  source_tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

  -- Campaign details
  campaign_name TEXT NOT NULL,
  campaign_type TEXT, -- 'case_study_share', 'client_success', 'referral_bonus'

  -- Target
  target_tenants UUID[], -- Array of tenant IDs to promote to

  -- Content
  subject TEXT,
  body TEXT,
  cta_text TEXT,
  cta_url TEXT,

  -- Related content
  case_study_id UUID REFERENCES social_proof(id) ON DELETE SET NULL,

  -- Status
  status TEXT DEFAULT 'draft', -- 'draft', 'scheduled', 'sent', 'completed'
  scheduled_at TIMESTAMP,
  sent_at TIMESTAMP,

  -- Results
  recipients_count INTEGER DEFAULT 0,
  opens INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 7. USAGE TRACKING (Per Tenant User)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenant_user_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relationships
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Period
  month TEXT NOT NULL, -- '2025-11'

  -- Usage metrics
  problems_solved INTEGER DEFAULT 0,
  limit INTEGER, -- Monthly limit based on plan

  -- Solution breakdown
  lead_generation_count INTEGER DEFAULT 0,
  content_creation_count INTEGER DEFAULT 0,
  market_research_count INTEGER DEFAULT 0,
  landing_page_count INTEGER DEFAULT 0,
  email_marketing_count INTEGER DEFAULT 0,

  -- Status
  limit_reached BOOLEAN DEFAULT FALSE,
  limit_reached_at TIMESTAMP,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Unique constraint: one record per tenant user per month
  UNIQUE(tenant_id, user_id, month)
);

-- ============================================================================
-- 8. PARTNER DASHBOARD STATS (Cached Metrics)
-- ============================================================================

CREATE TABLE IF NOT EXISTS partner_dashboard_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relationships
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

  -- Period
  period_start TIMESTAMP,
  period_end TIMESTAMP,

  -- User metrics
  total_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  churned_users INTEGER DEFAULT 0,

  -- Revenue metrics
  mrr NUMERIC DEFAULT 0, -- Monthly Recurring Revenue
  arr NUMERIC DEFAULT 0, -- Annual Recurring Revenue
  revenue_share NUMERIC DEFAULT 0, -- Partner's share

  -- Engagement metrics
  problems_solved INTEGER DEFAULT 0,
  avg_satisfaction_score NUMERIC,
  testimonials_collected INTEGER DEFAULT 0,
  case_studies_published INTEGER DEFAULT 0,

  -- Top solutions
  top_solution TEXT, -- Most used solution
  solution_breakdown JSONB DEFAULT '{}',

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- SEED DATA: Initial Tenants
-- ============================================================================

INSERT INTO tenants (name, slug, type, branding, revenue_share_percent, status)
VALUES
  -- Main brand
  (
    'Unbound.team',
    'unbound-team',
    'main',
    '{
      "logo": "/logos/unbound-team.png",
      "colors": {
        "primary": "#4F46E5",
        "secondary": "#10B981",
        "accent": "#F59E0B"
      },
      "tagline": "Your Autonomous AI Team - Unbound from Big Tech"
    }',
    0,
    'active'
  ),

  -- Partner: Maggie Forbes
  (
    'Maggie Forbes AI Solutions',
    'maggie-forbes',
    'partner',
    '{
      "logo": "/logos/maggie-forbes.png",
      "colors": {
        "primary": "#8B5CF6",
        "secondary": "#EC4899",
        "accent": "#F59E0B"
      },
      "tagline": "AI-Powered Strategic Solutions for High-End Businesses"
    }',
    50.00,
    'active'
  ),

  -- Partner: Growth Manager Pro
  (
    'Growth Manager Pro AI Assistant',
    'growth-manager-pro',
    'partner',
    '{
      "logo": "/logos/growth-manager-pro.png",
      "colors": {
        "primary": "#059669",
        "secondary": "#0891B2",
        "accent": "#F59E0B"
      },
      "tagline": "Your AI-Powered Growth Partner"
    }',
    50.00,
    'active'
  )
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- INDEXES for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant ON tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user ON tenant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_source ON tenant_users(source);
CREATE INDEX IF NOT EXISTS idx_tenant_users_plan ON tenant_users(plan);

CREATE INDEX IF NOT EXISTS idx_tenant_revenue_tenant ON tenant_revenue(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_revenue_month ON tenant_revenue(month);

CREATE INDEX IF NOT EXISTS idx_social_proof_tenant ON social_proof(tenant_id);
CREATE INDEX IF NOT EXISTS idx_social_proof_type ON social_proof(type);
CREATE INDEX IF NOT EXISTS idx_social_proof_published ON social_proof(published);

CREATE INDEX IF NOT EXISTS idx_usage_tenant_user ON tenant_user_usage(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_usage_month ON tenant_user_usage(month);

-- ============================================================================
-- FUNCTIONS for Common Queries
-- ============================================================================

-- Get tenant stats
CREATE OR REPLACE FUNCTION get_tenant_stats(tenant_slug TEXT)
RETURNS TABLE(
  total_users BIGINT,
  active_users BIGINT,
  paying_users BIGINT,
  mrr NUMERIC,
  testimonials BIGINT,
  case_studies BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT tu.user_id)::BIGINT as total_users,
    COUNT(DISTINCT CASE WHEN tu.status = 'active' THEN tu.user_id END)::BIGINT as active_users,
    COUNT(DISTINCT CASE WHEN tu.plan != 'free' THEN tu.user_id END)::BIGINT as paying_users,
    COALESCE(SUM(
      CASE
        WHEN tu.plan = 'starter' THEN 50
        WHEN tu.plan = 'growth' THEN 150
        ELSE 0
      END
    ), 0) as mrr,
    COUNT(DISTINCT CASE WHEN sp.type = 'testimonial' AND sp.published = true THEN sp.id END)::BIGINT as testimonials,
    COUNT(DISTINCT CASE WHEN sp.type = 'case_study' AND sp.published = true THEN sp.id END)::BIGINT as case_studies
  FROM tenants t
  LEFT JOIN tenant_users tu ON t.id = tu.tenant_id
  LEFT JOIN social_proof sp ON t.id = sp.tenant_id
  WHERE t.slug = tenant_slug
  GROUP BY t.id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMPLETE!
-- ============================================================================
-- Run this in Supabase SQL Editor to create the multi-tenant system
-- ============================================================================
