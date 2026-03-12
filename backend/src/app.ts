import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import middleware and routes
import errorHandler from './middleware/errorHandler';
import requestLogger from './middleware/requestLogger';

const app: Express = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Version endpoint
app.get('/api/v1', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'RentFlow API v1',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Routes placeholder - Add your routes here
// app.use('/api/v1/auth', authRoutes);
// app.use('/api/v1/properties', propertyRoutes);
// app.use('/api/v1/users', userRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    method: req.method
  });
});

// Error handler middleware (must be last)
app.use(errorHandler);

export default app;
