# Running RentFlow with Docker

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+

## Quick Start

### 1. Clone or navigate to the project root

```bash
cd /path/to/RentFlow
```

### 2. Create environment files (optional - defaults provided)

Backend (.env):
```bash
cp backend/.env.example backend/.env
```

Frontend (.env.local):
```bash
cp frontend/.env.example frontend/.env.local
```

### 3. Start all services

```bash
docker-compose up -d
```

Wait for all services to become healthy (about 30-60 seconds).

## Services

### PostgreSQL Database
- **URL**: `localhost:5432`
- **Username**: `rentflow_user`
- **Password**: `rentflow_password_change_me`
- **Database**: `rentflow_db`

### Backend API
- **URL**: `http://localhost:3001`
- **Health Check**: `http://localhost:3001/health`
- **API Docs**: `http://localhost:3001/api/v1`

### Frontend Application
- **URL**: `http://localhost:3000`
- **Dev Server**: Hot-reload enabled

## Common Commands

### View logs
```bash
docker-compose logs -f backend    # Backend logs
docker-compose logs -f frontend   # Frontend logs
docker-compose logs -f postgres   # Database logs
```

### Stop all services
```bash
docker-compose down
```

### Stop and remove volumes (clean slate)
```bash
docker-compose down -v
```

### Rebuild containers
```bash
docker-compose build --no-cache
docker-compose up -d
```

### Run database migrations
```bash
docker-compose exec backend npm run db:migrate
```

## Database Operations

### Access PostgreSQL directly
```bash
docker-compose exec postgres psql -U rentflow_user -d rentflow_db
```

### Reset database (delete all data)
```bash
docker-compose down -v
docker-compose up -d
```

## Development

### Backend Development
- Edit files in `./backend/src/`
- Changes auto-reload via `npm run dev`
- TypeScript compilation: `npm run build`

### Frontend Development
- Edit files in `./frontend/src/`
- Changes auto-reload via Next.js dev server
- Build: `npm run build`

## Security Notes

✅ **Production-Ready Security:**
- Backend uses Chainguard hardened builder + distroless runtime (zero vulnerabilities)
- Frontend uses Chainguard hardened builder + distroless runtime
- PostgreSQL uses actively-patched bookworm variant
- All containers run as non-root users

⚠️ **Development Mode:**
- Volumes are mounted for live reload (don't use in production)
- Default passwords are development-only (change for production)
- JWT secret is development-only (change for production)

## Troubleshooting

**Port already in use:**
```bash
# Change ports in docker-compose.yml
# Or kill existing containers:
docker-compose down -v
```

**Database connection failed:**
```bash
# Ensure postgres is healthy:
docker-compose ps
# Check postgres logs:
docker-compose logs postgres
```

**Frontend can't reach backend:**
- Ensure both services are on the same network
- Check `NEXT_PUBLIC_API_URL` in docker-compose.yml
- For frontend dev: use `http://backend:3001` (Docker DNS)

**Permission denied errors:**
```bash
# Rebuild containers:
docker-compose build --no-cache
docker-compose up -d
```

## Next Steps

1. **Create test user**: Call `POST /api/v1/auth/register`
2. **Login**: Call `POST /api/v1/auth/login` to get JWT token
3. **Inspect database**: Use PostgreSQL admin tools or CLI
4. **Deploy**: Push to production platform (Railway, AWS, GCP, etc.)
