# Build stage - using bookworm with security updates
FROM node:20-bookworm AS builder

WORKDIR /app

# Update and patch all system packages for security
RUN apt-get update && apt-get upgrade -y --no-install-recommends && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get clean

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Runtime stage - using distroless for minimal attack surface
FROM gcr.io/distroless/nodejs20-debian12

WORKDIR /app

# Copy package files from builder
COPY --from=builder /app/package*.json ./

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Non-root user already built into distroless image

# Start application
CMD ["dist/server.js"]

# Expose port
EXPOSE 3001
