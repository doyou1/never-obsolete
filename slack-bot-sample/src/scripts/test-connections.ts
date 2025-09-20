import 'dotenv/config';
import { db } from '../database/connection';
import { cache } from '../cache/redis';
import { logger } from '../utils/logger';

async function testDatabaseConnection(): Promise<boolean> {
  try {
    logger.info('Testing database connection...');
    const success = await db.testConnection();

    if (success) {
      logger.info('✅ Database connection test passed');

      const poolStatus = await db.getPoolStatus();
      logger.info('Database pool status:', poolStatus);
    } else {
      logger.error('❌ Database connection test failed');
    }

    return success;
  } catch (error) {
    logger.error('❌ Database connection test error:', error);
    return false;
  }
}

async function testSchemaValidation(): Promise<boolean> {
  try {
    logger.info('Testing database schema...');

    const tables = [
      'analysis_requests',
      'analysis_results',
      'analysis_errors',
      'analysis_warnings',
      'analyzed_files',
      'flow_nodes',
      'flow_edges',
      'cache_entries',
      'user_workspaces',
      'daily_usage',
    ];

    for (const table of tables) {
      const result = await db.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND table_schema = 'public'",
        [table],
      );

      if (result.rows.length === 0) {
        logger.error(`❌ Table '${table}' not found`);
        return false;
      }

      logger.info(`✅ Table '${table}' exists with ${result.rows.length} columns`);
    }

    logger.info('✅ Database schema validation passed');
    return true;
  } catch (error) {
    logger.error('❌ Database schema validation error:', error);
    return false;
  }
}

async function testRedisConnection(): Promise<boolean> {
  try {
    logger.info('Testing Redis connection...');
    const success = await cache.testConnection();

    if (success) {
      logger.info('✅ Redis connection test passed');

      const stats = await cache.getStats();
      logger.info('Redis stats:', stats);

      logger.info('Testing Redis operations...');
      const testKey = 'test:connection';
      const testValue = { timestamp: new Date().toISOString(), test: true };

      await cache.set(testKey, testValue, 60);
      const retrievedValue = await cache.get(testKey);

      if (JSON.stringify(retrievedValue) === JSON.stringify(testValue)) {
        logger.info('✅ Redis operations test passed');
        await cache.del(testKey);
      } else {
        logger.error('❌ Redis operations test failed - value mismatch');
        return false;
      }
    } else {
      logger.error('❌ Redis connection test failed');
    }

    return success;
  } catch (error) {
    logger.error('❌ Redis connection test error:', error);
    return false;
  }
}

async function runAllTests(): Promise<void> {
  logger.info('🔧 Starting database and cache connection tests...');

  const results = {
    database: false,
    schema: false,
    redis: false,
  };

  try {
    results.database = await testDatabaseConnection();
    if (results.database) {
      results.schema = await testSchemaValidation();
    }
    results.redis = await testRedisConnection();

    logger.info('📊 Test Results Summary:');
    logger.info(`Database Connection: ${results.database ? '✅ PASS' : '❌ FAIL'}`);
    logger.info(`Schema Validation: ${results.schema ? '✅ PASS' : '❌ FAIL'}`);
    logger.info(`Redis Connection: ${results.redis ? '✅ PASS' : '❌ FAIL'}`);

    const allPassed = results.database && results.schema && results.redis;
    logger.info(`🎯 Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

    if (!allPassed) {
      process.exit(1);
    }
  } catch (error) {
    logger.error('❌ Test execution failed:', error);
    process.exit(1);
  } finally {
    try {
      await db.close();
      await cache.disconnect();
      logger.info('🔚 Database and cache connections closed');
    } catch (error) {
      logger.error('Error closing connections:', error);
    }
    process.exit(0);
  }
}

if (require.main === module) {
  runAllTests().catch(error => {
    logger.error('Test script failed:', error);
    process.exit(1);
  });
}
