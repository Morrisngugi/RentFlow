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
# Use distroless for zero vulnerabilities - same as WorkPay
FROM gcr.io/distroless/nodejs20-debian12:nonroot

WORKDIR /app

# Standard Production Environment
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Set API URL via build arg
ARG NEXT_PUBLIC_API_URL=http://backend:3001/api/v1
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Copy standalone build output (contains required node_modules)
# Distroless runs as nonroot:nonroot (UID 65532)
COPY --from=builder --chown=nonroot:nonroot /app/.next/standalone/ ./
COPY --from=builder --chown=nonroot:nonroot /app/.next/static ./.next/static
COPY --from=builder --chown=nonroot:nonroot /app/public ./public

EXPOSE 3000

# Distroless has /nodejs20/bin/node as ENTRYPOINT, CMD is the script
CMD ["server.js"]
