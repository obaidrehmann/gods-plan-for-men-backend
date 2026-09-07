import { Router } from 'express';
import authRoutes from './auth.routes';
import bookRoutes from './book.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

router.use('/auth', authRoutes);
router.use('/books', bookRoutes);

export default router;
