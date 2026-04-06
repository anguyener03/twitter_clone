# ── Stage 1: build deps ──────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app/server

# Install production dependencies only
COPY server/package*.json ./
RUN npm ci --omit=dev

# ── Stage 2: final image ─────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Copy production node_modules from deps stage
COPY --from=deps /app/server/node_modules ./server/node_modules

# Copy server source
COPY server/ ./server/

# Copy frontend static files (Express serves these)
COPY client/ ./client/

# Non-root user for security
RUN addgroup -S chirper && adduser -S chirper -G chirper
USER chirper

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "server/server.js"]
