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
FROM cgr.dev/chainguard/node:latest
WORKDIR /app

# Standard Production Environment
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Set API URL via build arg
ARG NEXT_PUBLIC_API_URL=http://backend:3001/api/v1
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Copy standalone build output (contains required node_modules)
# Chainguard uses UID 65532 (node)
COPY --from=builder --chown=node:node /app/.next/standalone/ ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

EXPOSE 3000

# FIX: Chainguard already has /usr/bin/node as ENTRYPOINT. 
# Providing it again in CMD causes a "module not found" error.
CMD ["server.js"]
