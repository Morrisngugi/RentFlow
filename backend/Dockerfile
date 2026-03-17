# Build stage - using Chainguard's hardened Node image
FROM cgr.dev/chainguard/node:latest-dev AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
USER root
RUN npm install --no-audit

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# ============= PRODUCTION DEPENDENCIES =============
FROM cgr.dev/chainguard/node:latest-dev AS prod-deps

WORKDIR /app

# Copy dependencies
COPY package*.json ./
# Remove lock file to avoid permission issues with non-root user
RUN rm -f package-lock.json npm-shrinkwrap.json
RUN npm install --omit=dev --no-audit

# ============= RUNTIME IMAGE =============
# Use Chainguard Node for a secure runtime with node available
FROM cgr.dev/chainguard/node:latest

ENV NODE_ENV=production

WORKDIR /app

# Copy production dependencies
COPY --from=prod-deps --chown=nonroot:nonroot /app/node_modules ./node_modules/
COPY --from=prod-deps --chown=nonroot:nonroot /app/package*.json ./

# Copy built application
COPY --from=builder --chown=nonroot:nonroot /app/dist ./dist/

# Expose port
EXPOSE 3001

# Start application
CMD ["dist/server.js"]
