# Guide de Migration Supabase et Déploiement Vercel

Ce guide vous accompagne dans la configuration de Supabase et le déploiement sur Vercel.

## 📋 Prérequis

- Compte Supabase (gratuit)
- Compte Vercel (gratuit)
- Accès au projet GitHub (optionnel mais recommandé)

---

## 🗄️ Étape 1 : Configuration Supabase

### 1.1 Créer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Cliquez sur "Start your project"
3. Créez un compte ou connectez-vous
4. Cliquez sur "New Project"
5. Remplissez les informations :
   - **Name** : `suivi-partenariats` (ou votre choix)
   - **Database Password** : Choisissez un mot de passe fort (notez-le !)
   - **Region** : Choisissez la région la plus proche (ex: `Europe West (Paris)`)
   - **Pricing Plan** : Sélectionnez "Free" (gratuit)
6. Cliquez sur "Create new project"
7. Attendez 2-3 minutes que le projet soit créé

### 1.2 Récupérer les clés API

1. Dans votre projet Supabase, allez dans **Settings** (⚙️) dans la barre latérale
2. Cliquez sur **API**
3. Notez les informations suivantes :
   - **Project URL** : `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key** : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (longue chaîne)

> ⚠️ **Important** : Gardez ces informations en sécurité, vous en aurez besoin pour Vercel.

### 1.3 Exécuter le schéma SQL

1. Dans votre projet Supabase, allez dans **SQL Editor** dans la barre latérale
2. Cliquez sur "New query"
3. Ouvrez le fichier `supabase/schema.sql` de votre projet local
4. Copiez **tout le contenu** du fichier
5. Collez-le dans l'éditeur SQL de Supabase
6. Cliquez sur "Run" (ou appuyez sur Ctrl/Cmd + Enter)
7. Vérifiez qu'il n'y a pas d'erreurs (vous devriez voir "Success. No rows returned")

### 1.4 Vérifier les tables

1. Allez dans **Table Editor** dans la barre latérale
2. Vous devriez voir 6 tables :
   - `partners`
   - `introductions`
   - `events`
   - `publications`
   - `statistics`
   - `quarterly_reports`

✅ Votre base de données Supabase est prête !

---

## 🚀 Étape 2 : Déploiement sur Vercel

### 2.1 Préparer le projet pour Vercel

1. Assurez-vous que votre projet est dans un dépôt Git (GitHub, GitLab, ou Bitbucket)
2. Si ce n'est pas le cas, initialisez Git :
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Suivi Partenariats"
   ```
3. Créez un dépôt sur GitHub et poussez votre code :
   ```bash
   git remote add origin https://github.com/votre-username/suivi-partenariats.git
   git push -u origin main
   ```

### 2.2 Déployer sur Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Connectez-vous ou créez un compte
3. Cliquez sur "Add New..." → "Project"
4. Importez votre dépôt GitHub :
   - Sélectionnez votre dépôt `suivi-partenariats`
   - Cliquez sur "Import"
5. Configurez le projet :
   - **Framework Preset** : Next.js (détecté automatiquement)
   - **Root Directory** : `./` (par défaut)
   - **Build Command** : `npm run build` (par défaut)
   - **Output Directory** : `.next` (par défaut)

### 2.3 Configurer les variables d'environnement

1. Avant de cliquer sur "Deploy", dépliez la section **Environment Variables**
2. Ajoutez les variables suivantes :

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Votre Project URL de Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Votre anon public key de Supabase |

3. Cliquez sur "Deploy"
4. Attendez 2-3 minutes que le déploiement se termine

### 2.4 Vérifier le déploiement

1. Une fois le déploiement terminé, cliquez sur "Visit" pour voir votre application
2. Vous devriez voir la page d'accueil avec une grille vide (normal, aucune donnée n'a été ajoutée)
3. Testez l'ajout d'un nouveau partenariat :
   - Cliquez sur "Nouveau Partenariat"
   - Remplissez le formulaire
   - Cliquez sur "Créer le partenariat"
4. Vérifiez que le partenariat apparaît dans la liste

✅ Votre application est déployée sur Vercel !

---

## 🔧 Étape 3 : Configuration locale (optionnel)

Si vous voulez tester l'application localement avec Supabase :

1. Créez un fichier `.env.local` à la racine du projet :
   ```bash
   cp .env.example .env.local
   ```

2. Éditez `.env.local` et remplacez les valeurs :
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```

3. Redémarrez le serveur de développement :
   ```bash
   npm run dev
   ```

4. Ouvrez [http://localhost:3000](http://localhost:3000)

---

## 📊 Étape 4 : Utilisation de l'application

### Ajouter un partenariat

1. Cliquez sur "Nouveau Partenariat"
2. Remplissez les informations :
   - Nom du partenaire
   - Dates de début et fin
   - Taux de commission
   - Type de partenariat
   - Informations de contact
3. Cliquez sur "Créer le partenariat"

### Gérer les données d'un partenariat

1. Cliquez sur un partenaire dans la grille
2. Vous pouvez ajouter :
   - **Introductions qualifiées** : Contacts présentés au partenaire
   - **Événements** : Invitations et participations
   - **Publications** : Posts LinkedIn et autres contenus
   - **Comptes rendus trimestriels** : Rapports d'activité

### Exporter les données

1. Sur la page de détail d'un partenaire, cliquez sur :
   - **Excel** : Exporte toutes les données dans un fichier Excel
   - **PDF Export** : Génère un rapport PDF professionnel

### Corbeille

1. Les éléments supprimés sont déplacés dans la corbeille
2. Cliquez sur "Corbeille" pour voir les éléments supprimés
3. Vous pouvez restaurer ou supprimer définitivement

---

## 🔒 Sécurité et Bonnes Pratiques

### Sauvegardes

Supabase effectue des sauvegardes automatiques quotidiennes (plan gratuit : 7 jours de rétention).

### Accès à la base de données

- Les clés API sont publiques (anon key) mais sécurisées par Row Level Security (RLS)
- Pour plus de sécurité, vous pouvez activer RLS dans le schéma SQL (commenté par défaut)

### Limites du plan gratuit

- **Stockage** : 500 MB
- **Transfert de données** : 2 GB/mois
- **Requêtes** : Illimitées
- **Utilisateurs actifs** : Illimités

---

## 🆘 Dépannage

### L'application ne se connecte pas à Supabase

1. Vérifiez que les variables d'environnement sont correctement configurées sur Vercel
2. Vérifiez que le schéma SQL a été exécuté sans erreur
3. Vérifiez les logs dans Vercel : **Deployments** → Cliquez sur votre déploiement → **Logs**

### Erreur lors de l'ajout d'un partenariat

1. Vérifiez que toutes les tables ont été créées dans Supabase
2. Vérifiez les logs de l'API dans Vercel
3. Vérifiez que les clés API sont correctes

### Les données ne s'affichent pas

1. Vérifiez que les données existent dans Supabase : **Table Editor** → `partners`
2. Vérifiez les logs de la console du navigateur (F12)
3. Vérifiez que l'API route fonctionne : `https://votre-app.vercel.app/api/partners`

---

## 📞 Support

Pour toute question ou problème :
- Consultez la [documentation Supabase](https://supabase.com/docs)
- Consultez la [documentation Vercel](https://vercel.com/docs)
- Consultez la [documentation Next.js](https://nextjs.org/docs)

---

## ✅ Checklist de déploiement

- [ ] Projet Supabase créé
- [ ] Schéma SQL exécuté
- [ ] Tables vérifiées dans Supabase
- [ ] Clés API récupérées
- [ ] Projet poussé sur GitHub
- [ ] Projet importé dans Vercel
- [ ] Variables d'environnement configurées
- [ ] Déploiement réussi
- [ ] Application testée en production
- [ ] Premier partenariat créé avec succès

🎉 **Félicitations ! Votre application est en production !**
