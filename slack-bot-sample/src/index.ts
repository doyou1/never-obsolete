import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';

import { logger } from './utils/logger';
import { config } from './config/environment';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestIdMiddleware, requestLoggerMiddleware } from './middleware/requestLogger';
import routes from './routes';

const app = express();

// Trust proxy for accurate client IP detection
app.set('trust proxy', 1);

// Request ID and logging middleware (must be first)
app.use(requestIdMiddleware);
app.use(requestLoggerMiddleware);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: config.cors.allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID'],
}));

// HTTP logging middleware (using morgan for access logs)
app.use(morgan('combined', {
  stream: { write: (message: string) => logger.info(message.trim()) },
  skip: (req) => req.url === '/health/ping', // Skip ping logs to reduce noise
}));

// Parsing middleware
app.use(compression());
app.use(express.json({
  limit: '10mb',
  type: ['application/json', 'application/vnd.api+json']
}));
app.use(express.urlencoded({
  extended: true,
  limit: '10mb'
}));

// API routes
app.use('/api/v1', routes);

// Legacy route redirects for backward compatibility
app.use('/health', (_req, res) => res.redirect('/api/v1/health'));
app.use('/', routes);

// Error handling middleware (must be after all routes)
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = config.port;

const server = app.listen(PORT, () => {
  logger.info(`🚀 GitHub Flow Analyzer server running on port ${PORT}`);
  logger.info(`🌍 Environment: ${config.env}`);
  logger.info(`📊 Health check: http://localhost:${PORT}/api/v1/health`);
  logger.info(`📋 API Documentation: http://localhost:${PORT}/api/v1/`);
  logger.info(`🎯 Ready to process analysis requests`);
});

// Graceful shutdown handler
const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      // Close database connections
      const { db } = await import('./database/connection');
      await db.close();
      logger.info('Database connections closed');
    } catch (error) {
      logger.error('Error closing database connections:', error);
    }

    try {
      // Close Redis connections
      const { cache } = await import('./cache/redis');
      await cache.disconnect();
      logger.info('Redis connections closed');
    } catch (error) {
      logger.error('Error closing Redis connections:', error);
    }

    logger.info('Graceful shutdown completed');
    process.exit(0);
  });

  // Force exit after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

export default app;