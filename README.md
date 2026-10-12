# Crapette

Jeu de cartes de la Crapette en ligne, en 1 contre 1 dans des tables privées.

- `frontend/` : React + Vite + Tailwind + framer-motion
- `backend/` : Express + Socket.IO + PostgreSQL. Le serveur fait autorité sur toutes les règles.
- `constant/plateau.ts` : les zones du plateau, partagées par les deux côtés

En production, Express sert aussi le frontend : le site, l'API (`/api`) et le socket (`/socket.io`)
sont sur un seul domaine. En dev, le serveur Vite redirige `/api` et `/socket.io` vers le backend.

## Développement

```bash
cd backend
cp ../.env.example .env     # puis remplir au moins les variables POSTGRES_*
docker compose up -d db     # PostgreSQL
npm install && npm run dev  # API sur http://localhost:3000

cd ../frontend
npm install && npm run dev  # site sur http://localhost:5173
```

En dev, les secrets (`ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, `PEPPER`) ont des valeurs par défaut.
En production, le serveur refuse de démarrer s'ils manquent.

## Production

```bash
cp .env.example .env   # à la racine, remplir toutes les variables
docker compose -f docker-compose.prod.yml up -d --build
```

Trois conteneurs : `db` (PostgreSQL, non exposé), `app` (Node) et `caddy` (HTTPS automatique pour `DOMAIN`).

Passer un compte admin :

```bash
docker compose -f docker-compose.prod.yml exec db sh -c \
  "psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"UPDATE users SET is_admin = true WHERE username = 'PSEUDO'\""
```

## Zones du plateau

| Zone | Rôle |
|---|---|
| `11` / `21` | défausse du joueur 1 / joueur 2 (chacun voit ses zones en bas) |
| `12` / `22` | talon (pioche) |
| `13` / `23` | crapette (13 cartes) |
| `31`-`38` | centre : -1 en alternant rouge/noir, n'importe quelle carte sur une place vide |
| `41`-`44`, `51`-`54` | fondations : de l'As au Roi dans la même enseigne |
