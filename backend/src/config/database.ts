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
import { PropertyRoomTypePricing } from '../entities/property/PropertyRoomTypePricing';
import { PropertyImage } from '../entities/property/PropertyImage';
import { PropertyFloor } from '../entities/property/PropertyFloor';
import { PropertyUnit } from '../entities/property/PropertyUnit';
import { Lease } from '../entities/lease/Lease';
import { LeaseRenewal } from '../entities/lease/LeaseRenewal';
import { LeaseTerm } from '../entities/lease/LeaseTerm';
import { DepositBreakdown } from '../entities/lease/DepositBreakdown';
import { Payment } from '../entities/payment/Payment';
import { Deposit } from '../entities/payment/Deposit';
import { LateFee } from '../entities/payment/LateFee';
import { RentSchedule } from '../entities/payment/RentSchedule';
import { WaterMeterReading } from '../entities/payment/WaterMeterReading';
import { MonthlyRentBreakdown } from '../entities/payment/MonthlyRentBreakdown';
import { Complaint } from '../entities/complaint/Complaint';
import { ComplaintAttachment } from '../entities/complaint/ComplaintAttachment';
import { ComplaintReply } from '../entities/complaint/ComplaintReply';
import { Notification } from '../entities/notification/Notification';
import { NotificationPreference } from '../entities/notification/NotificationPreference';
import { AgentTransaction } from '../entities/AgentTransaction';

dotenv.config();

// Parse DATABASE_URL if available (Railway production)
const getDatabaseConfig = () => {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (databaseUrl) {
    // Parse connection string: postgresql://user:password@host:port/database
    try {
      const url = new URL(databaseUrl);
      return {
        host: url.hostname,
        port: parseInt(url.port || '5432'),
        username: url.username,
        password: url.password,
        database: url.pathname.slice(1), // remove leading /
      };
    } catch (error) {
      console.warn('Failed to parse DATABASE_URL, falling back to individual variables');
    }
  }
  
  // Fallback: use Railway PGHOST/PGUSER format or traditional DB_ format
  return {
    host: process.env.PGHOST || process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.PGPORT || process.env.DB_PORT || '5432'),
    username: process.env.PGUSER || process.env.DB_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD || 'postgres',
    database: process.env.POSTGRES_DB || process.env.DB_NAME || 'rentflow',
  };
};

const dbConfig = getDatabaseConfig();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: dbConfig.host,
  port: dbConfig.port,
  username: dbConfig.username,
  password: dbConfig.password,
  database: dbConfig.database,
  // Use synchronize mode in all environments (RentFlow doesn't use migrations)
  synchronize: true,
  logging: process.env.NODE_ENV === 'development',
  entities: [
    User,
    TenantProfile,
    AgentProfile,
    LandlordProfile,
    AgentLandlordAssignment,
    Property,
    PropertyRoomTypePricing,
    PropertyImage,
    PropertyFloor,
    PropertyUnit,
    Lease,
    LeaseRenewal,
    LeaseTerm,
    DepositBreakdown,
    Payment,
    Deposit,
    LateFee,
    RentSchedule,
    WaterMeterReading,
    MonthlyRentBreakdown,
    Complaint,
    ComplaintAttachment,
    ComplaintReply,
    Notification,
    NotificationPreference,
    AgentTransaction,
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
      console.log('🔄 Schema synchronized via TypeORM (migrations not used)');
      
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
