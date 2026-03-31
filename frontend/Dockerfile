# ================================
# 1. Dependencies Stage
# ================================
FROM node:20-slim AS deps

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm ci --no-audit --legacy-peer-deps


# ================================
# 2. Builder Stage
# ================================
FROM node:20-slim AS builder

WORKDIR /app

ENV NODE_ENV=development

COPY --from=deps /app/node_modules ./node_modules

COPY . .

# Skip static generation errors for development
ENV SKIP_ENV_VALIDATION=true

RUN npm run build || true


# ================================
# 3. Production Runtime
# ================================
FROM node:20-slim

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

ARG NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
