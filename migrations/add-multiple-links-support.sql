-- Migration: Support pour liens multiples dans les publications
-- Cette migration convertit le champ 'link' en 'links' (array de texte)
-- pour permettre plusieurs liens Instagram Stories par publication.

-- 1. Ajouter la nouvelle colonne 'links' comme tableau de texte
ALTER TABLE publications ADD COLUMN IF NOT EXISTS links TEXT[];

-- 2. Migrer les données existantes de 'link' vers 'links' SI la colonne 'link' existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'publications' AND column_name = 'link'
    ) THEN
        UPDATE publications 
        SET links = ARRAY[link]
        WHERE link IS NOT NULL AND links IS NULL;
        
        -- Supprimer l'ancienne colonne 'link'
        ALTER TABLE publications DROP COLUMN link;
    END IF;
END $$;

-- 3. Si la colonne 'links' existe mais est vide, mettre un tableau vide par défaut
UPDATE publications 
SET links = ARRAY[]::TEXT[]
WHERE links IS NULL;

-- 4. Rendre 'links' obligatoire (NOT NULL)
ALTER TABLE publications ALTER COLUMN links SET NOT NULL;
