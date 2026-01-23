-- Recreate Schema for Suivi Partenariats (WITHOUT prefix)
-- This matches the table names expected by the application code

-- 1. Table partners
CREATE TABLE IF NOT EXISTS partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    logo TEXT,
    start_date DATE,
    end_date DATE,
    duration TEXT,
    commission_client NUMERIC,
    commission_consulting NUMERIC,
    type TEXT,
    contact_person_name TEXT,
    contact_person_email TEXT,
    contact_person_hubspot_url TEXT,
    company_hubspot_url TEXT,
    is_active BOOLEAN DEFAULT true,
    services_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- 2. Table lightweight_partners
CREATE TABLE IF NOT EXISTS lightweight_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    company TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Table introductions
CREATE TABLE IF NOT EXISTS introductions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    contact_name TEXT,
    company TEXT,
    status TEXT DEFAULT 'pending',
    contract_signed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- 4. Table monthly_check_ins
CREATE TABLE IF NOT EXISTS monthly_check_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
    check_in_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- 5. Table events
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
    proposal_date DATE,
    event_date DATE,
    event_name TEXT,
    event_location TEXT,
    status TEXT,
    attended BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- 6. Table publications
CREATE TABLE IF NOT EXISTS publications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
    platform TEXT,
    publication_date DATE,
    links JSONB DEFAULT '[]'::jsonb,
    stats_report_date DATE,
    last_updated TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- 7. Table quarterly_reports
CREATE TABLE IF NOT EXISTS quarterly_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
    report_date DATE,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- 8. Table global_events
CREATE TABLE IF NOT EXISTS global_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name TEXT NOT NULL,
    event_date DATE,
    event_location TEXT,
    description TEXT,
    invitations JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- 9. Table statistics (referenced in code but was missing)
CREATE TABLE IF NOT EXISTS statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE lightweight_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE introductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE quarterly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE statistics ENABLE ROW LEVEL SECURITY;

-- Create permissive policies (adjust as needed for production)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for partners') THEN
        CREATE POLICY "Allow all for partners" ON partners FOR ALL USING (true) WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for lightweight_partners') THEN
        CREATE POLICY "Allow all for lightweight_partners" ON lightweight_partners FOR ALL USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for introductions') THEN
        CREATE POLICY "Allow all for introductions" ON introductions FOR ALL USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for monthly_check_ins') THEN
        CREATE POLICY "Allow all for monthly_check_ins" ON monthly_check_ins FOR ALL USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for events') THEN
        CREATE POLICY "Allow all for events" ON events FOR ALL USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for publications') THEN
        CREATE POLICY "Allow all for publications" ON publications FOR ALL USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for quarterly_reports') THEN
        CREATE POLICY "Allow all for quarterly_reports" ON quarterly_reports FOR ALL USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for global_events') THEN
        CREATE POLICY "Allow all for global_events" ON global_events FOR ALL USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for statistics') THEN
        CREATE POLICY "Allow all for statistics" ON statistics FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;
