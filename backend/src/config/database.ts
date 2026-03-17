import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import path from 'path';

// Import all entities
import { User } from '../entities/User';
import { TenantProfile } from '../entities/profile/TenantProfile';
import { AgentProfile } from '../entities/profile/AgentProfile';
import { LandlordProfile } from '../entities/profile/LandlordProfile';
import { AgentLandlordAssignment } from '../entities/AgentLandlordAssignment';
import { Property } from '../entities/property/Property';
import { PropertyImage } from '../entities/property/PropertyImage';
import { Lease } from '../entities/lease/Lease';
import { LeaseRenewal } from '../entities/lease/LeaseRenewal';
import { LeaseTerm } from '../entities/lease/LeaseTerm';
import { Payment } from '../entities/payment/Payment';
import { Deposit } from '../entities/payment/Deposit';
import { LateFee } from '../entities/payment/LateFee';
import { RentSchedule } from '../entities/payment/RentSchedule';
import { Complaint } from '../entities/complaint/Complaint';
import { ComplaintAttachment } from '../entities/complaint/ComplaintAttachment';
import { Notification } from '../entities/notification/Notification';
import { NotificationPreference } from '../entities/notification/NotificationPreference';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
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
    LeaseRenewal,
    LeaseTerm,
    Payment,
    Deposit,
    LateFee,
    RentSchedule,
    Complaint,
    ComplaintAttachment,
    Notification,
    NotificationPreference,
  ],
  migrations: [path.join(__dirname, '../migrations/**/*.{ts,js}')],
  subscribers: [path.join(__dirname, '../subscribers/**/*.{ts,js}')],
  ssl: process.env.DB_SSL === 'true' ? true : false
});

export async function initializeDatabase() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Database initialized successfully');
      
      // Run pending migrations in production
      if (process.env.NODE_ENV === 'production') {
        try {
          console.log('🔄 Running pending migrations...');
          const migrations = await AppDataSource.runMigrations();
          if (migrations.length > 0) {
            console.log(`✅ Successfully ran ${migrations.length} migration(s)!`);
          }
          
          // Seed admin user if needed
          console.log('🌱 Seeding initial data...');
          const userRepo = AppDataSource.getRepository(User);
          const existingAdmin = await userRepo.findOneBy({ email: 'admin@rentflow.com' });
          
          if (!existingAdmin) {
            const bcrypt = await import('bcryptjs');
            const passwordHash = await bcrypt.hash('admin123', 10);
            const admin = userRepo.create({
              email: 'admin@rentflow.com',
              phoneNumber: '0000000000',
              firstName: 'System',
              lastName: 'Admin',
              idNumber: 'ADMIN-0001',
              passwordHash,
              role: 'admin',
              isActive: true
            });
            await userRepo.save(admin);
            console.log('✅ System admin user created: admin@rentflow.com / admin123');
          } else {
            console.log('✅ Admin user already exists');
          }
        } catch (seedError) {
          console.warn('⚠️  Seed execution warning:', seedError);
        }
      }
    }
    return AppDataSource;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

export function getDatabase() {
  if (!AppDataSource.isInitialized) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return AppDataSource;
}
