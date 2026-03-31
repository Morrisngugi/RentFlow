# ============= BUILD STAGE =============
FROM cgr.dev/chainguard/node:latest-dev AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
USER root
RUN npm install --legacy-peer-deps && \
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
COPY --from=builder --chown=nonroot:nonroot /app/.next/standalone /app
COPY --from=builder --chown=nonroot:nonroot /app/.next/static /app/.next/static
COPY --from=builder --chown=nonroot:nonroot /app/public /app/public

# Expose port
EXPOSE 3000

# Start Next.js server
CMD ["node", "/app/server.js"]
