# ================================
# 1. Dependencies Stage
# ================================
FROM cgr.dev/chainguard/node:latest-dev AS deps

WORKDIR /app

COPY package.json package-lock.json* ./

USER root
RUN npm ci --no-audit --legacy-peer-deps


# ================================
# 2. Builder Stage
# ================================
FROM cgr.dev/chainguard/node:latest-dev AS builder

WORKDIR /app

ENV NODE_ENV=development

COPY --from=deps /app/node_modules ./node_modules

COPY . .

# Skip static generation errors for development
ENV SKIP_ENV_VALIDATION=true

RUN npm run build


# ================================
# 3. Production Dependencies Stage
# ================================
FROM cgr.dev/chainguard/node:latest-dev AS prod-deps

WORKDIR /app

COPY package.json package-lock.json* ./

# Remove lock file to avoid permission issues with non-root user
RUN rm -f package-lock.json npm-shrinkwrap.json
USER root
RUN npm install --omit=dev --no-audit


# ================================
# 4. Production Runtime
# ================================
FROM cgr.dev/chainguard/node:latest

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Set API URL via build arg, allow override via environment variable at runtime
ARG NEXT_PUBLIC_API_URL=http://backend:3001/api/v1
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

COPY --from=prod-deps --chown=nonroot:nonroot /app/node_modules ./node_modules/
COPY --from=prod-deps --chown=nonroot:nonroot /app/package*.json ./

# Copy standalone build output directly to /app
COPY --from=builder --chown=nonroot:nonroot /app/.next/standalone/ ./
# Copy static assets into the correct location
COPY --from=builder --chown=nonroot:nonroot /app/.next/static ./.next/static
COPY --from=builder --chown=nonroot:nonroot /app/public ./public

EXPOSE 3000

# Set USER before CMD to ensure non-root execution
USER nonroot

CMD ["node", "server.js"]
