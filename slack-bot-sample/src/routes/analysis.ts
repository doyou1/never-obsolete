import { Router, Request, Response } from 'express';

const router = Router();

// Analysis routes (to be implemented in later tasks)
router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'Analysis API endpoints',
    endpoints: {
      requests: '/analysis/requests',
      results: '/analysis/results',
    },
    status: 'coming soon',
    timestamp: new Date().toISOString(),
  });
});

// Placeholder for future analysis endpoints
router.get('/requests', (_req: Request, res: Response) => {
  res.status(501).json({
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Analysis requests endpoint not implemented yet',
      timestamp: new Date().toISOString(),
    },
  });
});

router.get('/results', (_req: Request, res: Response) => {
  res.status(501).json({
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Analysis results endpoint not implemented yet',
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
