-- GMP Sync Logging Schema
-- Tracks all sync activity between Unbound.team and Growth Manager Pro
-- Provides monitoring, debugging, and analytics

-- Sync activity log
CREATE TABLE IF NOT EXISTS gmp_sync_log (
  id SERIAL PRIMARY KEY,
  sync_type TEXT NOT NULL, -- 'leads', 'content', 'research'
  tenant_id TEXT NOT NULL, -- GMP tenant ID
  items_total INTEGER NOT NULL,
  items_successful INTEGER NOT NULL,
  items_failed INTEGER NOT NULL,
  errors JSONB, -- Array of error objects
  success BOOLEAN NOT NULL,
  synced_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Index for fast queries
  CONSTRAINT gmp_sync_log_sync_type_check CHECK (sync_type IN ('leads', 'content', 'research'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_gmp_sync_log_tenant ON gmp_sync_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gmp_sync_log_synced_at ON gmp_sync_log(synced_at DESC);
CREATE INDEX IF NOT EXISTS idx_gmp_sync_log_type ON gmp_sync_log(sync_type);

-- Client GMP configuration
-- Maps Unbound.team tenants to their GMP tenant IDs
CREATE TABLE IF NOT EXISTS gmp_client_config (
  id SERIAL PRIMARY KEY,
  unbound_tenant_id TEXT NOT NULL UNIQUE, -- Tenant ID in Unbound.team
  gmp_tenant_id TEXT NOT NULL, -- Tenant ID in GMP
  client_name TEXT,
  client_email TEXT,

  -- Automation settings
  automation_enabled BOOLEAN DEFAULT TRUE,
  leads_per_week INTEGER DEFAULT 20,
  content_per_week INTEGER DEFAULT 2,
  research_per_month INTEGER DEFAULT 1,

  -- Target settings
  target_industries TEXT[], -- ['SaaS', 'ecommerce', 'consulting']
  content_topics TEXT[], -- ['growth', 'marketing', 'sales']

  -- Schedule
  sync_schedule TEXT DEFAULT '0 6 * * *', -- Cron format (daily at 6am)

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_gmp_client_config_unbound_tenant ON gmp_client_config(unbound_tenant_id);
CREATE INDEX IF NOT EXISTS idx_gmp_client_config_gmp_tenant ON gmp_client_config(gmp_tenant_id);

-- Sync queue
-- Items waiting to be synced to GMP
CREATE TABLE IF NOT EXISTS gmp_sync_queue (
  id SERIAL PRIMARY KEY,
  unbound_tenant_id TEXT NOT NULL,
  gmp_tenant_id TEXT NOT NULL,
  item_type TEXT NOT NULL, -- 'lead', 'content', 'research'
  item_id TEXT NOT NULL, -- ID in Unbound.team database
  item_data JSONB NOT NULL, -- Full item data to sync

  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_error TEXT,

  queued_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,

  CONSTRAINT gmp_sync_queue_status_check CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Indexes for queue processing
CREATE INDEX IF NOT EXISTS idx_gmp_sync_queue_status ON gmp_sync_queue(status);
CREATE INDEX IF NOT EXISTS idx_gmp_sync_queue_queued_at ON gmp_sync_queue(queued_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_gmp_client_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_gmp_client_config_updated_at ON gmp_client_config;
CREATE TRIGGER trigger_update_gmp_client_config_updated_at
  BEFORE UPDATE ON gmp_client_config
  FOR EACH ROW
  EXECUTE FUNCTION update_gmp_client_config_updated_at();

-- Example: Insert sample client configuration
-- INSERT INTO gmp_client_config (
--   unbound_tenant_id,
--   gmp_tenant_id,
--   client_name,
--   client_email,
--   automation_enabled,
--   leads_per_week,
--   content_per_week,
--   research_per_month,
--   target_industries,
--   content_topics
-- ) VALUES (
--   'maggie-forbes-client-123',
--   'gmp-bigclient-789',
--   'Big Client Inc',
--   'ceo@bigclient.com',
--   TRUE,
--   50,
--   3,
--   2,
--   ARRAY['SaaS', 'B2B'],
--   ARRAY['growth', 'fundraising', 'scaling']
-- );

-- View: Sync health dashboard
CREATE OR REPLACE VIEW gmp_sync_health AS
SELECT
  tenant_id,
  sync_type,
  COUNT(*) as total_syncs,
  SUM(items_successful) as total_items_synced,
  SUM(items_failed) as total_items_failed,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_syncs,
  SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) as failed_syncs,
  MAX(synced_at) as last_sync_at,
  ROUND(AVG(items_successful)::numeric, 2) as avg_items_per_sync
FROM gmp_sync_log
WHERE synced_at >= NOW() - INTERVAL '30 days'
GROUP BY tenant_id, sync_type
ORDER BY last_sync_at DESC;

-- View: Client sync summary
CREATE OR REPLACE VIEW gmp_client_sync_summary AS
SELECT
  c.unbound_tenant_id,
  c.gmp_tenant_id,
  c.client_name,
  c.automation_enabled,
  COUNT(l.id) as total_syncs_30d,
  SUM(l.items_successful) as items_synced_30d,
  MAX(l.synced_at) as last_sync_at,
  CASE
    WHEN MAX(l.synced_at) >= NOW() - INTERVAL '2 days' THEN 'healthy'
    WHEN MAX(l.synced_at) >= NOW() - INTERVAL '7 days' THEN 'warning'
    ELSE 'stale'
  END as health_status
FROM gmp_client_config c
LEFT JOIN gmp_sync_log l ON c.gmp_tenant_id = l.tenant_id
  AND l.synced_at >= NOW() - INTERVAL '30 days'
GROUP BY c.unbound_tenant_id, c.gmp_tenant_id, c.client_name, c.automation_enabled
ORDER BY last_sync_at DESC NULLS LAST;

-- Comments for documentation
COMMENT ON TABLE gmp_sync_log IS 'Logs every sync operation between Unbound.team and GMP';
COMMENT ON TABLE gmp_client_config IS 'Configuration for each client''s GMP integration and automation settings';
COMMENT ON TABLE gmp_sync_queue IS 'Queue of items waiting to be synced to GMP (for async processing)';
COMMENT ON VIEW gmp_sync_health IS 'Real-time health dashboard showing sync performance by tenant and type';
COMMENT ON VIEW gmp_client_sync_summary IS 'Summary of each client''s sync activity and health status';
