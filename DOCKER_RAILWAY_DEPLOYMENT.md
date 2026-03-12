# Docker & Railway Deployment Guide

Complete guide for containerizing the RentFlow backend with Docker and deploying to Railway platform.

---

## Table of Contents

1. [Docker Fundamentals](#docker-fundamentals)
2. [Dockerfile Setup](#dockerfile-setup)
3. [Docker Compose (Local Development)](#docker-compose-local-development)
4. [Building & Running Docker Images](#building--running-docker-images)
5. [Railway Platform Setup](#railway-platform-setup)
6. [Deploying to Railway](#deploying-to-railway)
7. [Environment Variables](#environment-variables)
8. [Monitoring & Logs](#monitoring--logs)
9. [Scaling & Performance](#scaling--performance)
10. [Troubleshooting](#troubleshooting)
11. [CI/CD with GitHub Actions](#cicd-with-github-actions)

---

## Docker Fundamentals

### What is Docker?

Docker is a containerization platform that packages your application and all its dependencies (Node.js, npm packages, configuration) into a single unit called a **container**.

**Benefits**:
- **Consistency**: Same environment across development, testing, and production
- **Isolation**: App runs independently without affecting other processes
- **Scalability**: Easy to spin up multiple instances
- **Portability**: Works on any system with Docker installed

### Key Concepts

- **Image**: Blueprint/template for a container (like a class)
- **Container**: Running instance of an image (like an object)
- **Dockerfile**: Instructions to build an image
- **Registry**: Repository to store/pull images (Docker Hub, GitHub Container Registry)

---

## Dockerfile Setup

### Step 1: Create Dockerfile

Create `backend/Dockerfile`:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install dumb-init to handle signals properly
RUN apk add --no-cache dumb-init

# Copy built app from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use dumb-init to handle signals
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/server.js"]
```

### Explanation

1. **Multi-stage build**: Reduces final image size
   - Stage 1 (builder): Compiles TypeScript, installs dependencies
   - Stage 2 (production): Only copies necessary files

2. **Alpine Linux**: Lightweight base image (~150MB vs 900MB with Node.js default)

3. **Non-root user**: Security best practice; app runs as Node.js user, not root

4. **Health check**: Docker automatically monitors container health

5. **Dumb-init**: Properly handles signals (SIGTERM) for graceful shutdown

### Step 2: Create .dockerignore

Create `backend/.dockerignore`:

```
node_modules
dist
.env
.env.local
.env.*.local
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

---

## Docker Compose (Local Development)

### Step 1: Docker Compose File

Create `backend/docker-compose.yml`:

```yaml
version: '3.9'

services:
  # PostgreSQL Database
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
      # Optional: Load initial schema
      - ./db-init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - rentflow_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USERNAME:-postgres}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s

  # Database Management UI
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: rentflow_pgadmin
    restart: unless-stopped
    environment:
      PGADMIN_DEFAULT_EMAIL: ${PGADMIN_EMAIL:-admin@rentflow.ke}
      PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_PASSWORD:-admin123}
    ports:
      - "5050:80"
    volumes:
      - pgadmin_data:/var/lib/pgadmin
    networks:
      - rentflow_network
    depends_on:
      db:
        condition: service_healthy

  # Backend Application (optional - for local testing)
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: rentflow_backend
    restart: unless-stopped
    environment:
      NODE_ENV: development
      DB_HOST: db
      DB_PORT: 5432
      DB_USERNAME: ${DB_USERNAME:-postgres}
      DB_PASSWORD: ${DB_PASSWORD:-postgres_password_123}
      DB_NAME: ${DB_NAME:-rentflow}
      JWT_SECRET: ${JWT_SECRET:-dev_secret_key_change_in_production}
      JWT_EXPIRES_IN: 7d
      PORT: 3000
    ports:
      - "3000:3000"
    volumes:
      - ./src:/app/src
      - ./dist:/app/dist
      - /app/node_modules
    networks:
      - rentflow_network
    depends_on:
      db:
        condition: service_healthy
    # Command for development with hot-reload
    command: npm run dev

volumes:
  postgres_data:
  pgadmin_data:

networks:
  rentflow_network:
    driver: bridge
```

### Step 2: Create Environment File for Docker Compose

Create `backend/.env.docker`:

```env
# Database
DB_HOST=db
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres_password_123
DB_NAME=rentflow

# PgAdmin
PGADMIN_EMAIL=admin@rentflow.ke
PGADMIN_PASSWORD=admin123

# JWT
JWT_SECRET=your_super_secret_jwt_key_for_development
JWT_EXPIRES_IN=7d
```

### Step 3: Start Services

```bash
# Start all services in background
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f db
docker-compose logs -f backend

# Check status
docker-compose ps

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes database)
docker-compose down -v

# Rebuild images
docker-compose build --no-cache

# Rebuild and restart
docker-compose up -d --build
```

### Step 4: Access Services Locally

- **Backend API**: http://localhost:3000
- **pgAdmin**: http://localhost:5050
  - Email: admin@rentflow.ke
  - Password: admin123
- **PostgreSQL**: localhost:5432

---

## Building & Running Docker Images

### Step 1: Build Docker Image

```bash
# Build with default tag
docker build -t rentflow-backend .

# Build with specific version tag
docker build -t rentflow-backend:1.0.0 .

# Build with registry prefix (for pushing to registry)
docker build -t yourusername/rentflow-backend:1.0.0 .

# Build with custom Dockerfile path
docker build -t rentflow-backend -f path/to/Dockerfile .

# Build without cache (fresh build)
docker build --no-cache -t rentflow-backend:1.0.0 .

# Build with build args
docker build --build-arg NODE_ENV=production -t rentflow-backend:1.0.0 .
```

### Step 2: Run Docker Container

```bash
# Run basic container
docker run -p 3000:3000 rentflow-backend

# Run with environment variables
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e DB_HOST=postgres.railway.app \
  -e DB_USERNAME=postgres \
  -e JWT_SECRET=your_secret \
  rentflow-backend:1.0.0

# Run in background (detached)
docker run -d \
  --name rentflow_prod \
  -p 3000:3000 \
  --env-file .env.production \
  rentflow-backend:1.0.0

# Run with mounted volumes (for development)
docker run -d \
  -v $(pwd)/src:/app/src \
  -p 3000:3000 \
  rentflow-backend

# Run with network connection
docker run -d \
  --network rentflow_network \
  --name backend \
  -e DB_HOST=db \
  rentflow-backend:1.0.0

# View running containers
docker ps

# View all containers (including stopped)
docker ps -a

# Stop container
docker stop rentflow_prod

# Start container
docker start rentflow_prod

# Remove container
docker rm rentflow_prod

# View logs
docker logs rentflow_prod
docker logs -f rentflow_prod  # Follow logs

# Execute command in running container
docker exec -it rentflow_prod bash
docker exec rentflow_prod npm run typeorm migration:run
```

### Step 3: Docker Image Management

```bash
# List images
docker images

# Remove image
docker rmi rentflow-backend:1.0.0

# Tag image for registry
docker tag rentflow-backend:1.0.0 yourusername/rentflow-backend:1.0.0

# Push to Docker Hub
docker push yourusername/rentflow-backend:1.0.0

# Pull from Docker Hub
docker pull yourusername/rentflow-backend:1.0.0

# Push to GitHub Container Registry
docker tag rentflow-backend:1.0.0 ghcr.io/yourusername/rentflow-backend:1.0.0
docker push ghcr.io/yourusername/rentflow-backend:1.0.0
```

---

## Railway Platform Setup

### Step 1: Create Railway Account

1. Go to https://railway.app
2. Sign up with GitHub or email
3. Create new project
4. Select "Deploy from GitHub repo"

### Step 2: Connect GitHub Repository

1. Authorize Railway to access your GitHub account
2. Select your RentFlow repository
3. Railway automatically detects the project structure

### Step 3: Configure Railway Project

```bash
# Install Railway CLI
npm install -g railway

# Login to Railway
railway login

# Link to Railway project
cd backend
railway link

# View project details
railway list
```

---

## Deploying to Railway

### Step 1: Create Railway Configuration

Create `backend/railway.toml`:

```toml
[build]
builder = "dockerfile"
dockerfile = "Dockerfile"

[deploy]
startCommand = "node dist/server.js"
restartPolicyMaxRetries = 5
restartPolicyDelay = 5

[[services]]
name = "backend"
buildCommand = ""
watchPatterns = ["src/**", "package.json"]

[services.variables]
NODE_ENV = "production"
PORT = "3000"

[services.publicPort]
httpPort = 3000
```

### Step 2: Set Environment Variables in Railway

**Via Railway Dashboard**:
1. Go to your project dashboard
2. Click "Variables" tab
3. Add environment variables:

```
DB_HOST = <railway-postgres-url>
DB_PORT = 5432
DB_USERNAME = postgres
DB_PASSWORD = <generated-password>
DB_NAME = rentflow
NODE_ENV = production
JWT_SECRET = <generate-long-random-string>
JWT_EXPIRES_IN = 7d
CLOUDINARY_CLOUD_NAME = <your-value>
CLOUDINARY_API_KEY = <your-value>
CLOUDINARY_API_SECRET = <your-value>
SMTP_HOST = smtp.gmail.com
SMTP_PORT = 587
SMTP_USER = <your-email>
SMTP_PASS = <your-app-password>
```

**Via CLI**:
```bash
railway variables set NODE_ENV=production
railway variables set DB_HOST=postgres.railway.app
# ... set other variables
```

### Step 3: Add PostgreSQL Plugin

1. In Railway dashboard, click "Add Service"
2. Select "Database" → "PostgreSQL"
3. Railway automatically creates PostgreSQL instance
4. Copy connection details to environment variables

### Step 4: Deploy Application

**Option A: Automatic Deployment (GitHub Integration)**

1. Simply push to your main branch
2. Railway automatically triggers build and deployment
3. View deployment logs in dashboard

**Option B: Manual Deployment**

```bash
# Deploy specific commit
railway deploy --commit <commit-hash>

# Deploy with custom message
railway deploy -m "Deploy feature: payment system"

# View deployment status
railway status

# View logs
railway logs

# View recent deployments
railway logs --history
```

### Step 5: Verify Deployment

```bash
# Get deployment URL from Railway dashboard
# Or use CLI:
railway status

# Test health endpoint
curl https://rentflow-backend-production.railway.app/health

# Test API endpoint
curl https://rentflow-backend-production.railway.app/api/v1/auth/register \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "firstName": "John",
    "lastName": "Doe",
    "role": "TENANT"
  }'
```

---

## Environment Variables

### Development (.env)

```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres_password_123
DB_NAME=rentflow
JWT_SECRET=dev_secret_key_change_in_production
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=dev_cloud_name
CLOUDINARY_API_KEY=dev_api_key
CLOUDINARY_API_SECRET=dev_api_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=dev@gmail.com
SMTP_PASS=dev_app_password
```

### Production (Railway Variables)

```
NODE_ENV=production
PORT=3000
DB_HOST=postgres.railway.app
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=<strong-random-password>
DB_NAME=rentflow
JWT_SECRET=<very-long-random-string>
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your_production_cloud
CLOUDINARY_API_KEY=your_production_key
CLOUDINARY_API_SECRET=your_production_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=rentflow@gmail.com
SMTP_PASS=your_production_app_password
```

### Secure Secret Generation

```bash
# Generate random JWT secret (macOS/Linux)
openssl rand -base64 32

# Node.js method
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Use in production
JWT_SECRET=hx8pK9mL2nQ7vW3rT5yZ... (very long base64 string)
```

---

## Monitoring & Logs

### Railway Dashboard

1. **Metrics Tab**:
   - CPU usage
   - Memory usage
   - Network I/O
   - Request count
   - Response time

2. **Logs Tab**:
   - Real-time application logs
   - Filter by service
   - Search logs by keyword
   - Download logs

3. **Deployments Tab**:
   - View all deployments
   - Rollback to previous version
   - Deployment status (success/failure)

### Programmatic Logging

Update `backend/src/middleware/logger.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { config } from '@config/env';

export const logger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'error' : 'info';
    
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: logLevel,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: (req as any).user?.id || 'anonymous',
    }));
  });
  
  next();
};

export default logger;
```

### Alert Setup

In Railway dashboard:
1. Click "Alerts"
2. Set thresholds:
   - CPU > 80% for 5 minutes
   - Memory > 90%
   - Failed health checks
   - Deployment failures
3. Configure notifications (email, Slack, etc.)

---

## Scaling & Performance

### Horizontal Scaling (Multiple Instances)

```bash
# Railway automatically handles this
# In dashboard:
# 1. Go to Service settings
# 2. Set "Replica Count" to desired number
# 3. Load balancer automatically distributes traffic
```

### Vertical Scaling (Increase Resources)

```bash
# In Railway dashboard:
# 1. Click "Service Settings"
# 2. Adjust "Memory" allocation
# 3. Increase "CPU" cores
# 4. Deploy new instance
```

### Performance Optimization

```typescript
// Pool size optimization in database config
pool: {
  max: 20,     // Maximum connections
  min: 5,      // Minimum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
}

// Request timeout
app.use(timeout('30s'));

// Compression
import compression from 'compression';
app.use(compression());

// Caching
import redis from 'redis';
const cache = redis.createClient();
```

---

## Troubleshooting

### Deployment Failed

```bash
# Check Railway logs
railway logs

# View deployment errors
railway deployments # See status

# Rebuild and redeploy
railway deploy --force

# Check environment variables
railway variables list
```

### Application Crashes

```bash
# View crash logs
railway logs -f

# Common issues:
# 1. Missing environment variables
#    Fix: Add to Railway Variables
#
# 2. Database not accessible
#    Fix: Check DB_HOST, DB_PORT, credentials
#
# 3. Port conflict
#    Fix: Change PORT variable
#
# 4. Out of memory
#    Fix: Increase instance memory in Railway dashboard
```

### Database Connection Issues

```bash
# Test connection locally first
npm run dev

# Verify Railway PostgreSQL is running
# In Railway dashboard: PostgreSQL service should show "Running"

# Check connection string
echo "postgresql://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# Test with psql
psql postgresql://${DB_USERNAME}@${DB_HOST}:${DB_PORT}/${DB_NAME}
```

### Slow Performance

```bash
# Check Railway metrics
# 1. High CPU usage? → Upgrade instance
# 2. High memory usage? → Check for memory leaks, increase memory
# 3. High latency? → Database slow, check indexes

# Monitor with:
railway deploy # Check metrics during deployment
```

### Git Integration Issues

```bash
# Authorize Railway again
railway login --force

# Link project
railway link

# Trigger redeploy
railway deploy
```

---

## CI/CD with GitHub Actions

### Step 1: Create GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Railway

on:
  push:
    branches:
      - main
      - develop

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14-alpine
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test
        env:
          DB_HOST: localhost
          DB_USER: postgres
          DB_PASSWORD: postgres
          DB_NAME: rentflow_test
      
      - name: Build
        run: npm run build
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Railway
        uses: xjasonliang/railway-action@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          environment: production
```

### Step 2: Add Railway Token to Secrets

1. Go to GitHub repo → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `RAILWAY_TOKEN`
4. Value: Get from Railway dashboard (Account Settings → API Token)

### Step 3: Automated Deployment

Now every push to `main` branch will:
1. Run tests
2. Build application
3. Automatically deploy to Railway

---

## Production Checklist

- [ ] Environment variables all set in Railway
- [ ] Database migrations run successfully
- [ ] SSL certificate configured (Railway provides automatic HTTPS)
- [ ] Health endpoint responds with HTTP 200
- [ ] All API tests passing
- [ ] Logs are being captured
- [ ] Backups scheduled for PostgreSQL
- [ ] Monitoring/alerts configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Error logging to external service (optional)
- [ ] CDN configured for static assets (optional)

---

## Rollback Procedure

If deployment causes issues:

```bash
# Via Railway dashboard:
# 1. Click "Deployments"
# 2. Find previous successful deployment
# 3. Click "Restart" or "Revert"
# 4. Service will restart with previous version

# Or via CLI:
railway rollback <deployment-id>
```

---

## Resource Links

- **Railway Documentation**: https://docs.railway.app/
- **Docker Documentation**: https://docs.docker.com/
- **PostgreSQL on Railway**: https://docs.railway.app/databases/postgresql
- **GitHub Actions**: https://docs.github.com/en/actions

---

## Support

For issues:
1. Check Railway dashboard logs
2. Review error messages in Docker logs
3. Verify environment variables
4. Test locally with docker-compose first
5. Open GitHub issue or Railway support ticket

---

**Next Steps**:
1. ✅ Local Docker setup complete
2. ⏭️ Deploy to Railway staging environment
3. ⏭️ Set up monitoring and alerts
4. ⏭️ Create backup strategy
5. ⏭️ Document runbooks for common issues
