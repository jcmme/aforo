FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000

# Corre migraciones y siembra los roles/usuarios de desarrollo en cada
# arranque (ambos son idempotentes: no duplican nada si ya corrieron)
# antes de levantar el servidor. Así un deploy nuevo siempre queda listo
# para usarse sin un paso manual aparte.
CMD ["sh", "-c", "npm run migration:run && npm run seed && node dist/main.js"]
