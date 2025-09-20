import Redis from 'ioredis';
import { logger } from '../utils/logger';
import { config } from '../config/environment';

class RedisCache {
  private client: Redis;
  private static instance: RedisCache;

  private constructor() {
    this.client = new Redis(config.redis.url, {
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000,
      family: 4,
    });

    this.client.on('connect', () => {
      logger.info('Redis client connected');
    });

    this.client.on('ready', () => {
      logger.info('Redis client ready');
    });

    this.client.on('error', error => {
      logger.error('Redis client error:', error);
    });

    this.client.on('close', () => {
      logger.warn('Redis client connection closed');
    });

    this.client.on('reconnecting', () => {
      logger.info('Redis client reconnecting...');
    });
  }

  public static getInstance(): RedisCache {
    if (!RedisCache.instance) {
      RedisCache.instance = new RedisCache();
    }
    return RedisCache.instance;
  }

  public getClient(): Redis {
    return this.client;
  }

  private buildKey(key: string): string {
    return `${config.redis.keyPrefix}${key}`;
  }

  public async set(
    key: string,
    value: any,
    ttlSeconds: number = config.redis.defaultTtl,
  ): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      const fullKey = this.buildKey(key);

      if (ttlSeconds > 0) {
        await this.client.setex(fullKey, ttlSeconds, serializedValue);
      } else {
        await this.client.set(fullKey, serializedValue);
      }

      logger.debug('Redis SET operation completed', {
        key: fullKey,
        ttl: ttlSeconds,
        size: serializedValue.length,
      });
    } catch (error) {
      logger.error('Redis SET operation failed:', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  public async get<T = any>(key: string): Promise<T | null> {
    try {
      const fullKey = this.buildKey(key);
      const value = await this.client.get(fullKey);

      if (value === null) {
        logger.debug('Redis GET operation - key not found', { key: fullKey });
        return null;
      }

      const parsedValue = JSON.parse(value);
      logger.debug('Redis GET operation completed', {
        key: fullKey,
        size: value.length,
      });

      return parsedValue;
    } catch (error) {
      logger.error('Redis GET operation failed:', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  public async del(key: string): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key);
      const result = await this.client.del(fullKey);

      logger.debug('Redis DEL operation completed', {
        key: fullKey,
        deleted: result > 0,
      });

      return result > 0;
    } catch (error) {
      logger.error('Redis DEL operation failed:', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  public async exists(key: string): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key);
      const result = await this.client.exists(fullKey);
      return result === 1;
    } catch (error) {
      logger.error('Redis EXISTS operation failed:', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  public async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key);
      const result = await this.client.expire(fullKey, seconds);
      return result === 1;
    } catch (error) {
      logger.error('Redis EXPIRE operation failed:', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  public async getTTL(key: string): Promise<number> {
    try {
      const fullKey = this.buildKey(key);
      return await this.client.ttl(fullKey);
    } catch (error) {
      logger.error('Redis TTL operation failed:', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  public async flushPattern(pattern: string): Promise<number> {
    try {
      const fullPattern = this.buildKey(pattern);
      const keys = await this.client.keys(fullPattern);

      if (keys.length === 0) {
        return 0;
      }

      const result = await this.client.del(...keys);
      logger.info('Redis pattern flush completed', {
        pattern: fullPattern,
        deletedKeys: result,
      });

      return result;
    } catch (error) {
      logger.error('Redis pattern flush failed:', {
        pattern,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  public async testConnection(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      logger.info('Redis connection test successful', { ping: result });
      return result === 'PONG';
    } catch (error) {
      logger.error('Redis connection test failed:', error);
      return false;
    }
  }

  public async getStats() {
    try {
      const info = await this.client.info('memory');
      const memory = this.parseRedisInfo(info);

      return {
        connected: this.client.status === 'ready',
        status: this.client.status,
        memory: {
          used: memory.used_memory_human,
          peak: memory.used_memory_peak_human,
          rss: memory.used_memory_rss_human,
        },
      };
    } catch (error) {
      logger.error('Redis stats retrieval failed:', error);
      return {
        connected: false,
        status: this.client.status,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private parseRedisInfo(info: string): Record<string, string> {
    const lines = info.split('\r\n');
    const result: Record<string, string> = {};

    for (const line of lines) {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value) {
          result[key] = value;
        }
      }
    }

    return result;
  }

  public async disconnect(): Promise<void> {
    try {
      await this.client.quit();
      logger.info('Redis client disconnected gracefully');
    } catch (error) {
      logger.error('Error disconnecting Redis client:', error);
      this.client.disconnect();
    }
  }
}

export const cache = RedisCache.getInstance();
export default RedisCache;
