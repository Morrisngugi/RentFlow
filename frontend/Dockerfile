# ============= BUILD STAGE =============
# Build stage - Install dependencies and build Next.js app
FROM cgr.dev/chainguard/node:latest-dev AS builder

ARG CACHE_BUST=1
ENV CACHE_BUST=${CACHE_BUST}

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
USER root
RUN echo "Build cache invalidation: $(date)" && \
    npm install --legacy-peer-deps && \
    npm cache clean --force

# Copy source code
COPY . .

# Build Next.js application
RUN npm run build

# ============= RUNTIME IMAGE =============
FROM cgr.dev/chainguard/node:latest

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Copy built Next.js application (standalone mode)
COPY --from=builder --chown=nonroot:nonroot /app/.next/standalone ./
COPY --from=builder --chown=nonroot:nonroot /app/.next/static /app/.next/static
COPY --from=builder --chown=nonroot:nonroot /app/public /app/public
COPY --from=builder --chown=nonroot:nonroot /app/package.json ./

# Expose port 3000
EXPOSE 3000

# Start Next.js server
CMD ["node", "server.js"]
