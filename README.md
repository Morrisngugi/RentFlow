# RentFlow - Rent Management System

A full-stack rent management platform with three **independent services**:
1. **Backend API** - Node.js + Express + PostgreSQL
2. **Frontend Web** - Next.js React dashboard
3. **Mobile App** - Native Android (Kotlin)

---

## Project Structure

```
RentFlow/
├── backend/                   # Independent Express.js API
│   ├── src/
│   │   ├── entities/          # TypeORM database entities
│   │   ├── migrations/        # Database migrations
│   │   ├── routes/            # API endpoints
│   │   ├── services/          # Business logic
│   │   ├── middleware/        # Auth, logging
│   │   ├── utils/
│   │   ├── types/
│   │   └── config/
│   ├── Dockerfile             # Docker container
│   ├── docker-compose.yml     # PostgreSQL + pgAdmin
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── frontend/                  # Independent Next.js web app
│   ├── src/
│   │   ├── app/               # Next.js app directory
│   │   ├── components/        # UI components
│   │   └── pages/             # Route pages
│   ├── public/                # Static assets
│   ├── package.json
│   ├── next.config.js
│   └── README.md
│
├── android/                   # Independent Kotlin mobile app
│   ├── app/src/
│   │   ├── main/
│   │   │   ├── kotlin/        # Kotlin source code
│   │   │   └── res/           # Android resources
│   │   └── test/
│   ├── build.gradle.kts
│   ├── settings.gradle.kts
│   ├── gradle.properties
│   └── README.md
│
├── docs/
│   ├── WORKFLOW.md            # 12-week development roadmap
│   ├── NODE_JS_SETUP.md       # Backend setup guide
│   ├── ANDROID_SETUP.md       # Android setup guide
│   ├── DOCKER_RAILWAY_DEPLOYMENT.md
│   ├── TYPEORM_ENTITIES.md
│   ├── DEVELOPMENT_WORKFLOW.md
│   └── more...
│
└── README.md (this file)
```

---

## Quick Links

**Development Guides:**
- [NODE_JS_SETUP.md](./NODE_JS_SETUP.md) - Backend initialization
- [ANDROID_SETUP.md](./ANDROID_SETUP.md) - Mobile setup
- [DOCKER_RAILWAY_DEPLOYMENT.md](./DOCKER_RAILWAY_DEPLOYMENT.md) - Deployment
- [DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md) - Team standards
- [WORKFLOW.md](./WORKFLOW.md) - 12-week roadmap

**Database & Architecture:**
- [TYPEORM_ENTITIES.md](./TYPEORM_ENTITIES.md) - Database schema
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Reference schema
- [BACKEND_FOLDER_STRUCTURE.md](./BACKEND_FOLDER_STRUCTURE.md) - Backend organization

---

## Getting Started

Each project is **completely independent**. Start with the backend:

### Backend (Node.js + Express)

```bash
cd backend
npm install
docker-compose up -d      # Start PostgreSQL
npm run dev               # Start server on http://localhost:3000
```

See [backend/README.md](./backend/README.md) for detailed instructions.

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev              # Start on http://localhost:3001
```

See [frontend/README.md](./frontend/README.md) for detailed instructions.

### Mobile (Android)

```bash
cd android
# Open in Android Studio
# See ANDROID_SETUP.md for detailed instructions
```

See [android/README.md](./android/README.md) for detailed instructions.

---

## Tech Stack

### Backend (Node.js)
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL 14+
- **ORM**: TypeORM with migrations
- **Authentication**: JWT + bcrypt
- **Containerization**: Docker

### Frontend (Next.js)
- **Framework**: Next.js 16
- **UI**: React 19 + TypeScript
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form
- **HTTP**: Axios

### Mobile (Android)
- **Language**: Kotlin
- **UI**: Jetpack Compose
- **Build**: Gradle
- **DI**: Dagger Hilt
- **HTTP**: Retrofit
- **Auth**: JWT tokens in SharedPreferences

### Infrastructure
- **Deployment**: Railway (backend + PostgreSQL)
- **File Storage**: Cloudinary
- **Email**: Nodemailer
- **CI/CD**: GitHub Actions
- **VCS**: Git

---

## Branding

**Eco-Modern Color Palette:**

- **Primary**: Forest Green `#184A45`
- **Secondary**: Sage Green `#84A98C`
- **Accent**: Tan `#E7D8C9`
- **Neutral**: Charcoal Gray `#2F2F2F`

---

## Database Model

### Core Entities

**Users & Profiles:**
- `users` - Base user data
- `tenant_profiles` - Tenant-specific info
- `agent_profiles` - Agent-specific info
- `landlord_profiles` - Landlord-specific info

**Properties & Leases:**
- `properties` - Rental units
- `leases` - Lease agreements
- `payments` - Rent payments
- `deposits` - Security deposits

**Communications:**
- `complaints` - Tenant complaints
- `notifications` - In-app notifications

See [TYPEORM_ENTITIES.md](./TYPEORM_ENTITIES.md) for complete details.

---

## Development Timeline

**12-week MVP roadmap:**

### Weeks 1-3: Backend Infrastructure
- Express + TypeORM setup
- JWT authentication
- Docker environment
- Core API endpoints

### Weeks 4-5: Mobile Foundation
- Android project setup
- Jetpack Compose
- Navigation structure
- API integration

### Weeks 6-10: Core Features
- Property CRUD
- Lease management
- Payment tracking
- Mobile screens

### Weeks 11-12: Polish & Deployment
- Notifications
- Testing
- Bug fixes
- Production deployment

See [WORKFLOW.md](./WORKFLOW.md) for detailed timeline.

---

## Team Standards

All development follows [DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md):
- Git strategy (feature/bugfix/chore branches)
- Code review process
- TypeScript strict mode
- 80%+ test coverage for services
- Linting and formatting standards

---

## Deployment

### Backend (Railway)

```bash
cd backend
docker build -t rentflow-backend .
# Deploy via Railway dashboard
```

### Frontend (Vercel)

```bash
cd frontend
npm run build
# Deploy via Vercel dashboard
```

### Mobile (Google Play Store)

```bash
cd android
./gradlew assembleRelease
# Upload to Play Console
```

See [DOCKER_RAILWAY_DEPLOYMENT.md](./DOCKER_RAILWAY_DEPLOYMENT.md) for detailed steps.

---

## Environment Setup

Each project manages its own environment:

**Backend (.env):**
```env
DB_HOST=localhost
DB_PORT=5432
JWT_SECRET=your_secret_key
# See backend/.env.example for full list
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
# See frontend/.env.example
```

**Android (gradle.properties):**
```properties
API_BASE_URL=http://192.168.x.x:3000
# See android/gradle.properties
```

---

## Documentation Index

**Setup Guides:**
- [NODE_JS_SETUP.md](./NODE_JS_SETUP.md) - Backend from scratch
- [ANDROID_SETUP.md](./ANDROID_SETUP.md) - Android development
- [BACKEND_FOLDER_STRUCTURE.md](./BACKEND_FOLDER_STRUCTURE.md) - Backend organization

**Architecture & Design:**
- [TYPEORM_ENTITIES.md](./TYPEORM_ENTITIES.md) - Database schema (18 entities)
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Reference schema

**Workflow & Deployment:**
- [WORKFLOW.md](./WORKFLOW.md) - 12-week development roadmap
- [DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md) - Team processes
- [DOCKER_RAILWAY_DEPLOYMENT.md](./DOCKER_RAILWAY_DEPLOYMENT.md) - Production deployment

---

## Key Features

✅ **Multi-tenant**: Separate roles (Tenant, Agent, Landlord)  
✅ **Payment tracking**: Recording, scheduling, late fees  
✅ **Lease management**: Creation, renewals, term tracking  
✅ **Complaint system**: Tenant issues with attachments  
✅ **Notifications**: In-app + email  
✅ **Responsive**: Mobile-first Android UI  
✅ **Secure**: JWT auth + password hashing  
✅ **Scalable**: Docker containerization  
✅ **TypeScript**: Type-safe across all services  

---

## Next Steps

1. ✅ Project structure created
2. → **Start Backend** (Week 1):
   ```bash
   cd backend
   npm install
   docker-compose up -d
   npm run dev
   ```
3. → **Setup Frontend** (Post-MVP)
4. → **Build Android** (Week 4)
5. → **Deploy to Production** (Week 12)

---

## Support & Questions

- 📖 See respective README in each project folder
- 🐛 Check troubleshooting in setup guides
- 💬 Review [DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md) for standards

---

## License

MIT License - Open for educational and commercial use

---

**Ready to build RentFlow? Start with [backend/](./backend/) 🚀**
