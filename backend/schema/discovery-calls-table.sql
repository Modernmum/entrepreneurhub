-- Discovery Calls Table for Appointment Monitor
-- Tracks appointments, reminders, and follow-ups

CREATE TABLE IF NOT EXISTS discovery_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Contact info
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  company_name TEXT,

  -- Appointment details
  scheduled_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  meeting_url TEXT,
  notes TEXT,

  -- Status tracking
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'completed', 'missed', 'cancelled'

  -- Reminder tracking
  reminder_24h_sent BOOLEAN DEFAULT FALSE,
  reminder_1h_sent BOOLEAN DEFAULT FALSE,
  follow_up_sent BOOLEAN DEFAULT FALSE,

  -- Outcome tracking
  attended BOOLEAN,
  outcome TEXT,
  next_steps TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_discovery_calls_scheduled_time ON discovery_calls(scheduled_time);
CREATE INDEX idx_discovery_calls_status ON discovery_calls(status);
CREATE INDEX idx_discovery_calls_contact_email ON discovery_calls(contact_email);

-- Auto-update updated_at timestamp
CREATE OR REPLACE TRIGGER discovery_calls_updated_at
  BEFORE UPDATE ON discovery_calls
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
