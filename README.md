# 🐇 Chez Lapin — Gestionnaire de Vente de Plats de Lapin

Application web complète (Next.js 15, App Router, Tailwind CSS) pour la vente de plats
de lapin : vitrine client, panier, formulaire de commande, et tableau de bord
d'administration protégé par mot de passe (CRUD plats, gestion des commandes,
contrôle des entrées/sorties de stock, statistiques avec graphique exportable en PDF).

## Stack technique

- **Frontend** : React 19 + Next.js 15 (App Router) + Tailwind CSS + lucide-react +
  recharts (graphique) + jsPDF / html2canvas (export PDF)
- **Backend** : API Routes Next.js (équivalent Express, exécutées comme fonctions
  serverless sur Vercel)
- **Stockage** : fichiers JSON (`/data/plats.json`, `/data/commandes.json`,
  `/data/mouvements.json`, `/data/admin.json`)
- **Authentification admin** : mot de passe généré automatiquement, haché (PBKDF2),
  session par cookie signé (HMAC) — voir section dédiée ci-dessous

> ⚠️ **Important** : le stockage JSON fonctionne parfaitement en local. Sur Vercel,
> le système de fichiers est en lecture seule (sauf `/tmp`, qui n'est **pas persistant**
> entre les invocations). C'est donc idéal pour une démo, mais pour une vraie mise en
> production, il faudra migrer vers une base de données (Vercel Postgres, Supabase,
> MongoDB Atlas...). La logique est isolée dans `lib/db.js` pour faciliter cette migration.

## 🔐 Mot de passe administrateur

Aucun mot de passe n'est codé en dur dans le projet. **Au tout premier chargement**
de `/admin`, l'application génère automatiquement un mot de passe robuste
(12 caractères aléatoires) et l'affiche **une seule fois** à l'écran, avec un
bouton pour le copier. Notez-le : il ne sera plus jamais affiché en clair
ensuite (seul son hash est conservé dans `data/admin.json`, qui est
volontairement exclu du dépôt Git via `.gitignore`).

- Si vous fermez la page avant de l'avoir noté, un lien "Générer un autre mot de
  passe" est disponible tant que vous n'avez pas cliqué sur "j'ai noté mon mot
  de passe".
- Une fois confirmé, la connexion se fait via un formulaire classique
  (`/admin` → mot de passe).
- Depuis l'onglet **Paramètres** du tableau de bord, l'administrateur peut à
  tout moment régénérer un nouveau mot de passe (l'ancien est immédiatement
  invalidé).
- La session dure 8h (cookie `httpOnly`, signé par HMAC) puis redemande une
  connexion.

> Sur un déploiement Vercel, rappelez-vous que `data/admin.json` est stocké
> dans `/tmp` (voir note sur le stockage plus bas) : **le mot de passe peut donc
> être régénéré après un redéploiement ou une inactivité prolongée** de la
> fonction serverless. Pour un usage sérieux en production, migrez vers une
> vraie base de données afin que le mot de passe reste stable dans le temps,
> ou utilisez une variable d'environnement + NextAuth.js.

## 📦 Contrôle des entrées / sorties de stock

Chaque plat a désormais un champ `stock` (quantité). Dans l'onglet
**"Entrées / Sorties"** de l'espace admin :

- L'administrateur peut enregistrer une **entrée** (réapprovisionnement) ou une
  **sortie** manuelle (perte, produit périmé, ajustement) pour un plat donné.
- Un historique horodaté de tous les mouvements est conservé
  (`data/mouvements.json`).
- **Déduction automatique** : quand une commande passe au statut "Livrée",
  le stock des plats commandés est automatiquement décrémenté et une "Sortie"
  est enregistrée dans l'historique (une seule fois par commande, même si le
  statut est modifié plusieurs fois).

## 📊 Graphique du chiffre d'affaires (export PDF)

L'onglet **Statistiques** affiche un graphique en barres du chiffre d'affaires
des 7 derniers jours (recharts), avec un bouton **"Télécharger en PDF"** qui
capture le graphique et génère un fichier PDF prêt à imprimer ou archiver
(jsPDF + html2canvas, entièrement côté client, sans service externe).

## Structure du projet

```
lapin-gestion/
├── app/
│   ├── api/
│   │   ├── admin/
│   │   │   ├── setup/route.js           # GET  - génère/renvoie le mdp en attente
│   │   │   ├── setup/confirmer/route.js # POST - confirme "j'ai noté"
│   │   │   ├── setup/regenerer/route.js # POST - régénère avant confirmation
│   │   │   ├── login/route.js           # POST - connexion, pose le cookie
│   │   │   ├── logout/route.js          # POST - déconnexion
│   │   │   ├── session/route.js         # GET  - vérifie la session en cours
│   │   │   └── mot-de-passe/route.js    # POST - change le mdp (authentifié)
│   │   ├── plats/
│   │   │   ├── route.js          # GET (public), POST (admin) /api/plats
│   │   │   └── [id]/route.js     # PUT, DELETE (admin) /api/plats/:id
│   │   ├── commandes/
│   │   │   ├── route.js          # GET (admin), POST (public) /api/commandes
│   │   │   └── [id]/route.js     # PUT (admin) - déduit le stock si "Livrée"
│   │   └── mouvements/route.js   # GET, POST (admin) - entrées/sorties de stock
│   ├── admin/
│   │   └── page.js               # Page du tableau de bord admin (via AdminGate)
│   ├── layout.js                 # Layout racine + navigation
│   ├── page.js                   # Page d'accueil (vitrine client)
│   └── globals.css
├── components/
│   ├── Menu.js                   # Catalogue des plats
│   ├── Panier.js                 # Panier d'achat
│   ├── FormulaireCommande.js     # Formulaire de commande client
│   ├── AdminGate.js              # Génération mdp / écran de connexion admin
│   ├── AdminDashboard.js         # CRUD plats + commandes + stats + onglets
│   ├── GraphiqueVentes.js        # Graphique CA 7 jours + export PDF
│   └── GestionStock.js           # Entrées/sorties de stock + historique
├── data/
│   ├── plats.json                # Données initiales des plats (avec stock)
│   ├── commandes.json            # Données initiales des commandes (vide)
│   ├── mouvements.json           # Historique des mouvements de stock (vide)
│   └── admin.json                # Généré au 1er lancement (gitignored)
├── lib/
│   ├── db.js                     # Couche d'accès aux données JSON
│   └── auth.js                   # Génération mdp, hachage, sessions signées
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

| Méthode | Route                          | Accès  | Description                                    |
|---------|----------------------------------|--------|-------------------------------------------------|
| GET     | `/api/plats`                    | Public | Liste tous les plats                            |
| POST    | `/api/plats`                    | Admin  | Ajoute un nouveau plat                          |
| PUT     | `/api/plats/:id`                | Admin  | Modifie un plat (statut, stock...)              |
| DELETE  | `/api/plats/:id`                | Admin  | Supprime un plat                                |
| GET     | `/api/commandes`                | Admin  | Liste toutes les commandes                      |
| POST    | `/api/commandes`                | Public | Crée une nouvelle commande (client)             |
| PUT     | `/api/commandes/:id`            | Admin  | Change le statut (déduit le stock si "Livrée")  |
| GET     | `/api/mouvements`                | Admin  | Historique des entrées/sorties de stock         |
| POST    | `/api/mouvements`                | Admin  | Enregistre une entrée ou sortie de stock        |
| GET     | `/api/admin/setup`              | Public | Génère/renvoie le mdp en attente de confirmation|
| POST    | `/api/admin/setup/confirmer`    | Public | Confirme "j'ai noté mon mot de passe"           |
| POST    | `/api/admin/setup/regenerer`    | Public*| Régénère le mdp (*avant confirmation seulement) |
| POST    | `/api/admin/login`              | Public | Connexion (pose le cookie de session)           |
| POST    | `/api/admin/logout`             | -      | Déconnexion                                     |
| GET     | `/api/admin/session`            | -      | Vérifie si la session est valide                |
| POST    | `/api/admin/mot-de-passe`       | Admin  | Génère un nouveau mot de passe                  |

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
