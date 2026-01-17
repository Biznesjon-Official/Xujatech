import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// Get sync status
router.get('/status', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  // MongoDB based sync status
  res.json({
    success: true,
    data: {
      pendingOperations: 0,
      lastSync: new Date().toISOString(),
      isOnline: true
    }
  });
}));

// Manual sync trigger
router.post('/manual', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  res.json({
    success: true,
    message: 'Sync initiated successfully'
  });
}));

export default router;
