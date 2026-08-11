FROM node:20-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Se hornea en el bundle al momento de compilar — hay que pasarla como
# variable de build en Railway (ver DEPLOY.md), apuntando a la URL
# pública del servicio de backend.
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
