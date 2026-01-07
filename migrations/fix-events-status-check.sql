-- SCRIPT DE CORRECTION - Contrainte de statut des événements
-- Ce script supprime l'ancienne contrainte restrictive et en ajoute une nouvelle qui autorise "declined".

DO $$
BEGIN
    -- 1. Supprimer l'ancienne contrainte si elle existe
    -- Note: Le nom exact de la contrainte peut varier, mais l'erreur mentionnait "events_status_check"
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'events_status_check') THEN
        ALTER TABLE events DROP CONSTRAINT events_status_check;
    END IF;

    -- 2. Ajouter la nouvelle contrainte permissive
    -- On autorise: accepted, refused, declined, pending, proposed
    ALTER TABLE events ADD CONSTRAINT events_status_check 
    CHECK (status IN ('pending', 'accepted', 'declined', 'proposed', 'refused'));

END $$;
