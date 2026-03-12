# RentFlow Development Roadmap & Workflow

**Project**: Rent Management System  
**Architecture**: Node.js + Express + TypeORM (Backend) × Android Native (Kotlin) × Next.js (Web)  
**Database**: PostgreSQL + Docker  
**Deployment**: Docker + Railway  
**Timeline**: 12 weeks (March - May 2026)  
**Status**: Planning Phase

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend** | Node.js + Express + TypeScript | REST API & business logic |
| **Database** | PostgreSQL + TypeORM | Relational data + migrations |
| **Mobile** | Android (Kotlin) + Jetpack Compose | Android-only app |
| **Web** | Next.js 16 + React 19 + TypeScript | Landlord/agent dashboard |
| **File Storage** | Cloudinary | Property images, attachments |
| **Email** | Nodemailer | Email notifications |
| **Auth** | JWT + bcrypt | Stateless authentication |
| **Containerization** | Docker + Docker Compose | Local & production environment |
| **Deployment** | Railway | Backend + DB hosting |
| **Forms** | React Hook Form | Web form management |
| **SMSNotifications** | Twilio API | SMS alerts (future) |

---

## Phase 1: Environment & Backend Setup (Weeks 1–3)

*Goal: API server running with database migrations, authentication, and basic CRUD ready*

### Week 1: Project Initialization

- [ ] **Backend Project Structure**
  - [ ] Initialize Express.js + TypeScript
  - [ ] Set up folder structure: `src/entities`, `src/migrations`, `src/routes`, `src/services`
  - [ ] Configure TypeORM with PostgreSQL
  - [ ] Set up dotenv for environment variables

- [ ] **Docker Setup**
  - [ ] Create Dockerfile for Node.js
  - [ ] Create docker-compose.yml with PostgreSQL + pgAdmin
  - [ ] Test local Docker environment

- [ ] **Database Migrations**
  - [ ] Copy TypeORM entities from TYPEORM_ENTITIES.md
  - [ ] Generate initial migration
  - [ ] Run migrations in Docker container

### Week 2: Authentication & User Management

- [ ] **Auth System**
  - [ ] Implement JWT token generation/validation
  - [ ] Set up bcrypt password hashing
  - [ ] Create `/auth/register` endpoint
  - [ ] Create `/auth/login` endpoint
  - [ ] Create `/auth/refresh` endpoint (JWT refresh)

- [ ] **Role-Based Access Control (RBAC)**
  - [ ] Create auth middleware for role verification
  - [ ] Implement @IsLandlord, @IsAgent, @IsTenant decorators
  - [ ] Test role-based endpoint protection

- [ ] **User Profiles API**
  - [ ] Create `POST /tenants` (tenant registration + profile)
  - [ ] Create `POST /agents` (agent registration + profile)
  - [ ] Create `POST /landlords` (landlord registration + profile)
  - [ ] Create `GET /users/:id` (get user with profile)
  - [ ] Create `PATCH /users/:id` (update user profile)

### Week 3: Core API Setup & Testing

- [ ] **Error Handling & Logging**
  - [ ] Implement global error handler middleware
  - [ ] Set up logging (Winston or Pino)
  - [ ] Create API response standardization

- [ ] **API Documentation**
  - [ ] Add Swagger/OpenAPI comments to endpoints
  - [ ] Generate API docs at /api/docs

- [ ] **Testing**
  - [ ] Set up Jest for unit tests
  - [ ] Test auth endpoints
  - [ ] Test user registration flows
  - [ ] Achieve 80%+ coverage for auth module

---

## Phase 2: Mobile (Android Native) Setup (Weeks 4–5)

*Goal: Android app with login, authentication, and basic navigation ready*

### Week 4: Android Project Initialization

- [ ] **Project Setup**
  - [ ] Create Android project in Kotlin
  - [ ] Set up Jetpack Compose for UI
  - [ ] Configure dependency injection with Dagger Hilt
  - [ ] Set up Gradle build configuration

- [ ] **Network Layer**
  - [ ] Add Retrofit for HTTP client
  - [ ] Configure API base URL from environment
  - [ ] Set up JWT token interceptor

- [ ] **Authentication UI & Logic**
  - [ ] Build login screen (Compose)
  - [ ] Build signup screen with profile form
  - [ ] Implement JWT token storage (encrypted SharedPreferences or Datastore)
  - [ ] Create auth navigation based on login state

### Week 5: Navigation & Dashboard

- [ ] **Navigation Structure**
  - [ ] Set up Navigation Compose for app flow
  - [ ] Create bottom navigation for main screens
  - [ ] Implement role-based route protection

- [ ] **Tenant Dashboard** (if tenant)
  - [ ] View active leases
  - [ ] View upcoming rent dues
  - [ ] View payment history

- [ ] **Landlord Dashboard** (if landlord)
  - [ ] View properties
  - [ ] View active tenants
  - [ ] View pending payments

---

## Phase 3: Property & Lease Management (Weeks 6–8)

*Goal: Full CRUD for properties, leases, and lease renewals*

### Week 6: Property Management API

- [ ] **Property CRUD Endpoints**
  - [ ] `POST /properties` (create property)
  - [ ] `GET /properties/:id` (get property details)
  - [ ] `PUT /properties/:id` (update property)
  - [ ] `DELETE /properties/:id` (delete property)
  - [ ] `GET /landlords/:id/properties` (list landlord properties)

- [ ] **Image Upload**
  - [ ] Integrate Cloudinary API
  - [ ] `POST /properties/:id/images` (upload images)
  - [ ] Store image URLs in `PropertyImage` entity

### Week 7: Lease Management API

- [ ] **Lease CRUD**
  - [ ] `POST /leases` (create lease with terms)
  - [ ] `GET /leases/:id` (get lease details)
  - [ ] `PATCH /leases/:id` (update lease)
  - [ ] `GET /properties/:id/leases` (list property leases)

- [ ] **Lease Renewals**
  - [ ] `POST /leases/:id/renewals` (create renewal)
  - [ ] `GET /leases/:id/renewals` (get renewal history)

- [ ] **Android Integration**
  - [ ] Build properties list screen
  - [ ] Build property details screen
  - [ ] Build lease details screen
  - [ ] Build add/edit property form

### Week 8: Rent Schedules & Payment Setup

- [ ] **Rent Schedule API**
  - [ ] `POST /leases/:id/schedules` (create payment schedule)
  - [ ] `GET /leases/:id/schedules` (get upcoming payments)

- [ ] **Deposit Tracking**
  - [ ] `POST /leases/:id/deposits` (record deposit)
  - [ ] `PATCH /leases/:id/deposits` (update deposit status)
  - [ ] Track deposit lifecycle (pending → held → released/forfeited)

---

## Phase 4: Rent Collection & Payments (Weeks 9–10)

*Goal: Payment tracking & Stripe integration for automated rent collection*

### Week 9: Payment Tracking API

- [ ] **Payment Management**
  - [ ] `POST /payments` (record payment)
  - [ ] `GET /payments` (list payments with filters)
  - [ ] `PATCH /payments/:id` (update payment status)
  - [ ] `GET /leases/:id/payment-history` (payment history per lease)

- [ ] **Late Fee Calculation**
  - [ ] Implement late fee calculation logic
  - [ ] `POST /payments/:id/late-fees` (auto-calculate late fees)
  - [ ] Send notifications for overdue payments

- [ ] **Android Payments Screen**
  - [ ] Build payment history screen
  - [ ] Build rent due notification screen
  - [ ] Build payment submission form

### Week 10: Stripe Integration (Optional - MVP can use manual)

- [ ] **Stripe Setup** (if implementing automated payments)
  - [ ] Create Stripe customer for each tenant
  - [ ] Generate payment intents for recurring billing
  - [ ] Handle Stripe webhooks for payment confirmation
  - [ ] Update payment status on successful transaction

- [ ] **Invoice Generation**
  - [ ] Implement PDF invoice generation with PDFKit
  - [ ] Send invoices via email
  - [ ] Store invoice URLs in storage

---

## Phase 5: Complaints & Notifications (Weeks 11–12)

*Goal: In-app complaint system and multi-channel notifications operational*

### Week 11: Complaint System API

- [ ] **Complaint Management**
  - [ ] `POST /complaints` (tenant submits complaint)
  - [ ] `GET /complaints` (list complaints with filters)
  - [ ] `PATCH /complaints/:id` (update complaint status)
  - [ ] `POST /complaints/:id/attachments` (upload complaint attachments)

- [ ] **Android Complaint Flow**
  - [ ] Build complaint submission form
  - [ ] Build complaint status tracking screen
  - [ ] Display complaint list for landlords

- [ ] **Notifications API**
  - [ ] `POST /notifications` (create notification)
  - [ ] `GET /users/:id/notifications` (list notifications)
  - [ ] `PATCH /notifications/:id` (mark as read)

### Week 12: Multi-Channel Notifications & Deployment

- [ ] **Email Notifications** (Nodemailer)
  - [ ] Send complaint posted alerts
  - [ ] Send rent due reminders
  - [ ] Send payment received confirmations
  - [ ] Send lease expiry notices

- [ ] **Android Push Notifications**
  - [ ] Integrate Firebase Cloud Messaging (FCM)
  - [ ] Send push alerts for rent due, complaints, messages

- [ ] **Production Deployment**
  - [ ] Deploy backend to Railway
  - [ ] Configure PostgreSQL on Railway
  - [ ] Set up environment variables (JWT secret, Stripe key, Cloudinary)
  - [ ] Deploy Android app to Google Play Store (internal testing)
  - [ ] Create deployment pipeline (CI/CD with GitHub Actions)

---

## Post-MVP Enhancements

- [ ] Next.js web dashboard for agents/landlords
- [ ] SMS notifications via Twilio
- [ ] Advanced reporting & analytics
- [ ] Maintenance request system
- [ ] Tenant credit scoring
- [ ] Integration with accounting software

---

## Weekly Milestones

| Week | Backend | Mobile | Web | Status |
|------|---------|--------|-----|--------|
| **1** | Express + TypeORM setup | - | - | 🔴 |
| **2** | Auth system (JWT + bcrypt) | - | - | 🔴 |
| **3** | Core API + testing | - | - | 🔴 |
| **4** | - | Android setup + Compose | - | 🔴 |
| **5** | - | Auth UI + navigation | - | 🔴 |
| **6** | Property CRUD + Cloudinary | - | - | 🔴 |
| **7** | Lease CRUD + renewals | Property screens | - | 🔴 |
| **8** | Rent schedules + deposits | Lease screens | - | 🔴 |
| **9** | Payment tracking + late fees | Payment screens | - | 🔴 |
| **10** | Stripe integration | - | - | 🔴 |
| **11** | Complaints API | Complaint screens | - | 🔴 |
| **12** | Notifications + deployment | Push notifications | - | 🔴 |

---

## Success Criteria (MVP)

✅ Backend running on Railway with PostgreSQL  
✅ Android app login & authentication working  
✅ Landlords can create properties and leases  
✅ Tenants can view leases and pay rent  
✅ Payment tracking working with status updates  
✅ Complaints submission and tracking  
✅ Email notifications for key events  
✅ API documented with Swagger  
✅ Android app published to Google Play Store  

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| **Stripe integration delays** | Use manual payment entry in MVP; automate later |
| **Android build issues** | Start with emulator; test early on real device |
| **Database migration errors** | Test migrations in Docker first; have rollback plan |
| **Performance with large datasets** | Use pagination; add indexes; monitor with Railway logs |
| **Scope creep** | Stick to MVP features; defer Next.js web to post-launch |

---

## Development Environment

```bash
# Backend development
backend/
├── src/
│   ├── entities/          # TypeORM entities
│   ├── migrations/        # Database migrations
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── middleware/        # Auth, logging, etc
│   ├── utils/             # Helpers, validators
│   └── main.ts            # Express app entry
├── docker-compose.yml     # PostgreSQL + pgAdmin
├── Dockerfile             # Node.js container
└── .env.example

# Mobile development
android/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── kotlin/    # Kotlin source
│   │   │   └── res/       # Resources
│   │   └── test/
│   └── build.gradle
└── settings.gradle

# Web development (Post-MVP)
web/
├── src/
│   ├── app/               # Next.js app directory
│   ├── components/        # React components
│   └── pages/             # Next.js pages
├── tailwind.config.ts
└── tsconfig.json
```

---

## Team & Responsibilities

| Role | Responsibility |
|------|-----------------|
| **Backend Dev** | API development, database, authentication, deployments |
| **Android Dev** | UI with Compose, API integration, offline features |
| **DevOps/Infra** | Docker, Railway deployment, monitoring |
| **Product** | Feature prioritization, requirements |

---

## Deployment Checklist

- [ ] Docker images built and tested
- [ ] Railway account created
- [ ] PostgreSQL database provisioned on Railway
- [ ] Environment variables configured (secrets)
- [ ] Backend CI/CD pipeline set up (GitHub Actions)
- [ ] Android app signed and ready for Play Store
- [ ] Stripe/Cloudinary keys configured
- [ ] Email service (Nodemailer) tested
- [ ] Monitoring & alerting set up

---

**This roadmap is flexible. Adjust based on learnings and blockers.**

---

---

## Post-MVP: Future Enhancements
- [ ] Advanced analytics and reporting
- [ ] Automated maintenance request system
- [ ] Tenant credit scoring
- [ ] Integration with accounting software (QuickBooks)
- [ ] Multi-language support
- [ ] Advanced property filters (by city, price range, amenities)

---

## Technical Stack Confirmation

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Mobile** | React Native + Expo | iOS/Android apps |
| **Web** | React.js (Vite) | Landlord/agent dashboard |
| **Monorepo** | Turborepo + pnpm | Code sharing & orchestration |
| **Backend** | Supabase (Postgres) | Database, Auth, Real-time, Storage |
| **State** | Zustand | Client-side state management |
| **Forms** | React Hook Form + Zod | Form handling & validation |
| **Data Fetching** | TanStack Query | Caching, sync, offline support |
| **UI** | NativeWind + Tailwind | Consistent styling across platforms |
| **Payments** | Stripe | Automated rent collection |
| **Notifications** | SendGrid/Twilio + Expo Notifications | Email, SMS, push alerts |
| **Deployment** | EAS (mobile) + Vercel (web) | App Store, Play Store, production hosting |

---

## Branding & Design

**Logo**: [TO BE DESIGNED]  
**Style**: Eco-Modern (Growth + Trust + Residential Comfort)  
**Primary Color**: Forest Green (#184A45) — Prosperity, growth, stability  
**Secondary Color**: Sage Green (#84A98C) — Grounded, welcoming  
**Accent**: Tan (#E7D8C9) — Warm, residential feel  
**Neutral**: Charcoal Gray (#2F2F2F) — Premium software aesthetic  
**Typography**: Inter or Poppins (modern, clean)  
**Design System**: Tailwind + NativeWind with custom color palette

---

## Team & Responsibilities

| Role | Responsibility |
|------|-----------------|
| **Full-Stack Dev** | Auth, API, CRUD features, Stripe integration |
| **Mobile Dev** | React Native/Expo app, offline sync, push notifications |
| **Web Dev** | React dashboard, admin features |
| **Designer** | Logo, color palette, UI mockups, design system |
| **Product** | Feature prioritization, requirements gathering |

---

## Success Criteria (MVP)

✅ Users can sign up and login (3 roles: landlord, agent, tenant)  
✅ Landlords can add properties and create leases  
✅ Tenants can view their leases and pay rent via Stripe  
✅ Landlords see payment status and collect rent  
✅ Tenants can post complaints; landlords receive notifications  
✅ Both apps work online and mobile app works offline  
✅ App deployed to App Store, Play Store, and web  

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| **Stripe integration delays** | Start with manual payment entry; automate later |
| **Notification delivery issues** | Test SendGrid/Twilio early; have fallback email system |
| **Supabase RLS complexity** | Document policies; test thoroughly before production |
| **Multi-platform consistency** | Use NativeWind; test on both iOS and Android weekly |
| **Scope creep** | Stick to MVP features; defer enhancements to post-MVP |

---

## Weekly Check-ins

- **Monday**: Review completed tasks, identify blockers
- **Wednesday**: Mid-week sync on progress
- **Friday**: Sprint planning for next week

---

## Next Action
→ **Initialize Monorepo & Begin Phase 1 Week 1**
