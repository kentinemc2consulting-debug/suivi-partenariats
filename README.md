# Suivi Partenariats - Application de Gestion

Application Next.js pour gérer les partenariats d'entreprise avec design e=mc2 consulting.

## 🚀 Démarrage rapide

```bash
# Installer les dépendances
npm install

# Lancer en développement
npm run dev

# Ouvrir http://localhost:3000
```

## 📋 Fonctionnalités

- ✅ Grille de partenaires avec design e=mc2 consulting
- ✅ Détails des partenariats (introductions, événements, publications)
- ✅ Ajout de nouveaux partenariats via formulaire
- ✅ Suivi des commissions et dates de partenariat

## 🎨 Design

- **Couleurs** : Fond bleu foncé `hsl(222 47% 7%)` + Émeraude `hsl(158 45% 50%)`
- **Background** : Motif de points teal/vert (e=mc2 consulting)
- **Style** : Cards avec hover effects, design épuré et professionnel

## 📁 Structure

```
src/
├── app/
│   ├── page.tsx                    # Homepage avec grille de partenaires
│   ├── partners/
│   │   ├── page.tsx                # Liste des partenaires
│   │   └── [id]/page.tsx           # Détails d'un partenaire
│   ├── new-partnership/page.tsx    # Formulaire nouveau partenariat
│   └── api/partners/route.ts       # API REST pour partenaires
├── components/
│   ├── PartnerGrid.tsx             # Grille de partenaires
│   └── ui/                         # Composants UI réutilisables
├── data/
│   ├── partners.json               # Données des partenariats
│   └── partnerships.ts             # Couche d'accès aux données
└── globals.css                     # Design system e=mc2
```

## 💾 Données

Actuellement, les données sont stockées dans `src/data/partners.json`.

⚠️ **Important** : Sur Vercel, les nouveaux partenariats ne seront PAS sauvegardés avec cette configuration.

Pour la persistance des données en production, voir [DATABASE_SETUP.md](./DATABASE_SETUP.md) pour migrer vers Supabase ou Vercel Postgres.

## 🚢 Déploiement

### Vercel (Recommandé)

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel
```

**Note** : Pour sauvegarder les nouveaux partenariats, configurez une base de données (voir DATABASE_SETUP.md).

### Autres plateformes

L'application fonctionne sur toute plateforme supportant Next.js 15+ :
- Netlify
- Railway
- Render
- etc.

## 🔧 Configuration

Copier `.env.example` vers `.env.local` si nécessaire :

```bash
cp .env.example .env.local
```

## 📚 Documentation

- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - Guide de migration vers base de données
- [walkthrough.md](/.gemini/antigravity/brain/.../walkthrough.md) - Documentation complète du projet

## 🛠️ Technologies

- **Framework** : Next.js 15.1.6
- **Styling** : Tailwind CSS v4
- **Language** : TypeScript
- **Icons** : Lucide React

## 📝 License

Projet privé - E=MC² Consulting
