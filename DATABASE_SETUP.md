# Configuration Supabase / Vercel Postgres

## Préparation pour la migration vers base de données

Ce document décrit comment migrer l'application de `partners.json` vers Supabase/Vercel Postgres.

---

## Schéma de base de données

### Table: `partners`

```sql
CREATE TABLE partners (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  duration TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  commission INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Table: `introductions`

```sql
CREATE TABLE introductions (
  id TEXT PRIMARY KEY,
  partner_id TEXT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  contact_name TEXT NOT NULL,
  company TEXT NOT NULL,
  contract_signed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Table: `events`

```sql
CREATE TABLE events (
  id TEXT PRIMARY KEY,
  partner_id TEXT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  proposal_date DATE NOT NULL,
  event_date DATE,
  event_name TEXT NOT NULL,
  attended BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Table: `publications`

```sql
CREATE TABLE publications (
  id TEXT PRIMARY KEY,
  partner_id TEXT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  publication_date DATE NOT NULL,
  platform TEXT NOT NULL,
  link TEXT,
  last_updated DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Table: `statistics`

```sql
CREATE TABLE statistics (
  id TEXT PRIMARY KEY,
  partner_id TEXT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Table: `quarterly_reports`

```sql
CREATE TABLE quarterly_reports (
  id TEXT PRIMARY KEY,
  partner_id TEXT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  quarter TEXT NOT NULL,
  year INTEGER NOT NULL,
  report_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Migration des données existantes

### Script SQL pour importer les données de `partners.json`

```sql
-- Exemple pour Le Bon Revenu
INSERT INTO partners (id, name, duration, start_date, end_date, commission, is_active)
VALUES (
  'le-bon-revenu',
  'Le Bon Revenu',
  'sept 2025 - mars 2026',
  '2025-09-01',
  '2026-03-31',
  20,
  true
);

-- Introductions pour Le Bon Revenu
INSERT INTO introductions (id, partner_id, date, contact_name, company, contract_signed)
VALUES
  ('intro-1', 'le-bon-revenu', '2025-10-27', 'Ludovic Sanchez', 'Syncopia', false),
  ('intro-2', 'le-bon-revenu', '2025-10-27', 'Flore Audine', 'Blink Museum', false),
  ('intro-3', 'le-bon-revenu', '2025-11-06', 'Stéphanie Mesguich', 'Patrimonia Invest Immo', false),
  ('intro-4', 'le-bon-revenu', '2025-11-06', 'Bruno Dujardin', 'Patrimonia Invest Immo', false);

-- Publications pour Le Bon Revenu
INSERT INTO publications (id, partner_id, publication_date, platform, link, last_updated)
VALUES (
  'pub-1',
  'le-bon-revenu',
  '2025-10-14',
  'LinkedIn',
  'https://www.linkedin.com/posts/clique-ici',
  '2025-10-29'
);

-- Statistiques pour Le Bon Revenu
INSERT INTO statistics (id, partner_id, report_date, link)
VALUES (
  'stat-1',
  'le-bon-revenu',
  '2025-10-29',
  'https://www.linkedin.com/posts/clique-ici'
);

-- Répéter pour Audi...
INSERT INTO partners (id, name, duration, start_date, end_date, commission, is_active)
VALUES (
  'audi',
  'Audi',
  'sept 2025 - déc 2025',
  '2025-09-01',
  '2025-12-31',
  20,
  true
);

-- Etc...
```

---

## Configuration Supabase

### Étape 1: Créer un projet Supabase

1. Aller sur [supabase.com](https://supabase.com)
2. Créer un compte gratuit
3. Créer un nouveau projet
4. Noter l'URL du projet et la clé API (anon key)

### Étape 2: Exécuter les scripts SQL

1. Dans le dashboard Supabase, aller dans "SQL Editor"
2. Copier-coller les scripts de création de tables ci-dessus
3. Exécuter les scripts
4. Copier-coller le script de migration des données
5. Exécuter le script

### Étape 3: Configurer les variables d'environnement

Créer un fichier `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon
```

### Étape 4: Installer les dépendances

```bash
npm install @supabase/supabase-js
```

---

## Configuration Vercel Postgres

### Alternative à Supabase (intégration native Vercel)

1. Dans le dashboard Vercel, aller dans votre projet
2. Onglet "Storage" → "Create Database"
3. Sélectionner "Postgres"
4. Cliquer sur "Create"
5. Vercel configurera automatiquement les variables d'environnement

### Installer les dépendances

```bash
npm install @vercel/postgres
```

---

## Prochaines étapes (après finalisation du projet)

1. ✅ Choisir entre Supabase ou Vercel Postgres
2. ✅ Créer les tables dans la base de données
3. ✅ Migrer les données existantes
4. ✅ Mettre à jour `/src/app/api/partners/route.ts` pour utiliser la DB
5. ✅ Tester localement
6. ✅ Déployer sur Vercel
7. ✅ Vérifier que les nouveaux partenariats sont sauvegardés

---

## Fichiers à modifier lors de la migration

- `src/app/api/partners/route.ts` - Remplacer lecture/écriture JSON par requêtes SQL
- `src/data/partnerships.ts` - Adapter pour récupérer depuis la DB
- Créer `src/lib/supabase.ts` ou `src/lib/db.ts` - Client de base de données

Le système actuel avec `partners.json` continuera de fonctionner jusqu'à la migration.
