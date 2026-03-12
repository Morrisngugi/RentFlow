# ============= BUILD STAGE =============
# Build from Chainguard's hardened Node image
FROM cgr.dev/chainguard/node:latest-dev AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --no-audit

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# ============= PRODUCTION DEPENDENCIES =============
FROM cgr.dev/chainguard/node:latest-dev AS prod-deps

WORKDIR /app

# Copy dependencies
COPY package*.json ./
RUN npm ci --omit=dev --no-audit

# ============= RUNTIME IMAGE =============
# Use distroless for zero vulnerabilities - nonroot user built-in
FROM gcr.io/distroless/nodejs20-debian12:nonroot

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
