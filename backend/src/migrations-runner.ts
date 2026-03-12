import { AppDataSource } from './config/database';

async function runMigrations() {
  try {
    console.log('📡 Initializing database connection...');
    await AppDataSource.initialize();
    
    console.log('🔄 Running pending migrations...');
    const migrations = await AppDataSource.runMigrations();
    
    if (migrations.length === 0) {
      console.log('✅ Database is already up to date!');
    } else {
      console.log(`✅ Successfully ran ${migrations.length} migration(s)!`);
    }
    
    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
