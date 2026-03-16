import { AppDataSource } from './config/database';
import { User } from './entities/User';
import bcrypt from 'bcryptjs';

async function seedAdmin() {
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(User);
  const existingAdmin = await userRepo.findOneBy({ email: 'admin@rentflow.com' });
  if (existingAdmin) {
    console.log('Admin user already exists.');
    await AppDataSource.destroy();
    return;
  }

  const passwordHash = await bcrypt.hash('admin123', 10);
  const admin = userRepo.create({
    email: 'admin@rentflow.com',
    phoneNumber: '0000000000',
    firstName: 'System',
    lastName: 'Admin',
    idNumber: 'ADMIN-0001',
    passwordHash,
    isActive: true
  });
  await userRepo.save(admin);
  console.log('System admin user created: admin@rentflow.com / admin123');
  await AppDataSource.destroy();
}

seedAdmin().catch(e => {
  console.error('Seeding failed:', e);
  process.exit(1);
});
