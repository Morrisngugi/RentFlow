# Build stage - using Chainguard hardened builder (zero vulnerabilities)
FROM cgr.io/chainguard/node:20 AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build Next.js application
RUN npm run build

# Runtime stage - using distroless with :nonroot for minimal attack surface
FROM gcr.io/distroless/nodejs20-debian12:nonroot

WORKDIR /app

# Copy package files from builder
COPY --from=builder /app/package*.json ./

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy built Next.js application from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Set Node environment to production
ENV NODE_ENV=production

# Start Next.js application
CMD ["node_modules/.bin/next", "start", "-p", "3000"]

# Expose port
EXPOSE 3000
