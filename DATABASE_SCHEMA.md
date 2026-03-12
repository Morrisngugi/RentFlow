# RentFlow Supabase Database Schema

## Overview
This schema supports a multi-tenant property rental system with flexible lease management, payment tracking, and a complaint/notification system. Built for Supabase (PostgreSQL).

The schema uses a **role-based profile pattern** where:
- **`users`** table stores common data (phone, ID, email)
- **`tenant_profiles`** stores tenant-specific data (marital status, occupation, next of kin, etc.)
- **`agent_profiles`** stores agent office information
- **`landlord_profiles`** stores landlord banking and business details

This approach allows one physical user to potentially have multiple roles while keeping role-specific data organized.

---

## 1. Authentication & Users

### `users` (Extends Supabase Auth)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email TEXT UNIQUE,
  phone_number TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  id_number TEXT NOT NULL, -- National ID / Passport
  profile_picture_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can only view their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);
```

### `tenant_profiles` (Tenant-specific data)
```sql
CREATE TABLE tenant_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Personal Information
  nationality TEXT,
  marital_status TEXT CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed')),
  number_of_children INT DEFAULT 0,
  occupation TEXT,
  
  -- Address
  postal_address TEXT,
  
  -- Next of Kin
  next_of_kin_name TEXT,
  next_of_kin_phone TEXT,
  next_of_kin_relationship TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE tenant_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view own profile" ON tenant_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Tenants can update own profile" ON tenant_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Landlords can view tenant profiles for leases" ON tenant_profiles
  FOR SELECT USING (
    user_id IN (
      SELECT tenant_id FROM leases WHERE landlord_id = auth.uid()
    )
  );
```

### `agent_profiles` (Agent-specific data)
```sql
CREATE TABLE agent_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Agency Information
  office_name TEXT NOT NULL,
  office_location TEXT NOT NULL,
  
  -- Agent Status
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE agent_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view own profile" ON agent_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Landlords can view agent profiles" ON agent_profiles
  FOR SELECT USING (
    user_id IN (
      SELECT agent_id FROM agent_landlord_assignments 
      WHERE landlord_id = auth.uid()
    )
  );
```

### `landlord_profiles` (Landlord-specific data)
```sql
CREATE TABLE landlord_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Address Information
  physical_address TEXT NOT NULL,
  
  -- Bank Details (for rent deposits)
  bank_name TEXT,
  bank_account_number TEXT,
  bank_account_holder TEXT,
  
  -- Business Information
  company_name TEXT,
  tax_id TEXT,
  
  -- Preferences
  default_late_fee_percentage DECIMAL(5, 2) DEFAULT 5.00,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE landlord_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Landlords can view own profile" ON landlord_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Landlords can update own profile" ON landlord_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Agents can view landlord profiles" ON landlord_profiles
  FOR SELECT USING (
    user_id IN (
      SELECT landlord_id FROM agent_landlord_assignments 
      WHERE agent_id = auth.uid()
    )
  );
```

### `user_roles` (Define user type)
```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('landlord', 'agent', 'tenant')),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, role)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);
```

### `agent_landlord_assignments`
```sql
CREATE TABLE agent_landlord_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(agent_id, landlord_id)
);

ALTER TABLE agent_landlord_assignments ENABLE ROW LEVEL SECURITY;

-- Agents can view their assignments
CREATE POLICY "Agents can view their assignments" ON agent_landlord_assignments
  FOR SELECT USING (auth.uid() = agent_id);

-- Landlords can view their agents
CREATE POLICY "Landlords can view assigned agents" ON agent_landlord_assignments
  FOR SELECT USING (auth.uid() = landlord_id);
```

---

## 2. Properties

### `properties`
```sql
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "Apartment 3B"
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT,
  country TEXT DEFAULT 'Kenya',
  bedrooms INT,
  bathrooms INT,
  sqft INT,
  property_type TEXT CHECK (property_type IN ('apartment', 'house', 'commercial')),
  description TEXT,
  monthly_rent DECIMAL(10, 2) NOT NULL,
  deposit_amount DECIMAL(10, 2), -- Security deposit expected
  utilities_included TEXT[], -- Array of utilities included
  image_urls TEXT[], -- Stored in Supabase Storage
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Landlords can view their own properties
CREATE POLICY "Landlords can view own properties" ON properties
  FOR SELECT USING (auth.uid() = landlord_id);

-- Agents can view properties of their assigned landlords
CREATE POLICY "Agents can view assigned landlord properties" ON properties
  FOR SELECT USING (
    landlord_id IN (
      SELECT landlord_id FROM agent_landlord_assignments 
      WHERE agent_id = auth.uid()
    )
  );

-- Tenants can view properties they're leasing or available properties
CREATE POLICY "Tenants can view leased/available properties" ON properties
  FOR SELECT USING (
    is_available = TRUE OR 
    id IN (SELECT property_id FROM leases WHERE tenant_id = auth.uid() AND status = 'active')
  );
```

---

## 3. Leases & Lease Terms

### `lease_terms` (Reusable lease templates)
```sql
CREATE TABLE lease_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- e.g., "12-Month Fixed", "Month-to-Month"
  duration_months INT, -- NULL for month-to-month
  auto_renewal BOOLEAN DEFAULT FALSE,
  notice_period_days INT DEFAULT 30, -- Days to notice before termination
  created_at TIMESTAMP DEFAULT NOW()
);

-- Public read-only
ALTER TABLE lease_terms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view lease terms" ON lease_terms FOR SELECT USING (TRUE);
```

### `leases`
```sql
CREATE TABLE leases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lease_term_id UUID NOT NULL REFERENCES lease_terms(id),
  
  -- Lease financial terms
  monthly_rent DECIMAL(10, 2) NOT NULL,
  garbage_amount DECIMAL(10, 2) DEFAULT 0, -- Monthly garbage collection fee
  water_unit_cost DECIMAL(10, 2) DEFAULT 0, -- Cost per unit of water
  security_deposit DECIMAL(10, 2) DEFAULT 0,
  deposit_paid BOOLEAN DEFAULT FALSE,
  deposit_paid_date DATE,
  
  -- Lease dates
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'expired', 'terminated')),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_dates CHECK (end_date > start_date)
);

ALTER TABLE leases ENABLE ROW LEVEL SECURITY;

-- Landlords can view leases for their properties
CREATE POLICY "Landlords can view own leases" ON leases
  FOR SELECT USING (auth.uid() = landlord_id);

-- Agents can view leases of their assigned landlords
CREATE POLICY "Agents can view assigned leases" ON leases
  FOR SELECT USING (
    landlord_id IN (
      SELECT landlord_id FROM agent_landlord_assignments 
      WHERE agent_id = auth.uid()
    )
  );

-- Tenants can view their own leases
CREATE POLICY "Tenants can view own leases" ON leases
  FOR SELECT USING (auth.uid() = tenant_id);
```

### `lease_renewals` (Track renewal history)
```sql
CREATE TABLE lease_renewals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  old_end_date DATE NOT NULL,
  new_end_date DATE NOT NULL,
  new_monthly_rent DECIMAL(10, 2),
  renewal_date TIMESTAMP DEFAULT NOW()
);

ALTER TABLE lease_renewals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View renewals for leases you can see" ON lease_renewals
  FOR SELECT USING (
    lease_id IN (
      SELECT id FROM leases WHERE 
        auth.uid() = landlord_id OR 
        auth.uid() = tenant_id OR
        landlord_id IN (SELECT landlord_id FROM agent_landlord_assignments WHERE agent_id = auth.uid())
    )
  );
```

---

## 4. Rent Payments & Financial Tracking

### `rent_schedules` (Recurring payment schedule)
```sql
CREATE TABLE rent_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  rent_due_day INT CHECK (rent_due_day BETWEEN 1 AND 31) DEFAULT 1,
  due_date DATE NOT NULL, -- First due date
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE rent_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View rent schedules for accessible leases" ON rent_schedules
  FOR SELECT USING (
    lease_id IN (
      SELECT id FROM leases WHERE 
        auth.uid() = landlord_id OR 
        auth.uid() = tenant_id OR
        landlord_id IN (SELECT landlord_id FROM agent_landlord_assignments WHERE agent_id = auth.uid())
    )
  );
```

### `payments` (Individual rent payments)
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Payment details
  amount DECIMAL(10, 2) NOT NULL,
  amount_due DECIMAL(10, 2) NOT NULL, -- Original amount owed
  payment_method TEXT CHECK (payment_method IN ('stripe', 'bank_transfer', 'cash', 'check')),
  stripe_payment_intent_id TEXT, -- Link to Stripe for tracking
  
  -- Payment status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  
  -- Dates
  due_date DATE NOT NULL,
  paid_date TIMESTAMP, -- When payment was received
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Landlords can view payments for their properties
CREATE POLICY "Landlords can view own payments" ON payments
  FOR SELECT USING (auth.uid() = landlord_id);

-- Agents can view payments of their assigned landlords
CREATE POLICY "Agents can view assigned payments" ON payments
  FOR SELECT USING (
    landlord_id IN (
      SELECT landlord_id FROM agent_landlord_assignments 
      WHERE agent_id = auth.uid()
    )
  );

-- Tenants can view their own payments
CREATE POLICY "Tenants can view own payments" ON payments
  FOR SELECT USING (auth.uid() = tenant_id);
```

### `late_fees` (Track late payment penalties)
```sql
CREATE TABLE late_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  
  -- Fee calculation
  days_overdue INT,
  fee_amount DECIMAL(10, 2) NOT NULL,
  fee_percentage DECIMAL(5, 2), -- e.g., 5.00 for 5%
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'waived')),
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE late_fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View late fees for accessible payments" ON late_fees
  FOR SELECT USING (
    lease_id IN (
      SELECT id FROM leases WHERE 
        auth.uid() = landlord_id OR 
        auth.uid() = tenant_id OR
        landlord_id IN (SELECT landlord_id FROM agent_landlord_assignments WHERE agent_id = auth.uid())
    )
  );
```

### `deposits` (Security deposit tracking)
```sql
CREATE TABLE deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Deposit details
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'held', 'released', 'forfeited')),
  
  -- Dates
  collected_date DATE,
  released_date DATE,
  
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Landlords can view own deposits" ON deposits
  FOR SELECT USING (auth.uid() = landlord_id);

CREATE POLICY "Agents can view assigned deposits" ON deposits
  FOR SELECT USING (
    landlord_id IN (
      SELECT landlord_id FROM agent_landlord_assignments 
      WHERE agent_id = auth.uid()
    )
  );

CREATE POLICY "Tenants can view own deposits" ON deposits
  FOR SELECT USING (auth.uid() = tenant_id);
```

---

## 5. Complaints & Notifications

### `complaints` (Tenant complaints/issues)
```sql
CREATE TABLE complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Complaint details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  complaint_type TEXT CHECK (complaint_type IN ('maintenance', 'billing', 'safety', 'noise', 'other')),
  
  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  
  -- Attachments
  attachment_urls TEXT[],
  
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- Tenants can create and view their complaints
CREATE POLICY "Tenants can manage own complaints" ON complaints
  FOR ALL USING (auth.uid() = tenant_id);

-- Landlords can view complaints for their properties
CREATE POLICY "Landlords can view own complaints" ON complaints
  FOR SELECT USING (auth.uid() = landlord_id);

-- Agents can view complaints of their assigned landlords
CREATE POLICY "Agents can view assigned complaints" ON complaints
  FOR SELECT USING (
    landlord_id IN (
      SELECT landlord_id FROM agent_landlord_assignments 
      WHERE agent_id = auth.uid()
    )
  );
```

### `notification_preferences` (User notification settings)
```sql
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Channel preferences
  email_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT TRUE,
  in_app_enabled BOOLEAN DEFAULT TRUE,
  
  -- Notification types to subscribe to
  notify_rent_due BOOLEAN DEFAULT TRUE,
  notify_late_payment BOOLEAN DEFAULT TRUE,
  notify_lease_expiry BOOLEAN DEFAULT TRUE,
  notify_complaints BOOLEAN DEFAULT TRUE,
  notify_payment_received BOOLEAN DEFAULT TRUE,
  
  -- SMS/Email settings
  preferred_phone TEXT,
  preferred_email TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own preferences" ON notification_preferences
  FOR ALL USING (auth.uid() = user_id);
```

### `notifications` (In-app notification log)
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Notification content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT, -- e.g., 'rent_due', 'complaint', 'payment_received'
  related_entity_type TEXT, -- e.g., 'payment', 'complaint', 'lease'
  related_entity_id UUID,
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  
  -- Delivery status
  sms_sent BOOLEAN DEFAULT FALSE,
  email_sent BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can mark own notifications as read" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);
```

---

## 6. Indexes for Performance

```sql
-- Users & Auth
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);

-- Profiles
CREATE INDEX idx_tenant_profiles_user_id ON tenant_profiles(user_id);
CREATE INDEX idx_agent_profiles_user_id ON agent_profiles(user_id);
CREATE INDEX idx_landlord_profiles_user_id ON landlord_profiles(user_id);

-- Properties
CREATE INDEX idx_properties_landlord_id ON properties(landlord_id);
CREATE INDEX idx_properties_available ON properties(is_available);

-- Leases
CREATE INDEX idx_leases_property_id ON leases(property_id);
CREATE INDEX idx_leases_tenant_id ON leases(tenant_id);
CREATE INDEX idx_leases_landlord_id ON leases(landlord_id);
CREATE INDEX idx_leases_status ON leases(status);

-- Payments
CREATE INDEX idx_payments_lease_id ON payments(lease_id);
CREATE INDEX idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX idx_payments_landlord_id ON payments(landlord_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_due_date ON payments(due_date);

-- Deposits
CREATE INDEX idx_deposits_lease_id ON deposits(lease_id);
CREATE INDEX idx_deposits_tenant_id ON deposits(tenant_id);
CREATE INDEX idx_deposits_status ON deposits(status);

-- Complaints
CREATE INDEX idx_complaints_lease_id ON complaints(lease_id);
CREATE INDEX idx_complaints_tenant_id ON complaints(tenant_id);
CREATE INDEX idx_complaints_landlord_id ON complaints(landlord_id);
CREATE INDEX idx_complaints_status ON complaints(status);

-- Notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
```

---

## 7. Key Design Decisions

| Decision | Reason |
|----------|--------|
| **UUID for PK** | Better for distributed systems and Supabase |
| **RLS Policies** | Enforce security at DB level, not app level |
| **Soft vs Hard Delete** | Hard deletes with CASCADE to maintain referential integrity |
| **Role-Specific Profiles** | Keeps role-specific data organized; allows users to have multiple roles |
| **Payment Status** | Track pending/completed/failed to support reconciliation |
| **Lease Terms Table** | Reusable templates to enforce consistent terms |
| **Notifications Table** | In-app record of all notifications; SMS/Email delivery tracked separately |
| **Deposits Separate** | Distinct lifecycle from rent payments (held, released, forfeited) |
| **Complaint Types** | Restrict to known types for analytics and categorization |
| **Garbage & Water Costs** | Per-lease based utility charges for accurate billing |
| **Tenant Profile Fields** | Captures next of kin, marital status, occupation for landlord verification |
| **Landlord Bank Details** | Stores for automated rent transfers (future enhancement) |

---

## 8. Data Collection by Role

### Tenant Registration Flow

**Step 1: Basic Account (Universal)**
```json
{
  "email": "tenant@example.com",
  "phone_number": "+254712345678",
  "first_name": "John",
  "last_name": "Doe",
  "id_number": "12345678"
}
```
→ Stored in: `users` table

**Step 2: Tenant-Specific Profile**
```json
{
  "nationality": "Kenyan",
  "marital_status": "married",
  "number_of_children": 2,
  "occupation": "Software Engineer",
  "postal_address": "P.O. Box 1234, Nairobi",
  "next_of_kin_name": "Jane Doe",
  "next_of_kin_phone": "+254712345679",
  "next_of_kin_relationship": "Spouse"
}
```
→ Stored in: `tenant_profiles` table

---

### Agent Registration Flow

**Step 1: Basic Account (Universal)**
```json
{
  "email": "agent@rentflow.com",
  "phone_number": "+254712345680",
  "first_name": "Alice",
  "last_name": "Smith",
  "id_number": "87654321"
}
```
→ Stored in: `users` table

**Step 2: Agent-Specific Profile**
```json
{
  "office_name": "RentFlow Properties Ltd",
  "office_location": "Westlands, Nairobi",
  "is_active": true
}
```
→ Stored in: `agent_profiles` table

---

### Landlord Registration Flow

**Step 1: Basic Account (Universal)**
```json
{
  "email": "landlord@example.com",
  "phone_number": "+254712345681",
  "first_name": "Bob",
  "last_name": "Johnson",
  "id_number": "11223344"
}
```
→ Stored in: `users` table

**Step 2: Landlord-Specific Profile**
```json
{
  "physical_address": "123 Main Street, Nairobi",
  "bank_name": "Kenya Commercial Bank",
  "bank_account_number": "1234567890",
  "bank_account_holder": "Bob Johnson",
  "company_name": "The Johnson Properties",
  "tax_id": "A012345678",
  "default_late_fee_percentage": 5.00
}
```
→ Stored in: `landlord_profiles` table

---

### Lease-Level Data (Per Tenant per Property)

When creating a lease, these amounts are collected:

```json
{
  "monthly_rent": 15000,        // Ksh
  "garbage_amount": 500,        // Monthly garbage fee
  "water_unit_cost": 50,        // Cost per unit of water
  "security_deposit": 45000,    // Optional, 3x rent
  "start_date": "2026-03-15",
  "end_date": "2027-03-14"
}
```
→ Stored in: `leases` table

---

### Sample Data: Complete Tenant Flow

**User Registration:**
```sql
INSERT INTO users (id, email, phone_number, first_name, last_name, id_number)
VALUES ('uuid-1', 'john@example.com', '+254712345678', 'John', 'Doe', '12345678');

INSERT INTO user_roles (user_id, role)
VALUES ('uuid-1', 'tenant');
```

**Tenant Profile:**
```sql
INSERT INTO tenant_profiles (
  user_id, nationality, marital_status, number_of_children, 
  occupation, postal_address, next_of_kin_name, next_of_kin_phone, next_of_kin_relationship
)
VALUES (
  'uuid-1', 'Kenyan', 'married', 2, 'Software Engineer',
  'P.O. Box 1234, Nairobi', 'Jane Doe', '+254712345679', 'Spouse'
);
```

**Lease Creation:**
```sql
INSERT INTO leases (
  property_id, tenant_id, landlord_id, lease_term_id,
  monthly_rent, garbage_amount, water_unit_cost, security_deposit,
  start_date, end_date, status
)
VALUES (
  'prop-uuid', 'uuid-1', 'landlord-uuid', 'term-uuid',
  15000, 500, 50, 45000,
  '2026-03-15', '2027-03-14', 'active'
);
```

---

## 9. Common Queries

### Get all active leases for a landlord
```sql
SELECT l.*, p.name AS property_name, u.first_name, u.last_name
FROM leases l
JOIN properties p ON l.property_id = p.id
JOIN users u ON l.tenant_id = u.id
WHERE l.landlord_id = ? AND l.status = 'active'
ORDER BY l.start_date DESC;
```

### Get pending payments (not yet paid)
```sql
SELECT * FROM payments
WHERE status = 'pending' AND due_date <= NOW()
ORDER BY due_date ASC;
```

### Get tenant's all properties
```sql
SELECT DISTINCT p.*
FROM leases l
JOIN properties p ON l.property_id = p.id
WHERE l.tenant_id = ? AND l.status = 'active';
```

### Get complaints by status for a landlord
```sql
SELECT c.*, p.name AS property_name, u.first_name, u.last_name
FROM complaints c
JOIN leases l ON c.lease_id = l.id
JOIN properties p ON l.property_id = p.id
JOIN users u ON c.tenant_id = u.id
WHERE l.landlord_id = ? AND c.status = ?
ORDER BY c.created_at DESC;
```

### Calculate tenant rent history
```sql
SELECT 
  l.id AS lease_id,
  p.name AS property,
  COUNT(CASE WHEN payments.status = 'completed' THEN 1 END) AS paid_months,
  COUNT(CASE WHEN payments.status = 'pending' THEN 1 END) AS pending_months,
  SUM(CASE WHEN payments.status = 'pending' THEN payments.amount_due ELSE 0 END) AS total_owed
FROM leases l
JOIN properties p ON l.property_id = p.id
LEFT JOIN payments ON l.id = payments.lease_id
WHERE l.tenant_id = ?
GROUP BY l.id, p.name;
```

---

## 10. Setup Instructions for Supabase

1. **Create Tables**: Copy SQL from each section into Supabase SQL Editor
2. **Enable RLS**: Already included in each table definition
3. **Create Indexes**: Copy all indexes to optimize queries
4. **Verify Policies**: Test RLS policies with different role logins
5. **Storage Bucket**: Create a `property-images` bucket in Supabase Storage for images and attachments

---

## 11. Next Steps

1. ✅ Database schema complete
2. → API Client Setup (TanStack Query + Supabase JS client)
3. → Authentication Flow (RBAC with Supabase Auth)
4. → Stripe Integration (Payment processing)
5. → Notification Service (Email/SMS via SendGrid/Twilio)
