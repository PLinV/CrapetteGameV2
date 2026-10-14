# Crapette

Jeu de cartes de la Crapette en ligne, en 1 contre 1 : on crée une partie (publique ou protégée par un mot de passe)
ou on rejoint une partie en attente depuis le menu « Jouer ».

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

L'appli tourne derrière un **Traefik** déjà installé sur le serveur, qui gère le HTTPS.

1. L'image est construite et publiée automatiquement par GitHub Actions (`.github/workflows/docker.yml`)
   sur `ghcr.io/plinv/crapettegamev2` :
   - chaque push sur `main` publie `:latest` ;
   - un tag de version publie `:1.0.0` :
     ```bash
     git tag v1.0.0 && git push origin v1.0.0
     ```
2. Sur le serveur, il suffit de `docker-compose.prod.yml` et d'un `.env` rempli à partir de `.env.example`
   (domaine, image, secrets, réglages Traefik). Puis :
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```

Passer un compte admin :

```bash
docker compose -f docker-compose.prod.yml exec db sh -c \
  "psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"UPDATE users SET is_admin = true WHERE username = 'PSEUDO'\""
```

Mot de passe oublié : un admin connecté ouvre « Mot de passe oublié d'un joueur » sur la page d'accueil,
entre le pseudo et envoie le lien obtenu au joueur (valable 1 h, une seule fois). Le joueur y choisit
un nouveau mot de passe ; ses autres sessions sont fermées.

## Zones du plateau

| Zone | Rôle |
|---|---|
| `11` / `21` | défausse du joueur 1 / joueur 2 (chacun voit ses zones en bas) |
| `12` / `22` | talon (pioche) |
| `13` / `23` | crapette (13 cartes) |
| `31`-`38` | centre : -1 en alternant rouge/noir, n'importe quelle carte sur une place vide |
| `41`-`44`, `51`-`54` | fondations : de l'As au Roi dans la même enseigne |
