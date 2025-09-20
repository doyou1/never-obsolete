import { Router, Request, Response } from 'express';
import { db } from '../database/connection';
import { cache } from '../cache/redis';
import { config } from '../config/environment';

const router = Router();

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  services: {
    database: {
      status: 'up' | 'down';
      responseTime?: number;
      details?: any;
    };
    redis: {
      status: 'up' | 'down';
      responseTime?: number;
      details?: any;
    };
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
}

// Basic health check
router.get('/', async (_req: Request, res: Response) => {
  const healthStatus: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: config.env,
    uptime: process.uptime(),
    services: {
      database: { status: 'down' },
      redis: { status: 'down' },
    },
    memory: {
      used: 0,
      total: 0,
      percentage: 0,
    },
  };

  // Check database
  try {
    const dbStart = Date.now();
    const isDbHealthy = await db.testConnection();
    const dbResponseTime = Date.now() - dbStart;

    if (isDbHealthy) {
      const poolStatus = await db.getPoolStatus();
      healthStatus.services.database = {
        status: 'up',
        responseTime: dbResponseTime,
        details: poolStatus,
      };
    } else {
      healthStatus.services.database.status = 'down';
      healthStatus.status = 'degraded';
    }
  } catch (error) {
    healthStatus.services.database = {
      status: 'down',
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
    };
    healthStatus.status = 'degraded';
  }

  // Check Redis
  try {
    const redisStart = Date.now();
    const isRedisHealthy = await cache.testConnection();
    const redisResponseTime = Date.now() - redisStart;

    if (isRedisHealthy) {
      const redisStats = await cache.getStats();
      healthStatus.services.redis = {
        status: 'up',
        responseTime: redisResponseTime,
        details: redisStats,
      };
    } else {
      healthStatus.services.redis.status = 'down';
      healthStatus.status = 'degraded';
    }
  } catch (error) {
    healthStatus.services.redis = {
      status: 'down',
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
    };
    healthStatus.status = 'degraded';
  }

  // Memory usage
  const memUsage = process.memoryUsage();
  healthStatus.memory = {
    used: memUsage.heapUsed,
    total: memUsage.heapTotal,
    percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
  };

  // Set overall status
  if (
    healthStatus.services.database.status === 'down' ||
    healthStatus.services.redis.status === 'down'
  ) {
    healthStatus.status = 'unhealthy';
  }

  const statusCode =
    healthStatus.status === 'healthy' ? 200 : healthStatus.status === 'degraded' ? 200 : 503;

  res.status(statusCode).json(healthStatus);
});

// Detailed health check
router.get('/detailed', async (_req: Request, res: Response) => {
  const healthStatus: any = {
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: config.env,
    nodejs: {
      version: process.version,
      uptime: process.uptime(),
      platform: process.platform,
      arch: process.arch,
    },
    memory: process.memoryUsage(),
    services: {},
  };

  // Database detailed status
  try {
    const poolStatus = await db.getPoolStatus();
    healthStatus.services.database = {
      status: 'up',
      pool: poolStatus,
      config: {
        maxConnections: config.database.maxConnections,
        connectionTimeout: config.database.connectionTimeout,
        queryTimeout: config.database.queryTimeout,
      },
    };
  } catch (error) {
    healthStatus.services.database = {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Redis detailed status
  try {
    const redisStats = await cache.getStats();
    healthStatus.services.redis = {
      status: 'up',
      stats: redisStats,
      config: {
        keyPrefix: config.redis.keyPrefix,
        defaultTtl: config.redis.defaultTtl,
      },
    };
  } catch (error) {
    healthStatus.services.redis = {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  res.status(200).json(healthStatus);
});

// Simple ping endpoint
router.get('/ping', (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'pong',
    timestamp: new Date().toISOString(),
  });
});

export default router;
