# ---- Build stage: type-check + Vite production build ----
FROM node:20-bookworm-slim AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# Baked into the bundle at build time; the browser calls the backend directly.
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---- Runtime stage: static files served by nginx ----
FROM nginx:1.27-alpine AS runner
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
