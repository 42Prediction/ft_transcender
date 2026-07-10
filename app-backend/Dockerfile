# ---- Build stage: compile TypeScript -> dist ----
FROM node:20-bookworm-slim AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Runtime stage: production-only deps + compiled output ----
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install only production dependencies (native modules — sharp, bcrypt, pg —
# are rebuilt here for the runtime platform).
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

# Entrypoint runs migrations + seed on boot, then starts the API.
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Log file (tailed by Logstash) and avatar uploads live on mounted volumes.
RUN mkdir -p /app/logs /app/uploads

EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
