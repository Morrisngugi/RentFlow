# Build stage - using official Node 20 LTS with Alpine 3.20 (stable security baseline)
ARG BUILDKIT_INLINE_CACHE=1
FROM node:20-alpine3.20 AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci && npm audit fix --force || true

# Copy source code
COPY . .

# Build Next.js application
RUN npm run build

# Remove development dependencies
RUN npm prune --production

# Runtime stage - using official Node 20 LTS with Alpine 3.20 (stable security baseline)
FROM node:20-alpine3.20 AS runtime

WORKDIR /app

# Create nonroot user for security
RUN addgroup -g 1001 nodejs && adduser -S nodejs -u 1001

# Copy package files from builder
COPY --from=builder /app/package*.json ./

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy built Next.js application from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Set Node environment to production
ENV NODE_ENV=production

# Switch to nonroot user
USER nodejs

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Start Next.js application using exec form
CMD ["node", "node_modules/.next/standalone/server.js"]

# Expose port
EXPOSE 3000
