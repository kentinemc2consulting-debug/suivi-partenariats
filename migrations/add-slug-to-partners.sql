-- Add slug column to partners table
ALTER TABLE partners ADD COLUMN IF NOT EXISTS slug TEXT;

-- Generate slugs for existing partners based on their names
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

-- Remove leading/trailing hyphens
UPDATE partners
SET slug = regexp_replace(regexp_replace(slug, '^-+', ''), '-+$', '')
WHERE slug IS NOT NULL;

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS partners_slug_unique ON partners(slug);

-- Verify slugs have been created
SELECT id, name, slug FROM partners ORDER BY name;
