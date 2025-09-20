// Jest test setup file
process.env.NODE_ENV = 'test';
process.env.GITHUB_TOKEN = 'test_token_123';
process.env.GITHUB_API_BASE_URL = 'https://api.github.com';
process.env.LOG_LEVEL = 'error';
process.env.PORT = '3000';
process.env.SLACK_BOT_TOKEN = 'test_slack_token';
process.env.SLACK_SIGNING_SECRET = 'test_slack_secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test_jwt_secret_with_at_least_32_characters_long';
process.env.ENCRYPTION_KEY = '12345678901234567890123456789012';
process.env.CORS_ALLOWED_ORIGINS = 'http://localhost:3000';