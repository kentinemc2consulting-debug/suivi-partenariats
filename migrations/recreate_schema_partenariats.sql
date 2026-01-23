-- Recreate Schema for Suivi Partenariats with prefix 'partenariats_'

-- 1. Table partners
CREATE TABLE IF NOT EXISTS partenariats_partners (
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
    contact_name TEXT,
    contact_email TEXT,
    contact_hubspot_url TEXT,
    company_hubspot_url TEXT,
    is_active BOOLEAN DEFAULT true,
    services_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Unique index for slug (already enforced by UNIQUE constraint, but good for explicit naming if needed, though constraint handles it)
-- CREATE UNIQUE INDEX IF NOT EXISTS partenariats_partners_slug_idx ON partenariats_partners(slug);

-- 2. Table lightweight_partners
CREATE TABLE IF NOT EXISTS partenariats_lightweight_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    company TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Table introductions
CREATE TABLE IF NOT EXISTS partenariats_introductions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID REFERENCES partenariats_partners(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    contact_name TEXT,
    company TEXT,
    status TEXT DEFAULT 'pending',
    contract_signed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- 4. Table monthly_check_ins
CREATE TABLE IF NOT EXISTS partenariats_monthly_check_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID REFERENCES partenariats_partners(id) ON DELETE CASCADE,
    check_in_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- 5. Table events
CREATE TABLE IF NOT EXISTS partenariats_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID REFERENCES partenariats_partners(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS partenariats_publications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID REFERENCES partenariats_partners(id) ON DELETE CASCADE,
    platform TEXT,
    publication_date DATE,
    link TEXT,
    stats_report_date DATE,
    stats_report_url TEXT,
    screenshot_urls TEXT,
    last_updated TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- 7. Table quarterly_reports
CREATE TABLE IF NOT EXISTS partenariats_quarterly_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID REFERENCES partenariats_partners(id) ON DELETE CASCADE,
    report_date DATE,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- 8. Table global_events
CREATE TABLE IF NOT EXISTS partenariats_global_events (
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

-- Enable Row Level Security
ALTER TABLE partenariats_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE partenariats_lightweight_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE partenariats_introductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE partenariats_monthly_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE partenariats_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE partenariats_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE partenariats_quarterly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE partenariats_global_events ENABLE ROW LEVEL SECURITY;

-- Create permissive policies (adjust as needed for production)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for partenariats_partners') THEN
        CREATE POLICY "Allow all for partenariats_partners" ON partenariats_partners FOR ALL USING (true) WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for partenariats_lightweight_partners') THEN
        CREATE POLICY "Allow all for partenariats_lightweight_partners" ON partenariats_lightweight_partners FOR ALL USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for partenariats_introductions') THEN
        CREATE POLICY "Allow all for partenariats_introductions" ON partenariats_introductions FOR ALL USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for partenariats_monthly_check_ins') THEN
        CREATE POLICY "Allow all for partenariats_monthly_check_ins" ON partenariats_monthly_check_ins FOR ALL USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for partenariats_events') THEN
        CREATE POLICY "Allow all for partenariats_events" ON partenariats_events FOR ALL USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for partenariats_publications') THEN
        CREATE POLICY "Allow all for partenariats_publications" ON partenariats_publications FOR ALL USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for partenariats_quarterly_reports') THEN
        CREATE POLICY "Allow all for partenariats_quarterly_reports" ON partenariats_quarterly_reports FOR ALL USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for partenariats_global_events') THEN
        CREATE POLICY "Allow all for partenariats_global_events" ON partenariats_global_events FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;
