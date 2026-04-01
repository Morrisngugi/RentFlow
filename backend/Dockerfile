# ============= BUILD STAGE =============
# Backend API Dockerfile for RentFlow
# Build from backend directory context

FROM cgr.dev/chainguard/node:latest-dev AS builder
WORKDIR /app

# Install backend dependencies
COPY package*.json ./
USER root
RUN npm ci --no-audit


# Build backend TypeScript
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ============= PRODUCTION DEPENDENCIES =============
FROM cgr.dev/chainguard/node:latest-dev AS prod-deps
WORKDIR /app

# Copy dependencies
COPY package*.json ./
RUN npm ci --omit=dev --no-audit

# Create uploads directory structure for runtime
RUN mkdir -p /app/uploads/profiles /app/uploads/payslips /app/uploads/logos /app/uploads/exports && \
    chmod -R 777 /app/uploads

# ============= RUNTIME IMAGE =============
# Use distroless with Debian for glibc compatibility - zero vulnerabilities
FROM gcr.io/distroless/nodejs20-debian12:nonroot

ENV NODE_ENV=production
WORKDIR /app

# Copy production dependencies
COPY --from=prod-deps --chown=nonroot:nonroot /app/node_modules ./node_modules/
COPY --from=prod-deps --chown=nonroot:nonroot /app/package*.json ./

# Copy built backend
COPY --from=builder --chown=nonroot:nonroot /app/dist ./dist/

# Copy uploads directory structure
COPY --from=prod-deps --chown=nonroot:nonroot /app/uploads ./uploads/

EXPOSE 3001

CMD ["dist/server.js"]
