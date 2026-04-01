import 'reflect-metadata';
import dotenv from 'dotenv';
import app from './app';
import { initializeDatabase } from './config/database';

// Load environment variables
dotenv.config();

const PORT = parseInt(process.env.PORT || '3001', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';

async function startServer() {
  try {
    console.log(`[${NODE_ENV.toUpperCase()}] Starting RentFlow Backend Server...`);

    // Initialize database connection
    console.log('📡 Initializing database connection...');
    await initializeDatabase();
    console.log('✅ Database connection successful');

    // Start Express server - bind to 0.0.0.0 for Railway/Docker
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
      console.log(`📝 API Documentation: http://0.0.0.0:${PORT}/api/v1`);
      console.log(`💚 Health Check: http://0.0.0.0:${PORT}/health`);
      console.log(`\n✨ Ready to accept requests`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n⏹️  SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n⏹️  SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Start the server
startServer();
