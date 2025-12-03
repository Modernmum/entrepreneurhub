-- Autonomous Agent Memory Schema
-- Stores learnings and patterns for AGI-like decision making

-- Agent Memory Table
CREATE TABLE IF NOT EXISTS agent_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id VARCHAR(255) NOT NULL UNIQUE,
  memory JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent Decision History
CREATE TABLE IF NOT EXISTS agent_decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id VARCHAR(255) NOT NULL,
  decision_date DATE NOT NULL,
  context JSONB NOT NULL,
  plan JSONB NOT NULL,
  results JSONB NOT NULL,
  success_rate DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent Performance Metrics
CREATE TABLE IF NOT EXISTS agent_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id VARCHAR(255) NOT NULL,
  metric_date DATE NOT NULL,
  leads_generated INTEGER DEFAULT 0,
  content_created INTEGER DEFAULT 0,
  research_completed INTEGER DEFAULT 0,
  avg_lead_score DECIMAL(5,2),
  total_cost DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, metric_date)
);

-- Create indexes
CREATE INDEX idx_agent_memory_tenant ON agent_memory(tenant_id);
CREATE INDEX idx_agent_decisions_tenant ON agent_decisions(tenant_id);
CREATE INDEX idx_agent_decisions_date ON agent_decisions(decision_date);
CREATE INDEX idx_agent_performance_tenant ON agent_performance(tenant_id);
CREATE INDEX idx_agent_performance_date ON agent_performance(metric_date);

-- Comments
COMMENT ON TABLE agent_memory IS 'Stores AGI-like memory and learnings for each tenant';
COMMENT ON TABLE agent_decisions IS 'Historical record of autonomous decisions made';
COMMENT ON TABLE agent_performance IS 'Daily performance metrics for each tenant';

COMMENT ON COLUMN agent_memory.memory IS 'JSONB containing: bestLeadSources, bestContentTopics, successPatterns';
COMMENT ON COLUMN agent_decisions.context IS 'Business context at time of decision';
COMMENT ON COLUMN agent_decisions.plan IS 'The plan the agent decided to execute';
COMMENT ON COLUMN agent_decisions.results IS 'Outcomes of the execution';
