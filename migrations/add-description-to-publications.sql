-- Migration: Ajout du champ description aux publications
-- Permet d'ajouter des informations supplémentaires sur chaque publication

ALTER TABLE publications ADD COLUMN IF NOT EXISTS description TEXT;
