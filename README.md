# SABAK FITNESS — Frontend (React + Vite + PWA)

Interface de gestion de la salle de sport SABAK FITNESS : clients, abonnements, caisse,
dépenses, rapports et rappels. Application **installable (PWA)** et déployable sur **Vercel**.

## Développement

```bash
npm install
npm run dev
```

Le serveur Vite écoute sur `http://localhost:5173` et proxifie `/api` vers
`http://127.0.0.1:8002` (backend Laravel local).

## Configuration de l'API

L'URL de l'API est lue depuis `VITE_API_URL` (voir `src/lib/api.js`) :

| Contexte | `VITE_API_URL` |
|---|---|
| Dev local | *(vide)* → utilise le proxy Vite `/api` |
| Build de production | `https://sabak.digitgroup.tech/api` (défini dans `.env.production`) |
| Vercel | variable d'environnement `VITE_API_URL` (prioritaire) |

⚠️ Pas de slash final. Le backend doit autoriser l'origine du frontend (CORS).

## Déploiement sur Vercel

### 1. Importer le projet

- **New Project** → sélectionner le dépôt
- **Root Directory** : `frontend`
- **Framework Preset** : `Vite`
- **Build Command** : `npm run build`
- **Output Directory** : `dist`

### 2. Variable d'environnement

| Nom | Valeur | Environnements |
|---|---|---|
| `VITE_API_URL` | `https://sabak.digitgroup.tech/api` | Production, Preview, Development |

> `vercel.json` est déjà configuré : rewrites SPA, en-têtes de cache du service worker,
> `manifest.webmanifest` en `application/manifest+json`, assets immutables.

### 3. Déployer

```bash
npm i -g vercel
vercel login
cd frontend
vercel --prod
```

Ou via Git : chaque `push` sur `main` déclenche un déploiement.

### 4. Domaine personnalisé

Vercel → **Settings → Domains** → ajouter le domaine, puis créer l'enregistrement DNS
demandé (`CNAME` vers `cname.vercel-dns.com`).

## PWA

- `manifest.webmanifest` généré par `vite-plugin-pwa` (nom, icônes, raccourcis, thème)
- Service worker (`sw.js`) généré au build :
  - précache de l'app shell → l'interface se charge même hors-ligne
  - **aucun cache pour `/api/` et `/storage/`** (données de caisse toujours fraîches)
  - cache des images et polices
  - mise à jour automatique (`registerType: 'autoUpdate'`)
- Icônes : `public/pwa-192x192.png`, `public/pwa-512x512.png`,
  `public/maskable-512x512.png`, `public/apple-touch-icon.png`

### Installer l'application

- **Android / Chrome** : bannière « Installer l'application » ou menu ⋮ → *Installer*
- **iOS / Safari** : Partager → *Sur l'écran d'accueil*
- **Desktop** : icône d'installation dans la barre d'adresse

### Vérifier

```bash
npm run build
npm run preview   # http://localhost:4173
```

Puis Chrome DevTools → **Application** (manifest, service worker) et **Lighthouse → PWA**.
Le service worker n'est actif qu'en build (pas en `npm run dev`).

## Scripts

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production + génération du service worker |
| `npm run preview` | Prévisualisation du build |

## Structure

```
src/
  lib/api.js        # client HTTP (Bearer token, base URL configurable)
  pages/            # écrans métier
  App.jsx           # routes + layout + indicateur hors-ligne
public/             # icônes PWA, robots.txt
vercel.json         # configuration de déploiement
```
