-- ============================================================================
-- AUTOMATION SYSTEM SCHEMA
-- ============================================================================
-- Enables hybrid scheduled + on-demand automation
-- ============================================================================

-- ============================================================================
-- 1. AUTOMATION LOG (Track all automated tasks)
-- ============================================================================

CREATE TABLE IF NOT EXISTS automation_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relationships
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  job_id UUID, -- Reference to queue_jobs

  -- Automation details
  automation_type TEXT NOT NULL, -- 'lead_generation', 'opportunity_scan', 'testimonial_collection', etc.
  trigger_type TEXT DEFAULT 'scheduled', -- 'scheduled', 'manual', 'event'

  -- Settings used
  settings JSONB DEFAULT '{}',

  -- Results
  status TEXT DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  result JSONB,
  error TEXT,

  -- Timing
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  duration_ms INTEGER,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 2. Update tenants table to include automation settings
-- ============================================================================

-- Add automation settings to existing tenants
DO $$
BEGIN
  -- Check if settings column exists (it should from multi-tenant schema)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tenants' AND column_name = 'settings'
  ) THEN
    -- Update existing tenants with default automation settings
    UPDATE tenants
    SET settings = COALESCE(settings, '{}'::jsonb) || '{
      "automation": {
        "enabled": false,
        "leadGeneration": false,
        "opportunityDiscovery": true,
        "testimonialCollection": true,
        "crossPromotion": true,
        "leadsPerWeek": 10,
        "targetIndustry": "entrepreneurs",
        "location": "global",
        "minFitScore": 6
      }
    }'::jsonb
    WHERE settings IS NULL OR settings->'automation' IS NULL;
  END IF;
END $$;

-- ============================================================================
-- 3. Update queue_jobs to track testimonial requests
-- ============================================================================

ALTER TABLE queue_jobs
ADD COLUMN IF NOT EXISTS testimonial_requested BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS case_study_generated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_automated BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- 4. PARTNER AUTOMATION PREFERENCES
-- ============================================================================

CREATE TABLE IF NOT EXISTS partner_automation_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relationships
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,

  -- Lead Generation Settings
  lead_gen_enabled BOOLEAN DEFAULT FALSE,
  lead_gen_schedule TEXT DEFAULT 'weekly', -- 'daily', 'weekly', 'monthly'
  lead_gen_day_of_week INTEGER DEFAULT 1, -- 1 = Monday
  lead_gen_hour INTEGER DEFAULT 9, -- 9am
  leads_per_run INTEGER DEFAULT 10,
  target_industry TEXT,
  target_location TEXT DEFAULT 'global',
  min_fit_score NUMERIC DEFAULT 6,

  -- Opportunity Discovery
  opportunity_discovery_enabled BOOLEAN DEFAULT TRUE,
  notify_on_high_value BOOLEAN DEFAULT TRUE,
  high_value_threshold NUMERIC DEFAULT 8,

  -- Social Proof
  auto_request_testimonials BOOLEAN DEFAULT TRUE,
  auto_generate_case_studies BOOLEAN DEFAULT TRUE,
  require_client_approval BOOLEAN DEFAULT TRUE,

  -- Cross-Promotion
  cross_promotion_enabled BOOLEAN DEFAULT TRUE,
  share_with_other_tenants BOOLEAN DEFAULT TRUE,

  -- Notifications
  email_notifications BOOLEAN DEFAULT TRUE,
  discord_notifications BOOLEAN DEFAULT FALSE,
  notification_email TEXT,
  discord_webhook_url TEXT,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 5. AUTOMATION SCHEDULE (Custom schedules per partner)
-- ============================================================================

CREATE TABLE IF NOT EXISTS automation_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relationships
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

  -- Schedule details
  name TEXT NOT NULL,
  automation_type TEXT NOT NULL,
  schedule_type TEXT DEFAULT 'cron', -- 'cron', 'interval', 'once'
  cron_expression TEXT, -- '0 9 * * 1' for weekly Monday 9am
  interval_minutes INTEGER, -- For interval-based schedules

  -- Settings for this automation
  settings JSONB DEFAULT '{}',

  -- Status
  enabled BOOLEAN DEFAULT TRUE,
  last_run TIMESTAMP,
  next_run TIMESTAMP,

  -- Stats
  total_runs INTEGER DEFAULT 0,
  successful_runs INTEGER DEFAULT 0,
  failed_runs INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 6. SEED DEFAULT AUTOMATION PREFERENCES
-- ============================================================================

-- Maggie Forbes - Weekly lead gen
INSERT INTO partner_automation_preferences (
  tenant_id,
  lead_gen_enabled,
  lead_gen_schedule,
  lead_gen_day_of_week,
  lead_gen_hour,
  leads_per_run,
  target_industry,
  min_fit_score,
  notification_email
)
SELECT
  id,
  FALSE, -- Start disabled, enable manually
  'weekly',
  1, -- Monday
  9, -- 9am
  20, -- 20 leads per week
  'high-end business clients seeking strategic help',
  8, -- High fit score only
  'kristi@maggieforbes.com'
FROM tenants
WHERE slug = 'maggie-forbes'
ON CONFLICT (tenant_id) DO NOTHING;

-- Growth Manager Pro - Weekly lead gen
INSERT INTO partner_automation_preferences (
  tenant_id,
  lead_gen_enabled,
  lead_gen_schedule,
  lead_gen_day_of_week,
  lead_gen_hour,
  leads_per_run,
  target_industry,
  min_fit_score,
  notification_email
)
SELECT
  id,
  FALSE, -- Start disabled
  'weekly',
  1, -- Monday
  9,
  50, -- 50 leads per week
  'solopreneurs struggling with growth',
  6,
  'kristi@growthmangerpro.com'
FROM tenants
WHERE slug = 'growth-manager-pro'
ON CONFLICT (tenant_id) DO NOTHING;

-- ============================================================================
-- 7. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_automation_log_tenant ON automation_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_automation_log_type ON automation_log(automation_type);
CREATE INDEX IF NOT EXISTS idx_automation_log_status ON automation_log(status);
CREATE INDEX IF NOT EXISTS idx_automation_log_created ON automation_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_automation_schedules_tenant ON automation_schedules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_automation_schedules_enabled ON automation_schedules(enabled);
CREATE INDEX IF NOT EXISTS idx_automation_schedules_next_run ON automation_schedules(next_run);

-- ============================================================================
-- 8. FUNCTIONS
-- ============================================================================

-- Get automation stats for tenant
CREATE OR REPLACE FUNCTION get_automation_stats(tenant_slug TEXT)
RETURNS TABLE(
  total_automations BIGINT,
  this_month BIGINT,
  leads_generated BIGINT,
  testimonials_collected BIGINT,
  case_studies_created BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT al.id)::BIGINT as total_automations,
    COUNT(DISTINCT CASE WHEN al.created_at >= date_trunc('month', NOW()) THEN al.id END)::BIGINT as this_month,
    COUNT(DISTINCT CASE WHEN al.automation_type = 'lead_generation' AND al.status = 'completed' THEN al.id END)::BIGINT as leads_generated,
    COUNT(DISTINCT CASE WHEN al.automation_type = 'testimonial_collection' AND al.status = 'completed' THEN al.id END)::BIGINT as testimonials_collected,
    COUNT(DISTINCT CASE WHEN al.automation_type = 'case_study_generation' AND al.status = 'completed' THEN al.id END)::BIGINT as case_studies_created
  FROM tenants t
  LEFT JOIN automation_log al ON t.id = al.tenant_id
  WHERE t.slug = tenant_slug
  GROUP BY t.id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMPLETE!
-- ============================================================================
