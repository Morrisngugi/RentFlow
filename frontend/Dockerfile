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
RUN npm ci --no-audit --ignore-scripts --legacy-peer-deps

# Copy source code
COPY . .

# Build Next.js application
RUN npm run build

# ============= RUNTIME IMAGE =============
FROM gcr.io/distroless/nodejs20-debian12:nonroot

ARG NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

RUN echo "Building with NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}"

# Copy from standalone build output - all files needed for Next.js runtime
# The standalone folder contains: server.js, package.json, node_modules structure
COPY --from=builder /app/.next/standalone /app/
COPY --from=builder /app/.next/static /app/.next/static
COPY --from=builder /app/public /app/public

# Expose port
EXPOSE 3000

# Run the Next.js standalone server
CMD ["node", "--enable-source-maps", "server.js"]
