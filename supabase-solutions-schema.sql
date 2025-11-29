-- Database Schema for Phase 3: Complete Solutions
-- Supports all 5 core solutions

-- Generated Content table (Solution #2: Content Creation)
CREATE TABLE IF NOT EXISTS generated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  content_type TEXT NOT NULL, -- blog-post, social-media, email-campaign, product-description
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX idx_generated_content_user ON generated_content(user_id);
CREATE INDEX idx_generated_content_type ON generated_content(content_type);

-- Market Research table (Solution #3: Market Research)
CREATE TABLE IF NOT EXISTS market_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  idea TEXT NOT NULL,
  industry TEXT,
  opportunity_score INTEGER CHECK (opportunity_score >= 1 AND opportunity_score <= 10),
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX idx_market_research_user ON market_research(user_id);
CREATE INDEX idx_market_research_score ON market_research(opportunity_score);

-- Landing Pages table (Solution #4: Landing Page Builder)
CREATE TABLE IF NOT EXISTS landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  business_name TEXT NOT NULL,
  html_content TEXT NOT NULL,
  status TEXT DEFAULT 'completed', -- completed, published
  created_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  views INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  metadata JSONB
);

CREATE INDEX idx_landing_pages_user ON landing_pages(user_id);
CREATE INDEX idx_landing_pages_status ON landing_pages(status);

-- Email Campaigns table (Solution #5: Email Marketing)
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  campaign_type TEXT NOT NULL, -- welcome, nurture, sales, onboarding, reengagement, promotion
  goal TEXT,
  audience TEXT,
  email_count INTEGER,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  open_rate NUMERIC(5,2),
  click_rate NUMERIC(5,2),
  conversion_rate NUMERIC(5,2),
  metadata JSONB
);

CREATE INDEX idx_email_campaigns_user ON email_campaigns(user_id);
CREATE INDEX idx_email_campaigns_type ON email_campaigns(campaign_type);
CREATE INDEX idx_email_campaigns_status ON email_campaigns(status);

-- Users table (if not exists)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

-- Functions

-- Increment landing page views
CREATE OR REPLACE FUNCTION increment_landing_page_views(page_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE landing_pages
  SET views = views + 1
  WHERE id = page_id;
END;
$$ LANGUAGE plpgsql;

-- Increment landing page conversions
CREATE OR REPLACE FUNCTION increment_landing_page_conversions(page_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE landing_pages
  SET conversions = conversions + 1
  WHERE id = page_id;
END;
$$ LANGUAGE plpgsql;

-- Calculate conversion rate for landing page
CREATE OR REPLACE FUNCTION calculate_landing_page_conversion_rate(page_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  page_views INTEGER;
  page_conversions INTEGER;
BEGIN
  SELECT views, conversions INTO page_views, page_conversions
  FROM landing_pages
  WHERE id = page_id;

  IF page_views = 0 THEN
    RETURN 0;
  END IF;

  RETURN (page_conversions::NUMERIC / page_views::NUMERIC) * 100;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE generated_content IS 'AI-generated content (blogs, social media, emails)';
COMMENT ON TABLE market_research IS 'Market research reports with opportunity scores';
COMMENT ON TABLE landing_pages IS 'AI-generated landing pages ready to deploy';
COMMENT ON TABLE email_campaigns IS 'Email marketing campaigns and sequences';
