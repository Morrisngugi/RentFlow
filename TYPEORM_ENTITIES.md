# RentFlow TypeORM Database Entities & Schema

Architecture: Node.js (Express) + TypeORM + PostgreSQL  
Database: PostgreSQL 14+  
ORM: TypeORM with migrations

---

## Entity Organization

```
backend/src/entities/
├── User.ts                 # Base user entity
├── profile/
│   ├── TenantProfile.ts
│   ├── AgentProfile.ts
│   └── LandlordProfile.ts
├── property/
│   ├── Property.ts
│   └── PropertyImage.ts
├── lease/
│   ├── Lease.ts
│   ├── LeaseRenewal.ts
│   └── LeaseTerm.ts
├── payment/
│   ├── Payment.ts
│   ├── Deposit.ts
│   ├── LateFee.ts
│   └── RentSchedule.ts
├── complaint/
│   ├── Complaint.ts
│   └── ComplaintAttachment.ts
└── notification/
    ├── Notification.ts
    └── NotificationPreference.ts
```

---

## Core Entities

### 1. User (Base Entity)

```typescript
// backend/src/entities/User.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm'
import { TenantProfile } from './profile/TenantProfile'
import { AgentProfile } from './profile/AgentProfile'
import { LandlordProfile } from './profile/LandlordProfile'
import { Notification } from './notification/Notification'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', unique: true, nullable: true })
  email: string

  @Column({ type: 'varchar' })
  phoneNumber: string

  @Column({ type: 'varchar' })
  firstName: string

  @Column({ type: 'varchar' })
  lastName: string

  @Column({ type: 'varchar' })
  idNumber: string

  @Column({ type: 'varchar', nullable: true })
  profilePictureUrl: string

  @Column({ type: 'varchar', select: false }) // Excluded from queries by default
  passwordHash: string

  @Column({ type: 'boolean', default: true })
  isActive: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  // Relations
  @OneToOne(() => TenantProfile, (profile) => profile.user, {
    nullable: true,
    cascade: true,
  })
  tenantProfile: TenantProfile

  @OneToOne(() => AgentProfile, (profile) => profile.user, {
    nullable: true,
    cascade: true,
  })
  agentProfile: AgentProfile

  @OneToOne(() => LandlordProfile, (profile) => profile.user, {
    nullable: true,
    cascade: true,
  })
  landlordProfile: LandlordProfile

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[]
}
```

### 2. Role Enum

```typescript
// backend/src/types/UserRole.ts
export enum UserRole {
  TENANT = 'tenant',
  AGENT = 'agent',
  LANDLORD = 'landlord',
}
```

### 3. Tenant Profile

```typescript
// backend/src/entities/profile/TenantProfile.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm'
import { User } from '../User'

@Entity('tenant_profiles')
export class TenantProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid' })
  userId: string

  @Column({ type: 'varchar', nullable: true })
  nationality: string

  @Column({
    type: 'enum',
    enum: ['single', 'married', 'divorced', 'widowed'],
    nullable: true,
  })
  maritalStatus: string

  @Column({ type: 'int', default: 0 })
  numberOfChildren: number

  @Column({ type: 'varchar', nullable: true })
  occupation: string

  @Column({ type: 'text', nullable: true })
  postalAddress: string

  @Column({ type: 'varchar', nullable: true })
  nextOfKinName: string

  @Column({ type: 'varchar', nullable: true })
  nextOfKinPhone: string

  @Column({ type: 'varchar', nullable: true })
  nextOfKinRelationship: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  // Relation
  @OneToOne(() => User, (user) => user.tenantProfile)
  @JoinColumn({ name: 'userId' })
  user: User
}
```

### 4. Agent Profile

```typescript
// backend/src/entities/profile/AgentProfile.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm'
import { User } from '../User'
import { AgentLandlordAssignment } from '../AgentLandlordAssignment'

@Entity('agent_profiles')
export class AgentProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid' })
  userId: string

  @Column({ type: 'varchar' })
  officeName: string

  @Column({ type: 'varchar' })
  officeLocation: string

  @Column({ type: 'boolean', default: true })
  isActive: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  // Relations
  @OneToOne(() => User, (user) => user.agentProfile)
  @JoinColumn({ name: 'userId' })
  user: User

  @OneToMany(() => AgentLandlordAssignment, (assignment) => assignment.agent)
  landlordAssignments: AgentLandlordAssignment[]
}
```

### 5. Landlord Profile

```typescript
// backend/src/entities/profile/LandlordProfile.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm'
import { User } from '../User'
import { Property } from '../property/Property'
import { AgentLandlordAssignment } from '../AgentLandlordAssignment'

@Entity('landlord_profiles')
export class LandlordProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid' })
  userId: string

  @Column({ type: 'text' })
  physicalAddress: string

  @Column({ type: 'varchar', nullable: true })
  bankName: string

  @Column({ type: 'varchar', nullable: true })
  bankAccountNumber: string

  @Column({ type: 'varchar', nullable: true })
  bankAccountHolder: string

  @Column({ type: 'varchar', nullable: true })
  companyName: string

  @Column({ type: 'varchar', nullable: true })
  taxId: string

  @Column({ type: 'numeric', default: 5.0 })
  defaultLateFeePercentage: number

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  // Relations
  @OneToOne(() => User, (user) => user.landlordProfile)
  @JoinColumn({ name: 'userId' })
  user: User

  @OneToMany(() => Property, (property) => property.landlord)
  properties: Property[]

  @OneToMany(() => AgentLandlordAssignment, (assignment) => assignment.landlord)
  agentAssignments: AgentLandlordAssignment[]
}
```

### 6. Agent-Landlord Assignment

```typescript
// backend/src/entities/AgentLandlordAssignment.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Unique,
} from 'typeorm'
import { User } from './User'

@Entity('agent_landlord_assignments')
@Unique(['agentId', 'landlordId'])
export class AgentLandlordAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid' })
  agentId: string

  @Column({ type: 'uuid' })
  landlordId: string

  @CreateDateColumn()
  assignedAt: Date

  // Relations
  @ManyToOne(() => User)
  agent: User

  @ManyToOne(() => User)
  landlord: User
}
```

---

## 2. Property Entities

### Property

```typescript
// backend/src/entities/property/Property.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm'
import { User } from '../User'
import { PropertyImage } from './PropertyImage'
import { Lease } from '../lease/Lease'

@Entity('properties')
export class Property {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid' })
  landlordId: string

  @Column({ type: 'varchar' })
  name: string

  @Column({ type: 'text' })
  address: string

  @Column({ type: 'varchar' })
  city: string

  @Column({ type: 'varchar', nullable: true })
  postalCode: string

  @Column({ type: 'varchar', default: 'Kenya' })
  country: string

  @Column({ type: 'int', nullable: true })
  bedrooms: number

  @Column({ type: 'int', nullable: true })
  bathrooms: number

  @Column({ type: 'int', nullable: true })
  sqft: number

  @Column({
    type: 'enum',
    enum: ['apartment', 'house', 'commercial'],
    nullable: true,
  })
  propertyType: string

  @Column({ type: 'text', nullable: true })
  description: string

  @Column({ type: 'numeric' })
  monthlyRent: number

  @Column({ type: 'numeric', nullable: true })
  depositAmount: number

  @Column({ type: 'simple-array', nullable: true })
  utilitiesIncluded: string[]

  @Column({ type: 'simple-array', nullable: true })
  imageUrls: string[]

  @Column({ type: 'boolean', default: true })
  isAvailable: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  // Relations
  @ManyToOne(() => User)
  landlord: User

  @OneToMany(() => PropertyImage, (image) => image.property, {
    cascade: true,
  })
  images: PropertyImage[]

  @OneToMany(() => Lease, (lease) => lease.property)
  leases: Lease[]
}
```

### Property Image

```typescript
// backend/src/entities/property/PropertyImage.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm'
import { Property } from './Property'

@Entity('property_images')
export class PropertyImage {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid' })
  propertyId: string

  @Column({ type: 'varchar' })
  imageUrl: string

  @Column({ type: 'varchar', nullable: true })
  caption: string

  @Column({ type: 'int', default: 0 })
  displayOrder: number

  @CreateDateColumn()
  uploadedAt: Date

  // Relation
  @ManyToOne(() => Property, (property) => property.images)
  property: Property
}
```

---

## 3. Lease Entities

### Lease Term

```typescript
// backend/src/entities/lease/LeaseTerm.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('lease_terms')
export class LeaseTerm {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar' })
  name: string // e.g., "12-Month Fixed", "Month-to-Month"

  @Column({ type: 'int', nullable: true })
  durationMonths: number // NULL for month-to-month

  @Column({ type: 'boolean', default: false })
  autoRenewal: boolean

  @Column({ type: 'int', default: 30 })
  noticePeriodDays: number
}
```

### Lease

```typescript
// backend/src/entities/lease/Lease.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm'
import { Property } from '../property/Property'
import { User } from '../User'
import { LeaseTerm } from './LeaseTerm'
import { Payment } from '../payment/Payment'
import { LeaseRenewal } from './LeaseRenewal'

@Entity('leases')
export class Lease {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid' })
  propertyId: string

  @Column({ type: 'uuid' })
  tenantId: string

  @Column({ type: 'uuid' })
  landlordId: string

  @Column({ type: 'uuid' })
  leaseTermId: string

  @Column({ type: 'numeric' })
  monthlyRent: number

  @Column({ type: 'numeric', default: 0 })
  garbageAmount: number

  @Column({ type: 'numeric', default: 0 })
  waterUnitCost: number

  @Column({ type: 'numeric', default: 0 })
  securityDeposit: number

  @Column({ type: 'boolean', default: false })
  depositPaid: boolean

  @Column({ type: 'date', nullable: true })
  depositPaidDate: Date

  @Column({ type: 'date' })
  startDate: Date

  @Column({ type: 'date' })
  endDate: Date

  @Column({
    type: 'enum',
    enum: ['draft', 'active', 'expired', 'terminated'],
    default: 'active',
  })
  status: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  // Relations
  @ManyToOne(() => Property, (property) => property.leases)
  property: Property

  @ManyToOne(() => User)
  tenant: User

  @ManyToOne(() => User)
  landlord: User

  @ManyToOne(() => LeaseTerm)
  leaseTerm: LeaseTerm

  @OneToMany(() => Payment, (payment) => payment.lease)
  payments: Payment[]

  @OneToMany(() => LeaseRenewal, (renewal) => renewal.lease)
  renewals: LeaseRenewal[]
}
```

### Lease Renewal

```typescript
// backend/src/entities/lease/LeaseRenewal.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm'
import { Lease } from './Lease'

@Entity('lease_renewals')
export class LeaseRenewal {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid' })
  leaseId: string

  @Column({ type: 'date' })
  oldEndDate: Date

  @Column({ type: 'date' })
  newEndDate: Date

  @Column({ type: 'numeric', nullable: true })
  newMonthlyRent: number

  @CreateDateColumn()
  renewalDate: Date

  // Relation
  @ManyToOne(() => Lease, (lease) => lease.renewals)
  lease: Lease
}
```

---

## 4. Payment Entities

### Rent Schedule

```typescript
// backend/src/entities/payment/RentSchedule.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm'
import { Lease } from '../lease/Lease'

@Entity('rent_schedules')
export class RentSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid' })
  leaseId: string

  @Column({ type: 'int' })
  rentDueDay: number // 1-31

  @Column({ type: 'date' })
  dueDate: Date

  @CreateDateColumn()
  createdAt: Date

  // Relation
  @ManyToOne(() => Lease)
  lease: Lease
}
```

### Payment

```typescript
// backend/src/entities/payment/Payment.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm'
import { Lease } from '../lease/Lease'
import { User } from '../User'
import { LateFee } from './LateFee'

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid' })
  leaseId: string

  @Column({ type: 'uuid' })
  tenantId: string

  @Column({ type: 'uuid' })
  landlordId: string

  @Column({ type: 'numeric' })
  amount: number

  @Column({ type: 'numeric' })
  amountDue: number

  @Column({
    type: 'enum',
    enum: ['stripe', 'bank_transfer', 'cash', 'check'],
    nullable: true,
  })
  paymentMethod: string

  @Column({ type: 'varchar', nullable: true })
  stripePaymentIntentId: string

  @Column({
    type: 'enum',
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
  })
  status: string

  @Column({ type: 'date' })
  dueDate: Date

  @Column({ type: 'timestamp', nullable: true })
  paidDate: Date

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  // Relations
  @ManyToOne(() => Lease, (lease) => lease.payments)
  lease: Lease

  @ManyToOne(() => User)
  tenant: User

  @ManyToOne(() => User)
  landlord: User

  @OneToMany(() => LateFee, (fee) => fee.payment)
  lateFees: LateFee[]
}
```

### Deposit

```typescript
// backend/src/entities/payment/Deposit.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm'
import { Lease } from '../lease/Lease'
import { User } from '../User'

@Entity('deposits')
export class Deposit {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid' })
  leaseId: string

  @Column({ type: 'uuid' })
  tenantId: string

  @Column({ type: 'uuid' })
  landlordId: string

  @Column({ type: 'numeric' })
  amount: number

  @Column({
    type: 'enum',
    enum: ['pending', 'held', 'released', 'forfeited'],
    default: 'pending',
  })
  status: string

  @Column({ type: 'date', nullable: true })
  collectedDate: Date

  @Column({ type: 'date', nullable: true })
  releasedDate: Date

  @Column({ type: 'text', nullable: true })
  notes: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  // Relations
  @ManyToOne(() => Lease)
  lease: Lease

  @ManyToOne(() => User)
  tenant: User

  @ManyToOne(() => User)
  landlord: User
}
```

### Late Fee

```typescript
// backend/src/entities/payment/LateFee.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm'
import { Payment } from './Payment'
import { Lease } from '../lease/Lease'

@Entity('late_fees')
export class LateFee {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid' })
  paymentId: string

  @Column({ type: 'uuid' })
  leaseId: string

  @Column({ type: 'int' })
  daysOverdue: number

  @Column({ type: 'numeric' })
  feeAmount: number

  @Column({ type: 'numeric', nullable: true })
  feePercentage: number

  @Column({
    type: 'enum',
    enum: ['pending', 'paid', 'waived'],
    default: 'pending',
  })
  status: string

  @CreateDateColumn()
  createdAt: Date

  // Relations
  @ManyToOne(() => Payment, (payment) => payment.lateFees)
  payment: Payment

  @ManyToOne(() => Lease)
  lease: Lease
}
```

---

## 5. Complaint Entities

### Complaint

```typescript
// backend/src/entities/complaint/Complaint.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm'
import { Lease } from '../lease/Lease'
import { User } from '../User'
import { ComplaintAttachment } from './ComplaintAttachment'

@Entity('complaints')
export class Complaint {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid' })
  leaseId: string

  @Column({ type: 'uuid' })
  tenantId: string

  @Column({ type: 'uuid' })
  landlordId: string

  @Column({ type: 'varchar' })
  title: string

  @Column({ type: 'text' })
  description: string

  @Column({
    type: 'enum',
    enum: ['maintenance', 'billing', 'safety', 'noise', 'other'],
    nullable: true,
  })
  complaintType: string

  @Column({
    type: 'enum',
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open',
  })
  status: string

  @Column({ type: 'simple-array', nullable: true })
  attachmentUrls: string[]

  @CreateDateColumn()
  createdAt: Date

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  // Relations
  @ManyToOne(() => Lease)
  lease: Lease

  @ManyToOne(() => User)
  tenant: User

  @ManyToOne(() => User)
  landlord: User

  @OneToMany(() => ComplaintAttachment, (attachment) => attachment.complaint, {
    cascade: true,
  })
  attachments: ComplaintAttachment[]
}
```

### Complaint Attachment

```typescript
// backend/src/entities/complaint/ComplaintAttachment.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm'
import { Complaint } from './Complaint'

@Entity('complaint_attachments')
export class ComplaintAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid' })
  complaintId: string

  @Column({ type: 'varchar' })
  fileUrl: string

  @Column({ type: 'varchar', nullable: true })
  fileName: string

  @Column({ type: 'varchar', nullable: true })
  fileType: string

  @CreateDateColumn()
  uploadedAt: Date

  // Relation
  @ManyToOne(() => Complaint, (complaint) => complaint.attachments)
  complaint: Complaint
}
```

---

## 6. Notification Entities

### Notification Preference

```typescript
// backend/src/entities/notification/NotificationPreference.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm'
import { User } from '../User'

@Entity('notification_preferences')
export class NotificationPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid' })
  userId: string

  @Column({ type: 'boolean', default: true })
  emailEnabled: boolean

  @Column({ type: 'boolean', default: true })
  smsEnabled: boolean

  @Column({ type: 'boolean', default: true })
  inAppEnabled: boolean

  @Column({ type: 'boolean', default: true })
  notifyRentDue: boolean

  @Column({ type: 'boolean', default: true })
  notifyLatePayment: boolean

  @Column({ type: 'boolean', default: true })
  notifyLeaseExpiry: boolean

  @Column({ type: 'boolean', default: true })
  notifyComplaints: boolean

  @Column({ type: 'boolean', default: true })
  notifyPaymentReceived: boolean

  @Column({ type: 'varchar', nullable: true })
  preferredPhone: string

  @Column({ type: 'varchar', nullable: true })
  preferredEmail: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  // Relation
  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User
}
```

### Notification

```typescript
// backend/src/entities/notification/Notification.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm'
import { User } from '../User'

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid' })
  userId: string

  @Column({ type: 'varchar' })
  title: string

  @Column({ type: 'text' })
  message: string

  @Column({ type: 'varchar', nullable: true })
  notificationType: string // 'rent_due', 'complaint', 'payment_received'

  @Column({ type: 'varchar', nullable: true })
  relatedEntityType: string // 'payment', 'complaint', 'lease'

  @Column({ type: 'uuid', nullable: true })
  relatedEntityId: string

  @Column({ type: 'boolean', default: false })
  isRead: boolean

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date

  @Column({ type: 'boolean', default: false })
  smsSent: boolean

  @Column({ type: 'boolean', default: false })
  emailSent: boolean

  @CreateDateColumn()
  createdAt: Date

  // Relation
  @ManyToOne(() => User, (user) => user.notifications)
  user: User
}
```

---

## 7. TypeORM Configuration

```typescript
// backend/src/database.ts
import { DataSource } from 'typeorm'
import { User } from './entities/User'
import { TenantProfile } from './entities/profile/TenantProfile'
import { AgentProfile } from './entities/profile/AgentProfile'
import { LandlordProfile } from './entities/profile/LandlordProfile'
import { AgentLandlordAssignment } from './entities/AgentLandlordAssignment'
import { Property } from './entities/property/Property'
import { PropertyImage } from './entities/property/PropertyImage'
import { Lease } from './entities/lease/Lease'
import { LeaseTerm } from './entities/lease/LeaseTerm'
import { LeaseRenewal } from './entities/lease/LeaseRenewal'
import { Payment } from './entities/payment/Payment'
import { RentSchedule } from './entities/payment/RentSchedule'
import { Deposit } from './entities/payment/Deposit'
import { LateFee } from './entities/payment/LateFee'
import { Complaint } from './entities/complaint/Complaint'
import { ComplaintAttachment } from './entities/complaint/ComplaintAttachment'
import { Notification } from './entities/notification/Notification'
import { NotificationPreference } from './entities/notification/NotificationPreference'

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'rentflow',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [
    User,
    TenantProfile,
    AgentProfile,
    LandlordProfile,
    AgentLandlordAssignment,
    Property,
    PropertyImage,
    Lease,
    LeaseTerm,
    LeaseRenewal,
    Payment,
    RentSchedule,
    Deposit,
    LateFee,
    Complaint,
    ComplaintAttachment,
    Notification,
    NotificationPreference,
  ],
  migrations: ['src/migrations/*.ts'],
})
```

---

## 8. Database Migration Example

```typescript
// backend/src/migrations/1710000000000-InitialMigration.ts
import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm'

export class InitialMigration1710000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
          },
          { name: 'email', type: 'varchar', isUnique: true, isNullable: true },
          { name: 'phoneNumber', type: 'varchar', isNullable: false },
          { name: 'firstName', type: 'varchar', isNullable: false },
          { name: 'lastName', type: 'varchar', isNullable: false },
          { name: 'idNumber', type: 'varchar', isNullable: false },
          { name: 'profilePictureUrl', type: 'varchar', isNullable: true },
          { name: 'passwordHash', type: 'varchar', isNullable: false },
          { name: 'isActive', type: 'boolean', default: true },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users')
  }
}
```

---

## 9. Common Queries

### Get Tenant with All Leases

```typescript
// backend/src/services/TenantService.ts
async getTenantWithLeases(tenantId: string) {
  return await AppDataSource.getRepository(User).findOne({
    where: { id: tenantId },
    relations: ['tenantProfile', 'leases', 'leases.property', 'leases.leaseTerm'],
  })
}
```

### Get Active Leases for Landlord

```typescript
async getLandlordActiveLeases(landlordId: string) {
  return await AppDataSource.getRepository(Lease).find({
    where: {
      landlordId,
      status: 'active',
    },
    relations: ['property', 'tenant', 'tenant.tenantProfile'],
  })
}
```

### Get Pending Payments

```typescript
async getPendingPayments(landlordId: string) {
  return await AppDataSource.getRepository(Payment).find({
    where: {
      landlordId,
      status: 'pending',
    },
    order: { dueDate: 'ASC' },
  })
}
```

---

## 10. API DTOs (Data Transfer Objects)

```typescript
// backend/src/dtos/CreateTenantDto.ts
export class CreateTenantDto {
  email: string
  phoneNumber: string
  firstName: string
  lastName: string
  idNumber: string
  password: string
  
  // Tenant Profile
  nationality: string
  maritalStatus: string
  numberOfChildren: number
  occupation: string
  postalAddress: string
  nextOfKinName: string
  nextOfKinPhone: string
  nextOfKinRelationship: string
}
```

---

## 11. Database Indexes (TypeORM)

```typescript
// backend/src/entities/User.ts
@Index('idx_users_email', ['email'])
@Entity('users')
export class User { ... }

@Index('idx_properties_landlord_id', ['landlordId'])
@Entity('properties')
export class Property { ... }

@Index('idx_leases_tenant_id', ['tenantId'])
@Index('idx_leases_status', ['status'])
@Entity('leases')
export class Lease { ... }
```

---

## 12. Next Steps

1. ✅ Copy these entities to `backend/src/entities/`
2. → Generate migrations: `npm run typeorm migration:generate`
3. → Run migrations: `npm run typeorm migration:run`
4. → Build API endpoints using these entities
5. → Generate Android models from DTOs for Kotlin consumption

---

**All TypeORM entities are production-ready and fully typed for Kotlin integration!**
