# Crapette

Jeu de cartes de la Crapette en ligne, en 1 contre 1 dans des tables privées.

- `frontend/` : React + Vite + Tailwind + framer-motion
- `backend/` : Express + Socket.IO + PostgreSQL. Le serveur fait autorité sur toutes les règles.
- `constant/plateau.ts` : les zones du plateau, partagées par les deux côtés

## Lancer le projet

```bash
cd backend
docker compose up -d db   # PostgreSQL (identifiants dans backend/.env)
npm install && npm run dev  # http://localhost:3000

cd ../frontend
npm install && npm run dev  # http://localhost:5173
```

## Zones du plateau

| Zone | Rôle |
|---|---|
| `11` / `21` | défausse du joueur 1 / joueur 2 (chacun voit ses zones en bas) |
| `12` / `22` | talon (pioche) |
| `13` / `23` | crapette (13 cartes) |
| `31`-`38` | centre : -1 en alternant rouge/noir, n'importe quelle carte sur une place vide |
| `41`-`44`, `51`-`54` | fondations : de l'As au Roi dans la même enseigne |
