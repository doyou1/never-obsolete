import { Router } from 'express';
import healthRouter from './health';
import analysisRouter from './analysis';

const router = Router();

// Health check routes
router.use('/health', healthRouter);

// Analysis routes
router.use('/analysis', analysisRouter);

// Root endpoint
router.get('/', (_req, res) => {
  res.status(200).json({
    name: 'GitHub Source Flow Analysis Slack Bot',
    version: process.env.npm_package_version || '1.0.0',
    description: 'GitHub Issue/PR 소스코드 플로우 분석 및 Slack Bot 통합 도구',
    endpoints: {
      health: '/health',
      docs: '/api/docs',
      analysis: '/analysis',
    },
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
