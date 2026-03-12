# Backend Folder Structure & Setup Guide

Quick reference for creating the complete backend folder structure with all necessary files for Express + TypeORM development.

---

## Overview

This guide shows how to reorganize the monorepo from the current Turborepo structure to support a dedicated `backend` folder alongside the existing `apps/web` and `apps/mobile` (Expo) folders.

---

## Current Structure (Before)

```
RentFlow/
├── apps/
│   ├── mobile/          # Expo (to be replaced with Android)
│   ├── web/             # React.js + Vite (to migrate to Next.js)
├── packages/
│   └── shared/          # Shared types
└── package.json
```

## Target Structure (After)

```
RentFlow/
├── backend/             # NEW: Node.js + Express + TypeORM
│   ├── src/
│   │   ├── entities/
│   │   ├── migrations/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── utils/
│   │   ├── types/
│   │   ├── config/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── dist/
│   ├── .env
│   ├── .env.example
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── package.json
│   ├── tsconfig.json
│   ├── jest.config.js
│   └── README.md
│
├── apps/
│   ├── android/          # NEW: Android with Kotlin + Jetpack Compose
│   │   ├── app/src/
│   │   ├── build.gradle.kts
│   │   └── ...
│   ├── mobile/           # Existing: Expo React Native (legacy)
│   ├── web/              # Existing: React.js + Vite (to migrate)
│   └── ...
│
├── packages/
│   └── shared/           # Shared TypeScript types
│
├── .gitignore
├── pnpm-workspace.yaml
├── turbo.json
├── package.json
└── README.md
```

---

## Step-by-Step Setup

### Step 1: Create Backend Folder Structure

```bash
cd /path/to/RentFlow

# Create backend folder structure
mkdir -p backend/{src/{entities,migrations,routes,services,middleware,utils,types,config},dist,logs}

# Create placeholder files
touch backend/src/app.ts
touch backend/src/server.ts
touch backend/src/config/database.ts
touch backend/src/config/env.ts
touch backend/src/utils/jwt.ts
touch backend/src/utils/password.ts
touch backend/src/utils/errorResponse.ts
touch backend/src/middleware/auth.middleware.ts
touch backend/src/middleware/errorHandler.ts
touch backend/src/middleware/logger.ts
touch backend/src/routes/index.ts
touch backend/src/routes/auth.routes.ts
touch backend/src/types/index.ts
touch backend/src/types/jwt.ts
```

### Step 2: Create Backend package.json

Create `backend/package.json`:

```json
{
  "name": "@rentflow/backend",
  "version": "1.0.0",
  "description": "RentFlow rent management backend API",
  "main": "dist/server.js",
  "type": "commonjs",
  "scripts": {
    "dev": "ts-node-dev --respawn src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "typeorm": "typeorm-ts-node-esm",
    "migration:generate": "npm run typeorm migration:generate -- -d ./src/config/database.ts",
    "migration:run": "npm run typeorm migration:run -- -d ./src/config/database.ts",
    "migration:revert": "npm run typeorm migration:revert -- -d ./src/config/database.ts",
    "migration:show": "npm run typeorm migration:show -- -d ./src/config/database.ts",
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "test:e2e": "jest --config jest.e2e.config.js",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "format": "prettier --write 'src/**/*.ts'",
    "format:check": "prettier --check 'src/**/*.ts'",
    "type-check": "tsc --noEmit",
    "seed": "ts-node src/seed.ts",
    "docker:build": "docker build -t rentflow-backend .",
    "docker:run": "docker run -p 3000:3000 --env-file .env rentflow-backend"
  },
  "keywords": ["rent", "management", "typescript", "express", "typeorm"],
  "author": "RentFlow Team",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "typeorm": "^0.3.16",
    "reflect-metadata": "^0.1.13",
    "pg": "^8.10.0",
    "jsonwebtoken": "^9.1.0",
    "bcryptjs": "^2.4.3",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "axios": "^1.5.0",
    "nodemailer": "^6.9.4",
    "cloudinary": "^1.40.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.17",
    "@types/node": "^20.4.5",
    "@types/jsonwebtoken": "^9.0.2",
    "@types/bcryptjs": "^2.4.2",
    "@types/nodemailer": "^6.4.9",
    "@types/jest": "^29.5.3",
    "typescript": "^5.1.6",
    "ts-node": "^10.9.1",
    "ts-node-dev": "^2.0.0",
    "jest": "^29.6.2",
    "ts-jest": "^29.1.1",
    "@typescript-eslint/eslint-plugin": "^6.2.1",
    "@typescript-eslint/parser": "^6.2.1",
    "eslint": "^8.46.0",
    "prettier": "^3.0.0",
    "nodemon": "^3.0.1"
  }
}
```

### Step 3: Create Backend tsconfig.json

Create `backend/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "baseUrl": ".",
    "paths": {
      "@entities/*": ["src/entities/*"],
      "@routes/*": ["src/routes/*"],
      "@services/*": ["src/services/*"],
      "@middleware/*": ["src/middleware/*"],
      "@utils/*": ["src/utils/*"],
      "@types/*": ["src/types/*"],
      "@config/*": ["src/config/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### Step 4: Update Root pnpm-workspace.yaml

Edit `pnpm-workspace.yaml`:

```yaml
packages:
  - 'backend'
  - 'apps/*'
  - 'packages/*'
```

### Step 5: Update Root turbo.json

Edit `turbo.json`:

```json
{
  "globalEnv": ["NODE_ENV"],
  "pipeline": {
    "build": {
      "outputs": ["dist/**"],
      "cache": false
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "outputs": ["coverage/**"],
      "cache": false
    },
    "lint": {
      "outputs": [],
      "cache": true
    }
  }
}
```

### Step 6: Create Backend .env Files

Create `backend/.env.example`:

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres_password_123
DB_NAME=rentflow
DB_SYNCHRONIZE=false
DB_LOGGING=true
DB_MIGRATIONS_RUN=true

# JWT
JWT_SECRET=your_super_secret_jwt_key_that_is_very_long_and_random
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_token_secret_key
JWT_REFRESH_EXPIRES_IN=30d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM_NAME=RentFlow
SMTP_FROM_EMAIL=noreply@rentflow.ke

# URLs
APP_URL=http://localhost:3000
APP_FRONTEND_URL=http://localhost:3001
APP_MOBILE_BASE_URL=http://192.168.x.x:3000
```

Create `backend/.env` by copying from .env.example and filling in values.

### Step 7: Create Backend Docker Files

Create `backend/Dockerfile`:

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
RUN apk add --no-cache dumb-init
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 && chown -R nodejs:nodejs /app
USER nodejs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
```

Create `backend/.dockerignore`:

```
node_modules
dist
.env
.env.local
*.log
logs
coverage
.git
.gitignore
README.md
.DS_Store
.vscode
.idea
```

Create `backend/docker-compose.yml`:

```yaml
version: '3.9'

services:
  db:
    image: postgres:14-alpine
    container_name: rentflow_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USERNAME:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres_password_123}
      POSTGRES_DB: ${DB_NAME:-rentflow}
    ports:
      - "${DB_PORT:-5432}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - rentflow_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USERNAME:-postgres}"]
      interval: 10s
      timeout: 5s
      retries: 5

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: rentflow_pgadmin
    restart: unless-stopped
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@rentflow.ke
      PGADMIN_DEFAULT_PASSWORD: admin123
    ports:
      - "5050:80"
    networks:
      - rentflow_network
    depends_on:
      - db

volumes:
  postgres_data:

networks:
  rentflow_network:
    driver: bridge
```

### Step 8: Create Backend Configuration Files

Create `backend/.eslintrc.json`:

```json
{
  "parser": "@typescript-eslint/parser",
  "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module"
  },
  "env": {
    "node": true,
    "es2020": true
  },
  "rules": {
    "no-console": 1,
    "@typescript-eslint/explicit-function-return-types": 1,
    "@typescript-eslint/no-explicit-any": 1
  }
}
```

Create `backend/.prettierrc`:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

Create `backend/jest.config.js`:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  moduleNameMapper: {
    '@entities/(.*)': '<rootDir>/src/entities/$1',
    '@routes/(.*)': '<rootDir>/src/routes/$1',
    '@services/(.*)': '<rootDir>/src/services/$1',
    '@middleware/(.*)': '<rootDir>/src/middleware/$1',
    '@utils/(.*)': '<rootDir>/src/utils/$1',
    '@types/(.*)': '<rootDir>/src/types/$1',
    '@config/(.*)': '<rootDir>/src/config/$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts',
    '!src/app.ts',
  ],
  coverageThreshold: {
    global: {
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
  },
};
```

### Step 9: Create Backend README

Create `backend/README.md`:

```markdown
# RentFlow Backend

Node.js + Express.js REST API for the RentFlow rent management system.

## Overview

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL + TypeORM
- **Authentication**: JWT + bcrypt

## Quick Start

\`\`\`bash
# Install dependencies
npm install

# Start database
docker-compose up -d

# Run migrations
npm run migration:run

# Start development server
npm run dev
\`\`\`

Server will run on \`http://localhost:3000\`

## Documentation

- [NODE_JS_SETUP.md](../NODE_JS_SETUP.md) - Complete setup guide
- [DOCKER_RAILWAY_DEPLOYMENT.md](../DOCKER_RAILWAY_DEPLOYMENT.md) - Deployment guide
- [TYPEORM_ENTITIES.md](../TYPEORM_ENTITIES.md) - Database schema

## Project Structure

See [Backend Folder Structure & Setup Guide](../BACKEND_FOLDER_STRUCTURE.md)

## Testing

\`\`\`bash
npm run test
npm run test:watch
npm run test:e2e
\`\`\`

## Building

\`\`\`bash
# Build for production
npm run build

# Start production server
npm start
\`\`\`

## Database Migrations

\`\`\`bash
# Generate migration from entities
npm run migration:generate -- -n MigrationName

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert
\`\`\`

## API Documentation

Once the server is running, visit \`http://localhost:3000/api/docs\` for Swagger documentation.
```

### Step 10: Create Android Folder (if not existing)

```bash
# If using existing Expo folder as reference:
mkdir -p android/app/src/main/{java/com/rentflow/android,res}

# Create Android build files
touch android/build.gradle.kts
touch android/settings.gradle.kts
touch android/gradle.properties
touch android/local.properties
```

### Step 11: Update Root .gitignore

Ensure `backend/` related entries are in `.gitignore`:

```
# Backend
backend/dist/
backend/node_modules/
backend/.env
backend/.env.local
backend/logs/
backend/*.log

# TypeORM
backend/src/migrations/*.ts

# Android
android/local.properties
android/build/
android/.gradle/
android/.idea/

# General
.DS_Store
.env
*.log
```

### Step 12: Install Root Dependencies

```bash
# Make sure you're in the root directory
cd /path/to/RentFlow

# Update pnpm workspace
pnpm install

# This will install dependencies for all workspace packages including new backend folder
```

### Step 13: Verify Structure

```bash
# List structure
ls -la backend/
ls -la apps/
ls -la packages/

# Verify pnpm workspace can find all packages
pnpm list -r --depth 0

# Should show:
# RentFlow
# ├── backend
# ├── apps/android (if created)
# ├── apps/mobile
# ├── apps/web
# └── packages/shared
```

---

## Commands After Setup

### Backend Development

```bash
# From root directory
cd backend
npm run dev           # Start dev server

# Or from root
pnpm --filter @rentflow/backend run dev
```

### Running All Services

```bash
# From root, start all dev servers
pnpm dev

# Includes:
# - Backend on http://localhost:3000
# - Web on http://localhost:3000 (different port)
# - Mobile Expo on http://localhost:8081
```

### Database Operations

```bash
cd backend

# Start database
docker-compose up -d

# View logs
docker-compose logs -f db

# Access database
docker-compose exec db psql -U postgres -d rentflow

# Stop database
docker-compose down
```

---

## File Locations Summary

| File/Folder | Location | Purpose |
|---|---|---|
| Backend source | `backend/src/` | All TypeScript source code |
| Entities | `backend/src/entities/` | TypeORM entity definitions |
| Migrations | `backend/src/migrations/` | Database migrations |
| API Routes | `backend/src/routes/` | Express route handlers |
| Business logic | `backend/src/services/` | Service classes |
| Custom middleware | `backend/src/middleware/` | Express middleware |
| Utilities | `backend/src/utils/` | Helper functions |
| Types | `backend/src/types/` | TypeScript type definitions |
| Config | `backend/src/config/` | Configuration files |
| Environment | `backend/.env` | Secret keys (not in git) |
| Docker | `backend/Dockerfile` | Container definition |
| Database compose | `backend/docker-compose.yml` | Local PostgreSQL setup |
| Package config | `backend/package.json` | Dependencies & scripts |

---

## Next Steps

1. ✅ Folder structure created
2. ⏭️ Run `npm install` in backend directory
3. ⏭️ Start Docker: `docker-compose up -d`
4. ⏭️ Copy TypeORM entities from TYPEORM_ENTITIES.md
5. ⏭️ Generate initial migration
6. ⏭️ Start backend server: `npm run dev`

---

For detailed backend setup, see [NODE_JS_SETUP.md](../NODE_JS_SETUP.md)

For deployment guide, see [DOCKER_RAILWAY_DEPLOYMENT.md](../DOCKER_RAILWAY_DEPLOYMENT.md)
