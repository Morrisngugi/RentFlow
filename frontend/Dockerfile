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
RUN npm ci --no-audit --ignore-scripts --legacy-peer-deps

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
# Use distroless for minimal attack surface (zero CVEs)
FROM gcr.io/distroless/nodejs20-debian12:nonroot

WORKDIR /app

# Standard Production Environment
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Set API URL via build arg (Railway/compose will override)
ARG NEXT_PUBLIC_API_URL=http://backend:3001/api/v1
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Copy dependencies from builder
COPY --from=builder --chown=nonroot:nonroot /app/node_modules ./node_modules

# Copy standalone build output (contains required Next.js runtime)
COPY --from=builder --chown=nonroot:nonroot /app/.next/standalone ./
COPY --from=builder --chown=nonroot:nonroot /app/.next/static ./.next/static
COPY --from=builder --chown=nonroot:nonroot /app/public ./public
COPY --from=builder --chown=nonroot:nonroot /app/package*.json ./

# Distroless runs as nonroot (UID 65532) by default
EXPOSE 3000

# Start the Next.js production server - direct execution (no node prefix)
CMD ["server.js"]
