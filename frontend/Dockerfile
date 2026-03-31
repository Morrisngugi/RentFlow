# ============= BUILD STAGE =============
# Build stage - Install dependencies and build Next.js app
# Using specific version to bypass cache
FROM cgr.dev/chainguard/node:20-dev AS builder

ARG CACHE_BUST=1
ENV CACHE_BUST=${CACHE_BUST}

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
FROM cgr.dev/chainguard/node:20

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Copy from standalone build output - all files needed for Next.js runtime
# The standalone folder contains: server.js, package.json, node_modules structure
COPY --from=builder --chown=nonroot:nonroot /app/.next/standalone /app/
COPY --from=builder --chown=nonroot:nonroot /app/.next/static /app/.next/static
COPY --from=builder --chown=nonroot:nonroot /app/public /app/public

# Expose port
EXPOSE 3000

# Run the Next.js standalone server
CMD ["node", "--enable-source-maps", "server.js"]
