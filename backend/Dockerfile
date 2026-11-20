# Multi-stage production Dockerfile for SkillBridge Backend
FROM node:20-alpine AS dependencies

WORKDIR /app

# Install build dependencies if native addons needed
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Production runner image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5001

# Create non-root system user and storage directory
RUN addgroup -S appgroup && adduser -S appuser -G appgroup && \
    mkdir -p /app/storage/resumes && \
    chown -R appuser:appgroup /app

COPY --from=dependencies /app/node_modules ./node_modules
COPY --chown=appuser:appgroup . .

# Run as non-privileged user
USER appuser

EXPOSE 5001

# Liveness probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:5001/api/v1/health || exit 1

CMD ["node", "server.js"]
