-- Supabase Database Schema for Suivi Partenariats
-- Execute this script in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: partners
CREATE TABLE partners (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  duration TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  commission_client INTEGER DEFAULT 0,
  commission_consulting INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  type TEXT CHECK (type IN ('ambassadeur', 'strategique')),
  company_hubspot_url TEXT,
  contact_person_name TEXT,
  contact_person_email TEXT,
  contact_person_hubspot_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: introductions
CREATE TABLE introductions (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  partner_id TEXT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  contact_name TEXT NOT NULL,
  company TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'negotiating', 'signed', 'not_interested')) DEFAULT 'pending',
  contract_signed BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: events
CREATE TABLE events (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  partner_id TEXT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  proposal_date DATE NOT NULL,
  event_date DATE,
  event_name TEXT NOT NULL,
  event_location TEXT,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled')) DEFAULT 'pending',
  attended BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: publications
CREATE TABLE publications (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  partner_id TEXT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  publication_date DATE NOT NULL,
  platform TEXT NOT NULL,
  link TEXT,
  stats_report_date DATE,
  last_updated DATE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: statistics (legacy - can be merged with publications)
CREATE TABLE statistics (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  partner_id TEXT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  link TEXT,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: quarterly_reports
CREATE TABLE quarterly_reports (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  partner_id TEXT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  link TEXT,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_introductions_partner_id ON introductions(partner_id);
CREATE INDEX idx_introductions_deleted_at ON introductions(deleted_at);
CREATE INDEX idx_events_partner_id ON events(partner_id);
CREATE INDEX idx_events_deleted_at ON events(deleted_at);
CREATE INDEX idx_publications_partner_id ON publications(partner_id);
CREATE INDEX idx_publications_deleted_at ON publications(deleted_at);
CREATE INDEX idx_quarterly_reports_partner_id ON quarterly_reports(partner_id);
CREATE INDEX idx_quarterly_reports_deleted_at ON quarterly_reports(deleted_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON partners
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) - Optional, enable if you want user-based access control
-- ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE introductions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE events ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE publications ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE statistics ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE quarterly_reports ENABLE ROW LEVEL SECURITY;

-- Create policies (uncomment if using RLS)
-- CREATE POLICY "Enable all access for authenticated users" ON partners FOR ALL USING (true);
-- CREATE POLICY "Enable all access for authenticated users" ON introductions FOR ALL USING (true);
-- CREATE POLICY "Enable all access for authenticated users" ON events FOR ALL USING (true);
-- CREATE POLICY "Enable all access for authenticated users" ON publications FOR ALL USING (true);
-- CREATE POLICY "Enable all access for authenticated users" ON statistics FOR ALL USING (true);
-- CREATE POLICY "Enable all access for authenticated users" ON quarterly_reports FOR ALL USING (true);
