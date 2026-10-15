# Crapette

Jeu de cartes de la Crapette en ligne, en 1 contre 1 et en temps réel.

- Comptes joueurs : inscription, connexion, photo de profil, changement de pseudo et de mot de passe.
- Menu « Jouer » : créer une partie (publique ou protégée par un mot de passe) ou rejoindre une partie en attente.
- Partie mise en pause si un joueur part : il a 6 minutes pour revenir, sinon il perd par forfait.
  Si les deux partent, la partie est annulée.
- Historique, statistiques, classement et rivalités.
- Outils admin : réinitialisation de mot de passe, actions de test en partie.

## Sommaire

1. [Technologies](#technologies)
2. [Organisation du code](#organisation-du-code)
3. [Variables d'environnement](#variables-denvironnement)
4. [Développement](#développement)
5. [Tester en mode production](#tester-en-mode-production)
6. [Production](#production)
7. [Publier une nouvelle version](#publier-une-nouvelle-version)
8. [Administration](#administration)
9. [Règles du jeu](#règles-du-jeu)
10. [Dépannage](#dépannage)

## Technologies

| | |
|---|---|
| Front | React 19, TypeScript, Vite, Tailwind CSS, framer-motion, React Router, socket.io-client |
| Back | Node.js, Express 5, TypeScript, Socket.IO, PostgreSQL (`pg`), JWT en cookies, bcrypt, helmet |
| Déploiement | Docker, GitHub Actions (image publiée sur ghcr.io), Traefik (HTTPS) |

Le serveur fait autorité sur toutes les règles : le navigateur ne reçoit jamais la valeur des cartes cachées
et chaque coup est vérifié côté serveur.

En production, Express sert aussi le frontend : le site, l'API (`/api`) et le socket (`/socket.io`)
sont sur un seul domaine. En dev, le serveur Vite redirige `/api` et `/socket.io` vers le backend.

## Organisation du code

```
backend/
  backserver.ts        point d'entrée : Express, Socket.IO, fichiers du front, tâche de nettoyage
  config.ts            lecture des variables d'environnement
  routes/routes.ts     routes de l'API (/api/...)
  controllers/         logique des routes (comptes, stats, page privée)
  middleware/          vérification de la connexion et du rôle admin
  repositories/        requêtes SQL ; database.ts crée les tables au démarrage
  services/            jetons, calcul des statistiques
  sockets/             événements temps réel (tables, coups, pause, forfait)
  game/                règles : paquet, plateau, partie
  docker-compose.yml   PostgreSQL pour le dev
frontend/
  src/pages/           une page par route (accueil, jeu, menu Jouer, historique...)
  src/components/      plateau, cartes, popups, avatar...
  src/hooks/           état de la partie, utilisateur connecté, socket
  src/services/        appels à l'API et socket
constant/plateau.ts    zones du plateau, partagées par le front et le back
Dockerfile             image de production (front + back)
docker-compose.prod.yml  production derrière Traefik
docker-compose.test.yml  test local de l'image, sans Traefik
.env.example         modèle du fichier .env
```

## Variables d'environnement

Modèle : [`.env.example`](.env.example). Le `.env` contient des secrets : il n'est jamais commité (voir `.gitignore`).

| Variable | Dev | Prod | Rôle |
|---|---|---|---|
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | requis | requis | identifiants de la base |
| `DB_HOST`, `DB_PORT` | défaut `localhost:5432` | fixés par le compose | adresse de la base |
| `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET` | valeur par défaut | **requis** | signature des jetons de connexion |
| `PEPPER` | valeur par défaut | **requis** | ajouté aux mots de passe avant hachage |
| `DOMAIN` | | requis | nom de domaine du site |
| `APP_IMAGE` | | conseillé | image à lancer, ex. `ghcr.io/plinv/crapettegamev2:1.1.0` |
| `TRAEFIK_NETWORK`, `TRAEFIK_ENTRYPOINT`, `TRAEFIK_CERTRESOLVER` | | selon le serveur | réglages du Traefik existant |
| `FORFEIT_DELAY_SECONDS` | optionnel | optionnel | délai avant forfait (défaut 360) |
| `PORT` | optionnel | | port du serveur (défaut 3000) |

En production (`NODE_ENV=production`), le serveur **refuse de démarrer** si un secret manque.

Générer un secret :

```bash
openssl rand -hex 32
```

> ⚠️ Ne jamais changer `PEPPER` une fois des comptes créés : tous les mots de passe deviendraient invalides.

## Développement

Prérequis : Node.js 24, Docker.

```bash
# 1. Base de données
cd backend
cp ../.env.example .env     # puis remplir au moins les variables POSTGRES_*
docker compose up -d db     # PostgreSQL sur localhost:5432

# 2. Backend
npm install
npm run dev                 # API sur http://localhost:3000, relancée à chaque modification

# 3. Frontend (dans un autre terminal)
cd frontend
npm install
npm run dev                 # site sur http://localhost:5173
```

Ouvrir http://localhost:5173. Les tables sont créées automatiquement au premier démarrage du backend.

Pour jouer seul contre soi-même : ouvrir une fenêtre normale et une fenêtre privée, avec deux comptes différents.

Commandes utiles pour la base de dev :

```bash
cd backend
docker exec -it crapette_db psql -U crapette_admin -d crapette_db          # console SQL
docker exec -it crapette_db psql -U crapette_admin -d crapette_db -c "SELECT id, username, is_admin FROM users;"
docker compose down                                                        # arrêter (les données restent)
docker compose down -v                                                     # arrêter et TOUT effacer
```

### Vérifier le code (comme la CI)

```bash
cd backend  && npx tsc --noEmit
cd frontend && npx tsc -b && npx eslint .
```

## Tester en mode production

Avant de déployer, on peut lancer l'appli en local exactement comme en production
(code compilé, en-têtes de sécurité, cookies sécurisés, limites de requêtes actives).
Trois façons, de la plus proche de la prod à la plus rapide.

### a) Avec l'image publiée sur ghcr.io

C'est l'image que le serveur téléchargera. [`docker-compose.test.yml`](docker-compose.test.yml) lance l'appli
et une base **vierge**, sans Traefik ni HTTPS, avec des secrets factices (ne jamais s'en servir en prod).

```bash
export APP_IMAGE=ghcr.io/plinv/crapettegamev2:1.1.0   # ou :latest pour le dernier commit de main
export TEST_PORT=3100                                 # pour ne pas gêner le backend de dev sur 3000

docker compose -p crapette-test -f docker-compose.test.yml pull
docker compose -p crapette-test -f docker-compose.test.yml up -d
```

Ouvrir http://localhost:3100. Quand c'est fini, tout effacer (conteneurs et base de test) :

```bash
docker compose -p crapette-test -f docker-compose.test.yml down -v
```

`-p crapette-test` donne un nom séparé à ce test : il ne touche ni à la base de dev ni à une autre installation.

### b) Sans image publiée : construire l'image en local

Pour tester le code actuel avant de le pousser :

```bash
docker build -t crapette:local .

export APP_IMAGE=crapette:local TEST_PORT=3100
docker compose -p crapette-test -f docker-compose.test.yml up -d
# ... tests sur http://localhost:3100 ...
docker compose -p crapette-test -f docker-compose.test.yml down -v
docker rmi crapette:local          # supprimer l'image si besoin
```

### c) Sans Docker pour l'appli

Le plus rapide après une modification. Utilise la base de dev (`docker compose up -d db` dans `backend/`).

```bash
cd frontend && npm run build        # crée frontend/dist
cd ../backend && npm run build      # crée backend/dist

NODE_ENV=production PORT=3200 \
ACCESS_TOKEN_SECRET=test1 REFRESH_TOKEN_SECRET=test2 PEPPER=test3 \
npm start
```

Ouvrir http://localhost:3200. `Ctrl+C` pour arrêter.

> Les comptes créés avec ce `PEPPER` de test ne pourront pas se connecter avec le backend de dev, qui en utilise
> un autre : utiliser des comptes de test et les supprimer ensuite.

Remarque : en mode production, les cookies sont marqués `Secure`. Les navigateurs les acceptent sur
`http://localhost`, mais pas sur une autre adresse en HTTP (par ex. l'IP de la machine depuis un téléphone).

## Production

L'appli tourne derrière un **Traefik** déjà installé sur le serveur, qui gère le nom de domaine et le HTTPS.
La base PostgreSQL n'est joignable que par l'appli (pas de port ouvert).

### Première installation

Sur le serveur, il suffit de deux fichiers dans un dossier : `docker-compose.prod.yml` et `.env`.

1. Copier `docker-compose.prod.yml` et créer le `.env` à partir de `.env.example` :
   - `DOMAIN` : le nom de domaine (il doit pointer vers le serveur) ;
   - `APP_IMAGE=ghcr.io/plinv/crapettegamev2:1.1.0` ;
   - `TRAEFIK_*` : à demander à l'administrateur du Traefik ;
   - `POSTGRES_PASSWORD`, `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, `PEPPER` : chacun avec `openssl rand -hex 32`.
2. Lancer :
   ```bash
   docker compose -f docker-compose.prod.yml pull
   docker compose -f docker-compose.prod.yml up -d
   ```
3. Vérifier :
   ```bash
   docker compose -f docker-compose.prod.yml ps                 # les deux conteneurs "Up" / "healthy"
   docker compose -f docker-compose.prod.yml logs -f app        # doit afficher "[DB] tables prêtes"
   curl https://MON_DOMAINE/api/health
   ```
4. Créer son compte sur le site puis le passer admin (voir [Administration](#administration)).
5. Créer tout de suite le compte `Anna`, avec cette casse exacte (voir [Page privée](#page-privée)).

### Sans image publiée : construire sur le serveur

Si l'image ghcr.io n'est pas disponible, on peut construire l'image directement sur le serveur.
Il faut alors tout le code (`git clone`) et **laisser `APP_IMAGE` vide** dans le `.env` :

```bash
git clone https://github.com/PLinV/CrapetteGameV2.git crapette && cd crapette
cp .env.example .env    # puis remplir, sans APP_IMAGE
docker compose -f docker-compose.prod.yml up -d --build
```

Pour mettre à jour : `git pull` puis la même commande `up -d --build`.

### Mettre à jour

Changer la version de `APP_IMAGE` dans le `.env` (ex. `:1.1.0` → `:1.2.0`), puis :

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

Les comptes et l'historique sont conservés : les nouvelles tables et colonnes sont ajoutées automatiquement
au démarrage. Les parties en cours au moment de la mise à jour sont perdues (elles ne vivent qu'en mémoire) :
mieux vaut mettre à jour quand personne ne joue.

Revenir en arrière : remettre l'ancienne version dans `APP_IMAGE` et relancer les deux mêmes commandes.

### Sauvegarder et restaurer la base

```bash
# Sauvegarde
docker compose -f docker-compose.prod.yml exec -T db sh -c 'pg_dump -U $POSTGRES_USER $POSTGRES_DB' > sauvegarde.sql

# Restauration (dans une base vide, par ex. après "down -v" puis "up -d")
docker compose -f docker-compose.prod.yml exec -T db sh -c 'psql -U $POSTGRES_USER -d $POSTGRES_DB' < sauvegarde.sql
```

À faire avant chaque mise à jour.

### Commandes utiles

```bash
docker compose -f docker-compose.prod.yml logs -f app     # journaux de l'appli
docker compose -f docker-compose.prod.yml restart app     # redémarrer l'appli
docker compose -f docker-compose.prod.yml down            # arrêter (les données restent)
docker compose -f docker-compose.prod.yml down -v         # ⚠️ arrêter et EFFACER la base
```

## Publier une nouvelle version

L'image est construite et publiée par GitHub Actions ([`.github/workflows/docker.yml`](.github/workflows/docker.yml))
sur `ghcr.io/plinv/crapettegamev2`, après les vérifications TypeScript et ESLint :

| Événement | Image publiée |
|---|---|
| push sur `main` | `:latest` et `:sha-xxxxxxx` |
| tag `v1.2.0` | `:1.2.0` et `:1.2` |
| pull request | vérifications et build seulement, rien n'est publié |

Pour sortir une version :

```bash
git tag v1.2.0
git push origin v1.2.0
```

Puis suivre l'onglet **Actions** du dépôt GitHub, tester l'image (voir [Tester en mode production](#a-avec-limage-publiée-sur-ghcrio))
et la déployer (voir [Mettre à jour](#mettre-à-jour)).

## Administration

### Passer un compte admin

En production :

```bash
docker compose -f docker-compose.prod.yml exec db sh -c \
  "psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"UPDATE users SET is_admin = true WHERE username = 'PSEUDO'\""
```

En dev :

```bash
docker exec -it crapette_db psql -U crapette_admin -d crapette_db -c "UPDATE users SET is_admin = true WHERE username = 'PSEUDO';"
```

Le rôle est relu en base : il suffit de recharger la page (F5).

### Mot de passe oublié

Un admin connecté ouvre « Mot de passe oublié d'un joueur » sur la page d'accueil, entre le pseudo
et envoie le lien obtenu au joueur (valable 1 h, une seule fois). Le joueur y choisit un nouveau mot de passe ;
ses autres sessions sont fermées.

### Outils de test en partie

En partie, un admin voit un panneau « 🛠 Admin » : mettre un joueur à un coup de la victoire, donner la main,
faire gagner un joueur, redistribuer une nouvelle partie. Les parties gagnées ainsi comptent dans l'historique.

### Nettoyage automatique

Chaque nuit à 3 h, le serveur supprime les jetons de connexion et liens de réinitialisation expirés.

## Règles du jeu

Variante jouée ici :

- Chaque joueur a une crapette (13 cartes), un talon (pioche) et une défausse.
- On pioche une carte du talon vers sa défausse ; on ne peut repiocher qu'après avoir joué une carte depuis sa défausse.
- Pas de fin de tour automatique : on clique « Passer mon tour » quand on ne peut plus rien faire.
- Les cartes de l'adversaire (sommet de sa crapette ou de sa défausse) ne peuvent servir qu'à monter aux fondations.
  Si on monte sa dernière carte, c'est lui qui gagne.
- **Faute** : une carte pouvait monter aux fondations et le joueur ne l'a pas fait. C'est l'adversaire qui crie
  « Crapette ! » avec le bouton : s'il a raison, il reprend la main.
- **Victoire** : crapette, talon et défausse vides.

### Zones du plateau

| Zone | Rôle |
|---|---|
| `11` / `21` | défausse du joueur 1 / joueur 2 (chacun voit ses zones en bas) |
| `12` / `22` | talon (pioche) |
| `13` / `23` | crapette (13 cartes) |
| `31`-`38` | centre : -1 en alternant rouge/noir, n'importe quelle carte sur une place vide |
| `41`-`44`, `51`-`54` | fondations : de l'As au Roi dans la même enseigne |

## Dépannage

| Problème | Solution |
|---|---|
| `Variable d'environnement manquante : ...` au démarrage | un secret manque dans le `.env` de production |
| `port is already allocated` | un autre programme utilise ce port : changer `TEST_PORT` ou `PORT` |
| l'appli ne joint pas la base en dev | vérifier `docker ps` (conteneur `crapette_db`) et les `POSTGRES_*` de `backend/.env` |
| connexion impossible en test sur une IP en HTTP | les cookies sécurisés exigent HTTPS ou `localhost` |
| `Trop de tentatives, réessayez plus tard.` en test | les limites de requêtes sont actives en mode production : attendre ou relancer le conteneur |
| 404 ou mauvais certificat en prod | vérifier `DOMAIN`, le DNS et les réglages `TRAEFIK_*` |
| plus personne ne peut se connecter après une modification du `.env` | `PEPPER` a été changé : remettre l'ancienne valeur |
