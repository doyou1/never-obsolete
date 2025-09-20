import Joi from 'joi';

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().default(3000),
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),

  // GitHub
  GITHUB_TOKEN: Joi.string().required(),
  GITHUB_WEBHOOK_SECRET: Joi.string().optional(),
  GITHUB_API_BASE_URL: Joi.string().uri().default('https://api.github.com'),

  // Slack
  SLACK_BOT_TOKEN: Joi.string().required(),
  SLACK_SIGNING_SECRET: Joi.string().required(),
  SLACK_APP_TOKEN: Joi.string().optional(),
  SLACK_ALLOWED_WORKSPACES: Joi.string().optional(),

  // Database
  DATABASE_URL: Joi.string().required(),
  DATABASE_MAX_CONNECTIONS: Joi.number().default(20),
  DATABASE_CONNECTION_TIMEOUT_MS: Joi.number().default(30000),
  DATABASE_QUERY_TIMEOUT_MS: Joi.number().default(60000),

  // Redis
  REDIS_URL: Joi.string().required(),
  REDIS_KEY_PREFIX: Joi.string().default('github-flow-analyzer:'),
  REDIS_DEFAULT_TTL_SECONDS: Joi.number().default(3600),

  // Analysis
  MAX_FILE_SIZE_BYTES: Joi.number().default(10485760), // 10MB
  MAX_ANALYSIS_TIME_MS: Joi.number().default(300000), // 5분
  MAX_FILES_PER_ANALYSIS: Joi.number().default(1000),
  MAX_CONCURRENT_ANALYSES: Joi.number().default(5),

  // Security
  JWT_SECRET: Joi.string().min(32).required(),
  ENCRYPTION_KEY: Joi.string().length(32).required(),
  CORS_ALLOWED_ORIGINS: Joi.string().default('http://localhost:3000'),
}).unknown();

const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  logLevel: envVars.LOG_LEVEL,

  github: {
    token: envVars.GITHUB_TOKEN,
    webhookSecret: envVars.GITHUB_WEBHOOK_SECRET,
    apiBaseUrl: envVars.GITHUB_API_BASE_URL,
    rateLimit: {
      requestsPerHour: Number(envVars.GITHUB_RATE_LIMIT_REQUESTS_PER_HOUR) || 5000,
      requestsPerMinute: Number(envVars.GITHUB_RATE_LIMIT_REQUESTS_PER_MINUTE) || 100,
    },
  },

  slack: {
    botToken: envVars.SLACK_BOT_TOKEN,
    signingSecret: envVars.SLACK_SIGNING_SECRET,
    appToken: envVars.SLACK_APP_TOKEN,
    allowedWorkspaces: envVars.SLACK_ALLOWED_WORKSPACES?.split(',') || [],
  },

  database: {
    url: envVars.DATABASE_URL,
    maxConnections: envVars.DATABASE_MAX_CONNECTIONS,
    connectionTimeout: envVars.DATABASE_CONNECTION_TIMEOUT_MS,
    queryTimeout: envVars.DATABASE_QUERY_TIMEOUT_MS,
  },

  redis: {
    url: envVars.REDIS_URL,
    keyPrefix: envVars.REDIS_KEY_PREFIX,
    defaultTtl: envVars.REDIS_DEFAULT_TTL_SECONDS,
  },

  analysis: {
    maxFileSize: envVars.MAX_FILE_SIZE_BYTES,
    maxAnalysisTime: envVars.MAX_ANALYSIS_TIME_MS,
    maxFilesPerAnalysis: envVars.MAX_FILES_PER_ANALYSIS,
    maxConcurrentAnalyses: envVars.MAX_CONCURRENT_ANALYSES,
    supportedExtensions: envVars.SUPPORTED_FILE_EXTENSIONS?.split(',') || [
      '.ts',
      '.js',
      '.tsx',
      '.jsx',
      '.json',
      '.sql',
      '.md',
    ],
    entryPointPatterns: envVars.ENTRY_POINT_PATTERNS?.split(';') || [
      'clientv/router.ts',
      'src/routes/*.ts',
      'routes/*.js',
    ],
  },

  security: {
    jwtSecret: envVars.JWT_SECRET,
    encryptionKey: envVars.ENCRYPTION_KEY,
  },

  cors: {
    allowedOrigins: envVars.CORS_ALLOWED_ORIGINS.split(','),
  },

  cache: {
    githubApiTtl: Number(envVars.CACHE_GITHUB_API_TTL) || 1800,
    analysisResultTtl: Number(envVars.CACHE_ANALYSIS_RESULT_TTL) || 86400,
    fileContentTtl: Number(envVars.CACHE_FILE_CONTENT_TTL) || 3600,
  },

  claudeCode: {
    commandsDir: envVars.CLAUDE_CODE_COMMANDS_DIR || '.commands',
    outputDir: envVars.CLAUDE_CODE_OUTPUT_DIR || 'analysis-reports',
  },
};
