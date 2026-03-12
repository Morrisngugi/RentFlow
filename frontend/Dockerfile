# ============= BUILD STAGE =============
# Build from Chainguard's hardened Node image
FROM cgr.dev/chainguard/node:latest-dev AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --no-audit --ignore-scripts --legacy-peer-deps && \
    npm cache clean --force

# Copy source code
COPY . .

# Build Next.js application with NODE_ENV=production for optimized build
RUN NODE_ENV=production npm run build

# ============= PRODUCTION DEPENDENCIES =============
FROM cgr.dev/chainguard/node:latest-dev AS prod-deps

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev --no-audit

# ============= RUNTIME IMAGE =============
# Use distroless for zero vulnerabilities - nonroot user built-in
FROM gcr.io/distroless/nodejs20-debian12:nonroot

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Copy production dependencies
COPY --from=prod-deps --chown=nonroot:nonroot /app/node_modules ./node_modules/
COPY --from=prod-deps --chown=nonroot:nonroot /app/package*.json ./

# Copy built Next.js application from builder
COPY --from=builder --chown=nonroot:nonroot /app/.next/standalone /app/
COPY --from=builder --chown=nonroot:nonroot /app/.next/static /app/.next/static
COPY --from=builder --chown=nonroot:nonroot /app/public /app/public

# Expose port
EXPOSE 3000

# Start Next.js server
CMD ["server.js"]
