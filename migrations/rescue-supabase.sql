-- SCRIPT DE SECOURS - Mise à jour complète de la base de données Supabase
-- Ce script vérifie que toutes les tables et colonnes nécessaires existent.

-- 1. Table partners - Ajout des colonnes manquantes
ALTER TABLE partners ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS services_summary TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 2. Création de l'index unique pour les slugs
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'partners_slug_unique') THEN
        CREATE UNIQUE INDEX partners_slug_unique ON partners(slug);
    END IF;
END $$;

-- 3. Génération des slugs pour les partenaires existants s'ils n'en ont pas
UPDATE partners
SET slug = lower(
  regexp_replace(
    regexp_replace(
      regexp_replace(name, '[àáâãäå]', 'a', 'gi'),
      '[èéêë]', 'e', 'gi'
    ),
    '[^a-z0-9]+', '-', 'g'
  )
)
WHERE slug IS NULL;

UPDATE partners
SET slug = regexp_replace(regexp_replace(slug, '^-+', ''), '-+$', '')
WHERE slug IS NOT NULL AND slug LIKE '-%' OR slug LIKE '%-';

-- 4. Table monthly_check_ins - Création si manquante
CREATE TABLE IF NOT EXISTS monthly_check_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
    check_in_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- 5. Table introductions - Vérification et ajout de colonnes
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

-- 6. Table global_events - Vérification et ajout de colonnes
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

-- 7. Table lightweight_partners - Vérification
CREATE TABLE IF NOT EXISTS lightweight_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    company TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Activation de RLS (par sécurité, on s'assure que c'est activé mais permissif pour le moment si besoin)
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE introductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_events ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité permissives (à affiner en production)
-- On vérifie si les politiques existent avant de les créer
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for partners') THEN
        CREATE POLICY "Allow all for partners" ON partners FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for introductions') THEN
        CREATE POLICY "Allow all for introductions" ON introductions FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for monthly_check_ins') THEN
        CREATE POLICY "Allow all for monthly_check_ins" ON monthly_check_ins FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for global_events') THEN
        CREATE POLICY "Allow all for global_events" ON global_events FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;
