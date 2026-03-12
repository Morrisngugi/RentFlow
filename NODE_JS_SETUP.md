# Node.js Backend Setup Guide

Complete step-by-step guide for setting up the RentFlow Express.js backend with TypeORM, PostgreSQL, and JWT authentication.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Initial Setup](#initial-setup)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [TypeORM Configuration](#typeorm-configuration)
7. [Express Server](#express-server)
8. [Authentication System](#authentication-system)
9. [First Endpoints](#first-endpoints)
10. [Testing & Validation](#testing--validation)
11. [Error Handling](#error-handling)
12. [Deployment Checklist](#deployment-checklist)

---

## Prerequisites

### Required

- **Node.js** 18.x or higher
- **npm** 9.x or higher (comes with Node.js)
- **Docker** (for PostgreSQL)
- **PostgreSQL** client tools (optional, for CLI access)
- **Git** (for version control)
- **VS Code** (recommended editor)

### Verify Installation

```bash
node --version      # Should be v18+
npm --version       # Should be v9+
docker --version    # Should show Docker version
```

---

## Project Structure

### Backend Folder Layout

```
backend/
├── src/
│   ├── entities/              # TypeORM entities
│   │   ├── User.ts
│   │   ├── TenantProfile.ts
│   │   ├── AgentProfile.ts
│   │   ├── LandlordProfile.ts
│   │   ├── Property.ts
│   │   ├── PropertyImage.ts
│   │   ├── Lease.ts
│   │   ├── LeaseTerm.ts
│   │   ├── LeaseRenewal.ts
│   │   ├── Payment.ts
│   │   ├── RentSchedule.ts
│   │   ├── Deposit.ts
│   │   ├── LateFee.ts
│   │   ├── Complaint.ts
│   │   ├── ComplaintAttachment.ts
│   │   ├── Notification.ts
│   │   ├── NotificationPreference.ts
│   │   └── AgentLandlordAssignment.ts
│   │
│   ├── migrations/            # Database migrations (auto-generated)
│   │   ├── 1234567890-InitialSchema.ts
│   │   └── ...
│   │
│   ├── routes/                # API endpoint handlers
│   │   ├── auth.routes.ts
│   │   ├── users.routes.ts
│   │   ├── properties.routes.ts
│   │   ├── leases.routes.ts
│   │   ├── payments.routes.ts
│   │   ├── complaints.routes.ts
│   │   └── index.ts           # Route aggregator
│   │
│   ├── services/              # Business logic
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── property.service.ts
│   │   ├── lease.service.ts
│   │   ├── payment.service.ts
│   │   └── notification.service.ts
│   │
│   ├── middleware/            # Custom middleware
│   │   ├── auth.middleware.ts
│   │   ├── errorHandler.ts
│   │   ├── logger.ts
│   │   └── validation.ts
│   │
│   ├── utils/                 # Utility functions
│   │   ├── database.ts        # DB connection setup
│   │   ├── jwt.ts             # JWT helpers
│   │   ├── validators.ts      # Input validation
│   │   ├── cloudinary.ts      # File upload config
│   │   └── errorResponse.ts   # Error formatting
│   │
│   ├── types/                 # TypeScript types
│   │   ├── index.ts
│   │   └── jwt.ts
│   │
│   ├── config/                # Configuration files
│   │   ├── database.ts        # TypeORM config
│   │   └── env.ts             # Environment variables
│   │
│   └── app.ts                 # Express app setup
│   └── server.ts              # Server entry point
│
├── logs/                      # Application logs
│
├── dist/                      # Compiled JavaScript (generated)
│
├── .env.example               # Environment template
├── .env                       # Actual environment (not in git)
├── .env.test                  # Test environment
│
├── package.json               # Dependencies & scripts
├── tsconfig.json              # TypeScript config
├── docker-compose.yml         # Local PostgreSQL setup
├── Dockerfile                 # Production container
│
└── README.md                  # Backend-specific docs

```

---

## Initial Setup

### Step 1: Create Backend Folder

```bash
mkdir backend
cd backend
```

### Step 2: Initialize Node.js Project

```bash
npm init -y
```

This creates a `package.json` file. Update it to include the project metadata:

```json
{
  "name": "@rentflow/backend",
  "version": "1.0.0",
  "description": "RentFlow rent management backend",
  "main": "dist/server.js",
  "scripts": {
    "dev": "ts-node-dev --respawn src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "typeorm": "typeorm-ts-node-esm",
    "migration:generate": "npm run typeorm migration:generate -- -d ./src/config/database.ts",
    "migration:run": "npm run typeorm migration:run -- -d ./src/config/database.ts",
    "migration:revert": "npm run typeorm migration:revert -- -d ./src/config/database.ts",
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "lint": "eslint src --ext .ts",
    "format": "prettier --write 'src/**/*.ts'",
    "type-check": "tsc --noEmit"
  },
  "keywords": ["rent", "management", "typescript", "express"],
  "author": "Your Team",
  "license": "MIT",
  "dependencies": {},
  "devDependencies": {}
}
```

### Step 3: Install Core Dependencies

```bash
npm install express
npm install typeorm reflect-metadata
npm install pg
npm install jsonwebtoken bcryptjs
npm install dotenv cors helmet
npm install axios
npm install class-validator class-transformer

# Optional: Database management
npm install cloudinary
npm install nodemailer
```

### Step 4: Install Dev Dependencies

```bash
npm install --save-dev typescript
npm install --save-dev @types/express @types/node
npm install --save-dev @types/jsonwebtoken @types/bcryptjs
npm install --save-dev ts-node ts-node-dev
npm install --save-dev eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser
npm install --save-dev prettier
npm install --save-dev jest @types/jest ts-jest
npm install --save-dev nodemon
```

### Step 5: Initialize TypeScript

```bash
npx tsc --init
```

Update `tsconfig.json`:

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
  "exclude": ["node_modules", "dist"]
}
```

---

## Environment Configuration

### Step 1: Create .env.example

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
JWT_SECRET=your_super_secret_jwt_key_that_is_very_long_and_random_change_this_in_production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_token_secret_key
JWT_REFRESH_EXPIRES_IN=30d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM_NAME=RentFlow
SMTP_FROM_EMAIL=noreply@rentflow.ke

# Stripe (Optional)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# App
APP_URL=http://localhost:3000
APP_FRONTEND_URL=http://localhost:3001
APP_MOBILE_BASE_URL=http://192.168.x.x:3000

# Logging
LOG_LEVEL=debug
```

### Step 2: Create .env

Copy .env.example to .env and fill in actual values:

```bash
cp .env.example .env
```

**Important**: Never commit `.env` to git. It's already in `.gitignore`.

---

## Database Setup

### Step 1: Docker Compose for PostgreSQL

Create `backend/docker-compose.yml`:

```yaml
version: '3.9'

services:
  db:
    image: postgres:14-alpine
    container_name: rentflow_db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres_password_123
      POSTGRES_DB: rentflow
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - rentflow_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: rentflow_pgadmin
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

### Step 2: Start PostgreSQL

```bash
# Start database and pgAdmin
docker-compose up -d

# Verify containers are running
docker-compose ps

# Check logs
docker-compose logs -f db

# Stop database
docker-compose down

# Reset database (warning: deletes all data)
docker-compose down -v
```

### Step 3: Access Database

**Via CLI:**
```bash
docker-compose exec db psql -U postgres -d rentflow
```

**Via pgAdmin Web Interface:**
- URL: http://localhost:5050
- Email: admin@rentflow.ke
- Password: admin123
- Server: db (hostname), Port: 5432, User: postgres, Password: postgres_password_123

---

## TypeORM Configuration

### Step 1: Create Database Config

Create `backend/src/config/database.ts`:

```typescript
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const AppDataSource = new DataSource({
  // Database type and connection settings
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres_password_123',
  database: process.env.DB_NAME || 'rentflow',
  
  // TypeScript/Entity settings
  entities: [path.join(__dirname, '../entities/**/*.ts')],
  migrations: [path.join(__dirname, '../migrations/**/*.ts')],
  subscribers: [path.join(__dirname, '../subscribers/**/*.ts')],
  
  // Behavior settings
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  logging: process.env.DB_LOGGING === 'true',
  logger: 'advanced-console',
  
  // Migration settings
  migrationsRun: process.env.DB_MIGRATIONS_RUN === 'true',
  
  // Connection pool
  pool: {
    max: 10,
    min: 2,
  },
  
  // SSL (for production)
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export default AppDataSource;
```

### Step 2: Create Environment Config

Create `backend/src/config/env.ts`:

```typescript
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
  // Server
  node_env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000'),
  
  // Database
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'rentflow',
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your_secret_key_here',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your_refresh_secret_key_here',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  
  // Cloudinary
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
  
  // Email
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    fromName: process.env.SMTP_FROM_NAME || 'RentFlow',
    fromEmail: process.env.SMTP_FROM_EMAIL || 'noreply@rentflow.ke',
  },
  
  // URLs
  urls: {
    appUrl: process.env.APP_URL || 'http://localhost:3000',
    frontendUrl: process.env.APP_FRONTEND_URL || 'http://localhost:3001',
    mobileBaseUrl: process.env.APP_MOBILE_BASE_URL || 'http://192.168.1.1:3000',
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
  },
};

export default config;
```

---

## Express Server

### Step 1: Create Express App

Create `backend/src/app.ts`:

```typescript
import 'reflect-metadata';
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from '@config/env';
import routes from '@routes/index';
import errorHandler from '@middleware/errorHandler';
import logger from '@middleware/logger';

const app: Application = express();

// Middleware - Security
app.use(helmet());

// Middleware - CORS
app.use(
  cors({
    origin: [config.urls.frontendUrl, config.urls.mobileBaseUrl],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Middleware - Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Middleware - Logging
app.use(logger);

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Catch 404
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method,
  });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
```

### Step 2: Create Server Entry Point

Create `backend/src/server.ts`:

```typescript
import 'reflect-metadata';
import app from './app';
import AppDataSource from '@config/database';
import { config } from '@config/env';

const PORT = config.port;

// Initialize database and start server
AppDataSource.initialize()
  .then(() => {
    console.log('✅ Database connected successfully');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📚 API docs available at http://localhost:${PORT}/api/docs`);
      console.log(`🏥 Health check at http://localhost:${PORT}/health`);
    });
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  });

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏹️ Shutting down gracefully...');
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  process.exit(0);
});
```

---

## Authentication System

### Step 1: Create JWT Utilities

Create `backend/src/utils/jwt.ts`:

```typescript
import jwt from 'jsonwebtoken';
import { config } from '@config/env';

export interface JWTPayload {
  id: string;
  email: string;
  role: 'TENANT' | 'AGENT' | 'LANDLORD' | 'ADMIN';
  iat?: number;
  exp?: number;
}

export const generateAccessToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

export const generateRefreshToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>) => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
};

export const verifyAccessToken = (token: string): JWTPayload => {
  return jwt.verify(token, config.jwt.secret) as JWTPayload;
};

export const verifyRefreshToken = (token: string): JWTPayload => {
  return jwt.verify(token, config.jwt.refreshSecret) as JWTPayload;
};

export const decodeToken = (token: string): JWTPayload | null => {
  return jwt.decode(token) as JWTPayload | null;
};
```

### Step 2: Create Password Utilities

Create `backend/src/utils/password.ts`:

```typescript
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

export const isValidPassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(password);
};
```

### Step 3: Create Auth Middleware

Create `backend/src/middleware/auth.middleware.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JWTPayload } from '@utils/jwt';
import { sendErrorResponse } from '@utils/errorResponse';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendErrorResponse(res, 401, 'No authorization token provided');
    }

    const token = authHeader.substring(7);

    const payload = verifyAccessToken(token);
    req.user = payload;

    next();
  } catch (error) {
    if (error instanceof Error && error.message === 'jwt expired') {
      return sendErrorResponse(res, 401, 'Token expired');
    }
    return sendErrorResponse(res, 401, 'Invalid token');
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendErrorResponse(res, 401, 'User not authenticated');
    }

    if (!roles.includes(req.user.role)) {
      return sendErrorResponse(res, 403, 'Insufficient permissions');
    }

    next();
  };
};
```

---

## First Endpoints

### Step 1: Create Auth Routes

Create `backend/src/routes/auth.routes.ts`:

```typescript
import { Router, Request, Response } from 'express';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { authenticate } from '@middleware/auth.middleware';
import AuthService from '@services/auth.service';
import { RegisterDTO, LoginDTO } from '@types/index';
import { sendErrorResponse, sendSuccessResponse } from '@utils/errorResponse';

const router = Router();
const authService = new AuthService();

// Register endpoint
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, role, firstName, lastName } = req.body;

    // Validate input
    const registerDto = plainToClass(RegisterDTO, {
      email,
      password,
      role,
      firstName,
      lastName,
    });

    const errors = await validate(registerDto);
    if (errors.length > 0) {
      return sendErrorResponse(res, 400, 'Validation failed', errors);
    }

    // Register user
    const result = await authService.register(registerDto);

    return sendSuccessResponse(res, 201, 'User registered successfully', result);
  } catch (error) {
    if (error instanceof Error && error.message.includes('unique')) {
      return sendErrorResponse(res, 409, 'Email already registered');
    }
    console.error('Registration error:', error);
    return sendErrorResponse(res, 500, 'Registration failed');
  }
});

// Login endpoint
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate input
    const loginDto = plainToClass(LoginDTO, { email, password });
    const errors = await validate(loginDto);
    if (errors.length > 0) {
      return sendErrorResponse(res, 400, 'Validation failed', errors);
    }

    // Authenticate user
    const result = await authService.login(loginDto);

    return sendSuccessResponse(res, 200, 'Login successful', result);
  } catch (error) {
    if (error instanceof Error && error.message === 'Invalid credentials') {
      return sendErrorResponse(res, 401, 'Invalid email or password');
    }
    console.error('Login error:', error);
    return sendErrorResponse(res, 500, 'Login failed');
  }
});

// Refresh token endpoint
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return sendErrorResponse(res, 400, 'Refresh token required');
    }

    const result = await authService.refreshToken(refreshToken);

    return sendSuccessResponse(res, 200, 'Token refreshed', result);
  } catch (error) {
    console.error('Refresh error:', error);
    return sendErrorResponse(res, 401, 'Invalid refresh token');
  }
});

// Logout endpoint (optional - mainly for cleanup)
router.post('/logout', authenticate, (req: Request, res: Response) => {
  // Invalidate token (optional implementation with token blacklist)
  return sendSuccessResponse(res, 200, 'Logged out successfully');
});

export default router;
```

### Step 2: Create Route Aggregator

Create `backend/src/routes/index.ts`:

```typescript
import { Router } from 'express';
import authRoutes from './auth.routes';

const router = Router();

// Version prefix
router.use('/v1/auth', authRoutes);
// More routes will be added here
// router.use('/v1/users', userRoutes);
// router.use('/v1/properties', propertyRoutes);
// etc.

export default router;
```

### Step 3: Create Error Response Utility

Create `backend/src/utils/errorResponse.ts`:

```typescript
import { Response } from 'express';

export interface APIResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  errors?: any[];
}

export const sendSuccessResponse = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T
): Response => {
  return res.status(statusCode).json({
    success: true,
    statusCode,
    message,
    data,
  } as APIResponse<T>);
};

export const sendErrorResponse = (
  res: Response,
  statusCode: number,
  message: string,
  errors?: any[]
): Response => {
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors,
  } as APIResponse);
};
```

---

## Testing & Validation

### Step 1: Test Registration

```bash
# Start the dev server
npm run dev

# In another terminal, test registration
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tenant@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe",
    "role": "TENANT"
  }'

# Expected response:
{
  "success": true,
  "statusCode": 201,
  "message": "User registered successfully",
  "data": {
    "id": "uuid-here",
    "email": "tenant@example.com",
    "accessToken": "jwt-token-here",
    "refreshToken": "refresh-jwt-here",
    "user": {
      "id": "uuid-here",
      "email": "tenant@example.com",
      "role": "TENANT",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

### Step 2: Test Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tenant@example.com",
    "password": "SecurePass123!"
  }'
```

### Step 3: Test Protected Route (with token)

```bash
# Get token from login response, then test protected endpoint
curl -X GET http://localhost:3000/api/v1/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### Step 4: Automated Tests

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
};
```

Create `backend/src/__tests__/auth.test.ts`:

```typescript
import AuthService from '@services/auth.service';
import { comparePassword } from '@utils/password';

describe('Auth Service', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  test('should hash password', async () => {
    const password = 'TestPassword123!';
    // Add test implementation
  });

  test('should validate password', async () => {
    // Add test implementation
  });
});
```

Run tests:
```bash
npm run test
npm run test:watch
```

---

## Error Handling

### Custom Error Handler

Create `backend/src/middleware/errorHandler.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { sendErrorResponse } from '@utils/errorResponse';

class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal server error';

  // Wrong MongoDB ID
  if (err.name === 'CastError') {
    const message = `Resource not found: Invalid ${err.path}`;
    return sendErrorResponse(res, 400, message);
  }

  // Duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    return sendErrorResponse(res, 409, message);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendErrorResponse(res, 401, 'Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    return sendErrorResponse(res, 401, 'Token expired');
  }

  // Default error
  return sendErrorResponse(res, err.statusCode, err.message);
};

export { AppError, errorHandler };
export default errorHandler;
```

---

## Deployment Checklist

### Pre-Production

- [ ] All environment variables configured in `.env`
- [ ] Database migrations tested and verified
- [ ] SSL certificates acquired (for HTTPS)
- [ ] API documentation generated
- [ ] Unit tests written and passing (80%+ coverage)
- [ ] Security headers configured (helmet.js)
- [ ] CORS properly restricted to known domains
- [ ] Input validation on all endpoints
- [ ] Error handling comprehensive
- [ ] Logging configured
- [ ] Rate limiting implemented

### Docker Build

```bash
# Build image
docker build -t rentflow-backend:1.0.0 .

# Test locally
docker run -e NODE_ENV=production -p 3000:3000 rentflow-backend:1.0.0

# Tag for registry
docker tag rentflow-backend:1.0.0 your-registry/rentflow-backend:1.0.0

# Push to registry
docker push your-registry/rentflow-backend:1.0.0
```

### Production Environment

```env
NODE_ENV=production
PORT=3000
DB_HOST=db.railway.app
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=secure_password_here
DB_NAME=rentflow
JWT_SECRET=very_long_random_secret_here_change_in_production
# ... other production credentials
```

---

## Common Issues & Solutions

### "Cannot find module" errors

```bash
# Clear cache and reinstall
rm -rf node_modules dist
npm install
npm run build
```

### Database connection timeout

```bash
# Verify PostgreSQL is running
docker-compose ps

# Check connection string in .env
DB_HOST=localhost  # Use localhost for Docker Compose
DB_PORT=5432
```

### TypeORM migration issues

```bash
# Regenerate migrations
npm run migration:generate -- -n YourMigrationName

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

### Port already in use

```bash
# Change PORT in .env or kill process
# macOS/Linux:
lsof -i :3000
kill -9 <PID>

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## Next Steps

1. ✅ Backend server is running
2. ⏭️ Create database entities (from TYPEORM_ENTITIES.md)
3. ⏭️ Generate migrations: `npm run migration:generate -n InitialSchema`
4. ⏭️ Run migrations: `npm run migration:run`
5. ⏭️ Implement Auth Service with database
6. ⏭️ Create User Service and endpoints
7. ⏭️ Build Property CRUD endpoints
8. ⏭️ Implement Lease management
9. ⏭️ Build Payment tracking system

---

## Resources

- **Express.js Documentation**: https://expressjs.com/
- **TypeORM Documentation**: https://typeorm.io/
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/
- **JWT.io**: https://jwt.io/
- **Docker Documentation**: https://docs.docker.com/

---

## Troubleshooting

For detailed troubleshooting, refer to [DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md#troubleshooting) in the root documentation.

Questions? Check the main [README.md](./README.md) or open an issue on GitHub.
