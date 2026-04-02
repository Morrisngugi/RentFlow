# Unified Dockerfile for Frontend - Development and Production
# Use build argument ENVIRONMENT to switch between dev and prod modes
# Default: production
ARG ENVIRONMENT=production

# ================================
# 1. Dependencies Stage
# ================================
FROM cgr.dev/chainguard/node:latest-dev AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
USER root

RUN npm ci --no-audit --legacy-peer-deps

# ================================
# 2. Builder Stage
# ================================
FROM cgr.dev/chainguard/node:latest-dev AS builder
WORKDIR /app
ENV NODE_ENV=production
USER root
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV SKIP_ENV_VALIDATION=true
RUN npm run build

# ================================
# 3. Production Runtime
# ================================
# Use Chainguard for hardened security with proper Node.js support
FROM cgr.dev/chainguard/node:latest

WORKDIR /app

# Standard Production Environment
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Set API URL via build arg (Railway/compose will override)
ARG NEXT_PUBLIC_API_URL=http://backend:3001/api/v1
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Copy dependencies from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy standalone build output (contains required Next.js runtime)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./

EXPOSE 3000

# Run as root to ensure proper binary access in Chainguard
USER root
CMD node server.js
