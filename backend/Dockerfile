# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

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
