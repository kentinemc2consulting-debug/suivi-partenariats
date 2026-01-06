-- SCRIPT DE SECOURS V2 - Correction des tables Publications, Evénements et Rapports
-- Ce script crée ou met à jour les tables manquantes qui empêchent la sauvegarde.

-- 1. Table events (Événements partenaires)
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

-- 2. Table publications
CREATE TABLE IF NOT EXISTS publications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
    platform TEXT,
    publication_date DATE,
    link TEXT,
    stats_report_date DATE,
    last_updated TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- 3. Table quarterly_reports (Rapports trimestriels)
CREATE TABLE IF NOT EXISTS quarterly_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
    report_date DATE,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- 4. Activation RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE quarterly_reports ENABLE ROW LEVEL SECURITY;

-- 5. Création des politiques permissives (comme pour les autres tables)
DO $$
BEGIN
    -- Events
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for events') THEN
        CREATE POLICY "Allow all for events" ON events FOR ALL USING (true) WITH CHECK (true);
    END IF;

    -- Publications
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for publications') THEN
        CREATE POLICY "Allow all for publications" ON publications FOR ALL USING (true) WITH CHECK (true);
    END IF;

    -- Quarterly Reports
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for quarterly_reports') THEN
        CREATE POLICY "Allow all for quarterly_reports" ON quarterly_reports FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;
