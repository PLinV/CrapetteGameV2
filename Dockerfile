# ---- Étape 1 : build du front et du back ----
FROM node:24-alpine AS build
WORKDIR /app

COPY backend/package*.json backend/
RUN cd backend && npm ci
COPY frontend/package*.json frontend/
RUN cd frontend && npm ci

COPY constant constant
COPY backend backend
COPY frontend frontend
RUN cd frontend && npm run build \
 && cd ../backend && npm run build && npm prune --omit=dev

# ---- Étape 2 : image finale, sans les sources ni les outils de build ----
FROM node:24-alpine
WORKDIR /app/backend
ENV NODE_ENV=production

COPY --from=build /app/backend/package.json ./
COPY --from=build /app/backend/node_modules node_modules
COPY --from=build /app/backend/dist dist
COPY --from=build /app/frontend/dist ../frontend/dist

USER node
EXPOSE 3000
CMD ["node", "dist/backend/backserver.js"]
