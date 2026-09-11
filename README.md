# 🐇 Chez Lapin — Gestionnaire de Vente de Plats de Lapin

Application web complète (Next.js 14, App Router, Tailwind CSS) pour la vente de plats
de lapin : vitrine client, panier, formulaire de commande, et tableau de bord
d'administration (CRUD plats, gestion des commandes, statistiques).

## Stack technique

- **Frontend** : React 18 + Next.js 14 (App Router) + Tailwind CSS + lucide-react
- **Backend** : API Routes Next.js (équivalent Express, exécutées comme fonctions
  serverless sur Vercel)
- **Stockage** : fichiers JSON (`/data/plats.json`, `/data/commandes.json`)

> ⚠️ **Important** : le stockage JSON fonctionne parfaitement en local. Sur Vercel,
> le système de fichiers est en lecture seule (sauf `/tmp`, qui n'est **pas persistant**
> entre les invocations). C'est donc idéal pour une démo, mais pour une vraie mise en
> production, il faudra migrer vers une base de données (Vercel Postgres, Supabase,
> MongoDB Atlas...). La logique est isolée dans `lib/db.js` pour faciliter cette migration.

## Structure du projet

```
lapin-gestion/
├── app/
│   ├── api/
│   │   ├── plats/
│   │   │   ├── route.js          # GET, POST /api/plats
│   │   │   └── [id]/route.js     # PUT, DELETE /api/plats/:id
│   │   └── commandes/
│   │       ├── route.js          # GET, POST /api/commandes
│   │       └── [id]/route.js     # PUT /api/commandes/:id
│   ├── admin/
│   │   └── page.js               # Page du tableau de bord admin
│   ├── layout.js                 # Layout racine + navigation
│   ├── page.js                   # Page d'accueil (vitrine client)
│   └── globals.css
├── components/
│   ├── Menu.js                   # Catalogue des plats
│   ├── Panier.js                 # Panier d'achat
│   ├── FormulaireCommande.js     # Formulaire de commande client
│   └── AdminDashboard.js         # CRUD plats + commandes + stats
├── data/
│   ├── plats.json                # Données initiales des plats
│   └── commandes.json            # Données initiales des commandes (vide)
├── lib/
│   └── db.js                     # Couche d'accès aux données JSON
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
├── vercel.json
├── package.json
└── .gitignore
```

## Installation locale

```bash
npm install
npm run dev
```

L'application est disponible sur http://localhost:3000
Le tableau de bord admin est sur http://localhost:3000/admin

## Routes API disponibles

| Méthode | Route                  | Description                          |
|---------|-------------------------|---------------------------------------|
| GET     | `/api/plats`            | Liste tous les plats                  |
| POST    | `/api/plats`             | Ajoute un nouveau plat                |
| PUT     | `/api/plats/:id`         | Modifie un plat (dont son statut)     |
| DELETE  | `/api/plats/:id`         | Supprime un plat                      |
| GET     | `/api/commandes`         | Liste toutes les commandes            |
| POST    | `/api/commandes`         | Crée une nouvelle commande            |
| PUT     | `/api/commandes/:id`     | Met à jour le statut d'une commande   |

## 🚀 Déploiement : Git + GitHub + Vercel

### 1. Initialiser le dépôt Git local

```bash
cd lapin-gestion
git init
git add .
git commit -m "Initial commit - Chez Lapin app"
```

Le fichier `.gitignore` fourni exclut déjà `node_modules`, `.next`, `.env*` et `.vercel`.

### 2. Publier sur GitHub

Créez d'abord un nouveau dépôt vide sur https://github.com/new (sans README ni
.gitignore), puis :

```bash
git branch -M main
git remote add origin https://github.com/<votre-utilisateur>/lapin-gestion.git
git push -u origin main
```

### 3. Déployer sur Vercel

**Option A — via le site Vercel (le plus simple) :**
1. Allez sur https://vercel.com/new
2. Importez le dépôt GitHub `lapin-gestion`
3. Vercel détecte automatiquement Next.js — laissez les réglages par défaut
4. Cliquez sur **Deploy**

**Option B — via Vercel CLI :**

```bash
npm install -g vercel
vercel login
vercel            # déploiement de prévisualisation
vercel --prod     # déploiement en production
```

Suivez les instructions interactives (choix du scope, nom du projet, etc.).
Vercel vous donnera une URL du type `https://lapin-gestion.vercel.app`.

### 4. Mises à jour futures

Après chaque `git push` sur la branche `main`, Vercel redéploie automatiquement
l'application (si le projet est connecté au dépôt GitHub).

## Prochaines évolutions suggérées

- Authentification pour protéger `/admin` (ex: NextAuth.js)
- Migration du stockage JSON vers une base de données persistante
- Notifications par SMS/WhatsApp lors d'une nouvelle commande
- Upload d'images des plats (ex: Vercel Blob / Cloudinary)
