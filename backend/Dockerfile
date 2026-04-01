# Unified Dockerfile for Development and Production
# Use build argument ENVIRONMENT to switch between dev and prod modes
# Default: production
ARG ENVIRONMENT=production

# ============= BUILD STAGE =============
FROM cgr.dev/chainguard/node:latest-dev AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (needed for TypeScript compilation)
USER root
RUN npm install --no-audit

# Copy source code and config
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript to dist/
RUN npm run build

# ============= PRODUCTION DEPENDENCIES STAGE =============
FROM cgr.dev/chainguard/node:latest-dev AS prod-deps

WORKDIR /app

COPY package*.json ./
RUN rm -f package-lock.json npm-shrinkwrap.json
RUN npm install --omit=dev --no-audit

# ============= DEVELOPMENT RUNTIME =============
FROM cgr.dev/chainguard/node:latest-dev AS runtime-dev

ENV NODE_ENV=development

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY tsconfig.json ./
COPY src ./src

EXPOSE 3001

USER root
CMD ["/usr/bin/npm", "run", "dev"]

# ============= PRODUCTION RUNTIME =============
FROM cgr.dev/chainguard/node:latest AS runtime-prod

ENV NODE_ENV=production

WORKDIR /app

# Copy production dependencies with correct UID
COPY --from=prod-deps --chown=65532:65532 /app/node_modules ./node_modules/
COPY --from=prod-deps --chown=65532:65532 /app/package*.json ./

# Copy built application
COPY --from=builder --chown=65532:65532 /app/dist ./dist/

# Use Chainguard's standard non-root user
USER 65532

EXPOSE 3001

CMD ["/usr/bin/node", "dist/server.js"]

# ============= FINAL STAGE (CONDITIONAL) =============
FROM runtime-${ENVIRONMENT}

# This final stage selects either runtime-dev or runtime-prod based on ENVIRONMENT build arg
