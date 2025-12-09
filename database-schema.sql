-- Unbound.Team Database Schema
-- Tables for autonomous bot system

-- Market Gaps: Stores identified opportunities and research
CREATE TABLE IF NOT EXISTS market_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  opportunity_id UUID REFERENCES scored_opportunities(id),
  company_name TEXT NOT NULL,
  gap_type TEXT NOT NULL, -- 'technology', 'growth', 'operations'
  gap_description TEXT,
  solution_approach TEXT,
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  identified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  outreach_sent BOOLEAN DEFAULT FALSE,

  -- Approval gate
  approved_for_outreach BOOLEAN DEFAULT FALSE,
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE
);

-- Outreach Campaigns: Stores email outreach (with approval required)
CREATE TABLE IF NOT EXISTS outreach_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  gap_id UUID REFERENCES market_gaps(id),
  company_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,

  -- Approval gate - MUST be approved before sending
  status TEXT DEFAULT 'draft', -- 'draft', 'approved', 'sent', 'replied', 'delivered'
  approved_for_sending BOOLEAN DEFAULT FALSE,
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,

  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  replied_at TIMESTAMP WITH TIME ZONE,
  delivery_sent BOOLEAN DEFAULT FALSE
);

-- Solution Deliveries: Stores delivered solutions (with approval required)
CREATE TABLE IF NOT EXISTS solution_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  campaign_id UUID REFERENCES outreach_campaigns(id),
  company_name TEXT NOT NULL,
  solution_type TEXT NOT NULL,
  solution_content JSONB,
  delivery_method TEXT,

  -- Approval gate
  status TEXT DEFAULT 'draft', -- 'draft', 'approved', 'delivered'
  approved_for_delivery BOOLEAN DEFAULT FALSE,
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,

  delivered_at TIMESTAMP WITH TIME ZONE
);

-- System Settings: Control auto-send behavior
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings (everything requires manual approval)
INSERT INTO system_settings (setting_key, setting_value) VALUES
  ('auto_outreach_enabled', 'false'),
  ('auto_delivery_enabled', 'false'),
  ('require_approval_for_outreach', 'true'),
  ('require_approval_for_delivery', 'true')
ON CONFLICT (setting_key) DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_market_gaps_opportunity ON market_gaps(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_market_gaps_approved ON market_gaps(approved_for_outreach);
CREATE INDEX IF NOT EXISTS idx_outreach_status ON outreach_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_outreach_approved ON outreach_campaigns(approved_for_sending);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON solution_deliveries(status);

-- Comments for documentation
COMMENT ON TABLE market_gaps IS 'Identified market opportunities and research findings';
COMMENT ON TABLE outreach_campaigns IS 'Email outreach campaigns (requires approval before sending)';
COMMENT ON TABLE solution_deliveries IS 'Solution deliveries to prospects (requires approval)';
COMMENT ON COLUMN outreach_campaigns.approved_for_sending IS 'MUST be TRUE before email is sent';
COMMENT ON COLUMN solution_deliveries.approved_for_delivery IS 'MUST be TRUE before solution is delivered';
