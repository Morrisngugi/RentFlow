# RentFlow Backend

Express.js REST API server with TypeORM and PostgreSQL.

## Prerequisites

- Node.js 18+
- PostgreSQL 12+ (or Docker)
- npm or yarn

## Quick Start

### Local Development (with Docker)

```bash
# 1. Create .env file from example
cp .env.example .env

# 2. Start services with Docker Compose
docker-compose up -d

# 3. Verify server is running
curl http://localhost:3001/health
```

### Local Development (without Docker)

```bash
# 1. Install dependencies
npm install

# 2. Create .env file
cp .env.example .env

# 3. Edit .env with your PostgreSQL credentials

# 4. Run development server
npm run dev
```

The API will be available at `http://localhost:3001`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run production build
- `npm run migration:generate` - Generate database migration
- `npm run migration:run` - Run pending migrations
- `npm run migration:revert` - Revert last migration

## Project Structure

```
src/
├── app.ts              # Express application setup
├── server.ts           # Server entry point
├── config/             # Configuration files
│   ├── database.ts    # Database connection setup
│   └── env.ts         # Environment validation
├── middleware/         # Custom middleware
│   ├── errorHandler.ts
│   └── requestLogger.ts
├── entities/           # TypeORM entities (models)
├── migrations/         # Database migrations
├── routes/             # API route handlers
├── services/           # Business logic
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## API Endpoints

### Health Check
- `GET /health` - Server health status

### API Version
- `GET /api/v1` - API version information

## Environment Variables

See `.env.example` for all available configurations.

### Required (Production)
- `JWT_SECRET` - Secret key for JWT signing

### Optional (Development defaults provided)
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3001)
- `DB_*` - Database credentials
- `CORS_ORIGIN` - CORS allowed origin

## Docker

### Build Image
```bash
docker build -t rentflow-backend .
```

### Run Container
```bash
docker run -p 3001:3001 \
  -e DB_HOST=postgres \
  -e JWT_SECRET=your-secret \
  rentflow-backend
```

### Docker Compose
```bash
# Start all services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f backend
```

## Database

### Run Migrations
```bash
npm run migration:run
```

### Generate New Migration
```bash
npm run migration:generate -- -n <MigrationName>
```

### Revert Last Migration
```bash
npm run migration:revert
```

## Development Workflow

1. **Create Entity** - Define in `src/entities/`
2. **Generate Migration** - Run `npm run migration:generate`
3. **Create Service** - Business logic in `src/services/`
4. **Create Route Handler** - Endpoint in `src/routes/`
5. **Run Migrations** - Apply schema changes with `npm run migration:run`
6. **Test Endpoint** - Use curl or Postman

## Dependencies

- **express** - Web framework
- **typeorm** - ORM for database
- **pg** - PostgreSQL client
- **jsonwebtoken** - JWT authentication
- **bcryptjs** - Password hashing
- **class-validator** - Input validation
- **class-transformer** - DTO transformation
- **cors** - Cross-origin support
- **dotenv** - Environment configuration

## Troubleshooting

### Port Already in Use
```bash
# Find and kill process on port 3001
# Windows: netstat -ano | findstr :3001 -> taskkill /PID <PID> /F
# Unix: lsof -i :3001 -> kill -9 <PID>
```

### Database Connection Failed
- Verify PostgreSQL is running
- Check credentials in `.env`
- Ensure database exists
- Review firewall/network settings

### Docker Issues
```bash
# Remove all containers and rebuild
docker-compose down -v
docker-compose up --build
```

## Next Steps

- Implement entity models (see TYPEORM_ENTITIES.md in root)
- Create authentication endpoints
- Add API route handlers
- Write unit tests
- Configure CI/CD pipeline

## Support

See parent README.md for full project documentation.
