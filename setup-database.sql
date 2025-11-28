-- ENTREPRENEURHUB.AI DATABASE SCHEMA
-- Clean, separate database for the platform
-- Run this in your NEW Supabase project

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  website TEXT,
  twitter TEXT,
  location TEXT,
  entrepreneur_type TEXT, -- solo, team, agency, etc
  verified BOOLEAN DEFAULT false,
  pro_member BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles are viewable by everyone
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

-- Users can update own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================================
-- PROBLEMS - Entrepreneurs post problems they're facing
-- ============================================================================

CREATE TABLE public.problems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT, -- saas, ecommerce, content, productivity, marketing, etc
  tags TEXT[],
  upvotes INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'open', -- open, solving, solved
  verified BOOLEAN DEFAULT false, -- Verified by mods as legit problem
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Problems are viewable by everyone"
  ON public.problems FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create problems"
  ON public.problems FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own problems"
  ON public.problems FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own problems"
  ON public.problems FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_problems_category ON public.problems(category);
CREATE INDEX idx_problems_status ON public.problems(status);
CREATE INDEX idx_problems_upvotes ON public.problems(upvotes DESC);
CREATE INDEX idx_problems_created ON public.problems(created_at DESC);
CREATE INDEX idx_problems_user ON public.problems(user_id);

-- ============================================================================
-- PRODUCTS - Entrepreneurs list their products
-- ============================================================================

CREATE TABLE public.products_listed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT NOT NULL,
  url TEXT,
  logo_url TEXT,
  category TEXT,
  tags TEXT[],
  price INTEGER, -- In cents
  pricing_model TEXT, -- one-time, subscription, freemium, etc
  launch_date DATE,
  revenue_public BOOLEAN DEFAULT false,
  upvotes INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.products_listed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are viewable by everyone"
  ON public.products_listed FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create products"
  ON public.products_listed FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products"
  ON public.products_listed FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own products"
  ON public.products_listed FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_products_category ON public.products_listed(category);
CREATE INDEX idx_products_upvotes ON public.products_listed(upvotes DESC);
CREATE INDEX idx_products_created ON public.products_listed(created_at DESC);
CREATE INDEX idx_products_user ON public.products_listed(user_id);

-- ============================================================================
-- REVENUE REPORTS - Entrepreneurs share revenue (optional)
-- ============================================================================

CREATE TABLE public.revenue_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products_listed(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  revenue INTEGER NOT NULL, -- In cents
  profit INTEGER, -- In cents
  mrr INTEGER, -- Monthly recurring revenue
  arr INTEGER, -- Annual recurring revenue
  customers INTEGER,
  growth_rate NUMERIC, -- Percentage
  notes TEXT,
  public BOOLEAN DEFAULT true,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, month)
);

ALTER TABLE public.revenue_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public revenue reports are viewable by everyone"
  ON public.revenue_reports FOR SELECT
  USING (public = true);

CREATE POLICY "Users can view own private revenue reports"
  ON public.revenue_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create revenue reports"
  ON public.revenue_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own revenue reports"
  ON public.revenue_reports FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX idx_revenue_product ON public.revenue_reports(product_id);
CREATE INDEX idx_revenue_month ON public.revenue_reports(month DESC);
CREATE INDEX idx_revenue_public ON public.revenue_reports(public);

-- ============================================================================
-- DISCUSSIONS - Community discussions
-- ============================================================================

CREATE TABLE public.discussions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  upvotes INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  pinned BOOLEAN DEFAULT false,
  locked BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Discussions are viewable by everyone"
  ON public.discussions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create discussions"
  ON public.discussions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own discussions"
  ON public.discussions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX idx_discussions_category ON public.discussions(category);
CREATE INDEX idx_discussions_upvotes ON public.discussions(upvotes DESC);
CREATE INDEX idx_discussions_created ON public.discussions(created_at DESC);
CREATE INDEX idx_discussions_pinned ON public.discussions(pinned);

-- ============================================================================
-- COMMENTS - Comments on problems, products, discussions
-- ============================================================================

CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_type TEXT NOT NULL, -- problem, product, discussion
  parent_id UUID NOT NULL,
  body TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone"
  ON public.comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON public.comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_comments_parent ON public.comments(parent_type, parent_id);
CREATE INDEX idx_comments_created ON public.comments(created_at DESC);
CREATE INDEX idx_comments_user ON public.comments(user_id);

-- ============================================================================
-- UPVOTES - Track who upvoted what
-- ============================================================================

CREATE TABLE public.upvotes (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL, -- problem, product, discussion, comment
  target_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, target_type, target_id)
);

ALTER TABLE public.upvotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Upvotes are viewable by everyone"
  ON public.upvotes FOR SELECT
  USING (true);

CREATE POLICY "Users can create upvotes"
  ON public.upvotes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own upvotes"
  ON public.upvotes FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_upvotes_target ON public.upvotes(target_type, target_id);
CREATE INDEX idx_upvotes_user ON public.upvotes(user_id);

-- ============================================================================
-- AI OPPORTUNITY ANALYSIS (our secret weapon)
-- ============================================================================

CREATE TABLE public.opportunity_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_type TEXT NOT NULL, -- problem, product_gap, revenue_pattern
  source_ids UUID[],
  opportunity_title TEXT NOT NULL,
  opportunity_description TEXT NOT NULL,
  market_size_estimate INTEGER,
  competition_level TEXT, -- low, medium, high
  recommended_action TEXT, -- build, acquire, partner
  confidence_score INTEGER, -- 0-100
  analysis_data JSONB, -- Full AI analysis
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_opportunity_score ON public.opportunity_analysis(confidence_score DESC);
CREATE INDEX idx_opportunity_created ON public.opportunity_analysis(created_at DESC);

-- ============================================================================
-- VIEWS FOR EASY QUERYING
-- ============================================================================

-- Trending problems (most upvoted in last 7 days)
CREATE OR REPLACE VIEW trending_problems AS
SELECT
  p.*,
  pr.username,
  pr.avatar_url
FROM public.problems p
JOIN public.profiles pr ON p.user_id = pr.id
WHERE p.created_at >= NOW() - INTERVAL '7 days'
ORDER BY p.upvotes DESC, p.created_at DESC
LIMIT 50;

-- Successful products (with public revenue)
CREATE OR REPLACE VIEW successful_products AS
SELECT
  pl.*,
  pr.username,
  pr.avatar_url,
  COALESCE(SUM(rr.revenue), 0) as total_revenue,
  COALESCE(AVG(rr.growth_rate), 0) as avg_growth_rate,
  COUNT(rr.id) as revenue_reports_count
FROM public.products_listed pl
JOIN public.profiles pr ON pl.user_id = pr.id
LEFT JOIN public.revenue_reports rr ON rr.product_id = pl.id AND rr.public = true
WHERE pl.revenue_public = true
GROUP BY pl.id, pr.username, pr.avatar_url
ORDER BY total_revenue DESC;

-- Top opportunities (AI-generated)
CREATE OR REPLACE VIEW top_opportunities AS
SELECT *
FROM public.opportunity_analysis
WHERE confidence_score >= 70
ORDER BY confidence_score DESC, created_at DESC
LIMIT 20;

-- ============================================================================
-- FUNCTIONS FOR UPDATING COUNTS
-- ============================================================================

-- Function to update comment counts
CREATE OR REPLACE FUNCTION update_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.parent_type = 'problem' THEN
      UPDATE public.problems SET comment_count = comment_count + 1 WHERE id = NEW.parent_id;
    ELSIF NEW.parent_type = 'product' THEN
      UPDATE public.products_listed SET comment_count = comment_count + 1 WHERE id = NEW.parent_id;
    ELSIF NEW.parent_type = 'discussion' THEN
      UPDATE public.discussions SET comment_count = comment_count + 1 WHERE id = NEW.parent_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.parent_type = 'problem' THEN
      UPDATE public.problems SET comment_count = comment_count - 1 WHERE id = OLD.parent_id;
    ELSIF OLD.parent_type = 'product' THEN
      UPDATE public.products_listed SET comment_count = comment_count - 1 WHERE id = OLD.parent_id;
    ELSIF OLD.parent_type = 'discussion' THEN
      UPDATE public.discussions SET comment_count = comment_count - 1 WHERE id = OLD.parent_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_comment_count_trigger
AFTER INSERT OR DELETE ON public.comments
FOR EACH ROW EXECUTE FUNCTION update_comment_count();

-- Function to update upvote counts
CREATE OR REPLACE FUNCTION update_upvote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.target_type = 'problem' THEN
      UPDATE public.problems SET upvotes = upvotes + 1 WHERE id = NEW.target_id;
    ELSIF NEW.target_type = 'product' THEN
      UPDATE public.products_listed SET upvotes = upvotes + 1 WHERE id = NEW.target_id;
    ELSIF NEW.target_type = 'discussion' THEN
      UPDATE public.discussions SET upvotes = upvotes + 1 WHERE id = NEW.target_id;
    ELSIF NEW.target_type = 'comment' THEN
      UPDATE public.comments SET upvotes = upvotes + 1 WHERE id = NEW.target_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.target_type = 'problem' THEN
      UPDATE public.problems SET upvotes = upvotes - 1 WHERE id = OLD.target_id;
    ELSIF OLD.target_type = 'product' THEN
      UPDATE public.products_listed SET upvotes = upvotes - 1 WHERE id = OLD.target_id;
    ELSIF OLD.target_type = 'discussion' THEN
      UPDATE public.discussions SET upvotes = upvotes - 1 WHERE id = OLD.target_id;
    ELSIF OLD.target_type = 'comment' THEN
      UPDATE public.comments SET upvotes = upvotes - 1 WHERE id = OLD.target_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_upvote_count_trigger
AFTER INSERT OR DELETE ON public.upvotes
FOR EACH ROW EXECUTE FUNCTION update_upvote_count();

-- ============================================================================
-- SAMPLE DATA (for testing)
-- ============================================================================

-- This will be populated by users
-- But we can add seed data if needed for demo

-- ============================================================================
-- DONE
-- ============================================================================

-- Verify tables created
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
