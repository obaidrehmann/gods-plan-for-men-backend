import { Router } from 'express';
import authRoutes from './auth.routes';
import bookRoutes from './book.routes';
import messageRoutes from './message.routes';
import reflectionRoutes from './reflection.routes';
import userRoutes from './user.routes';

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
router.use('/users', userRoutes);
router.use('/books', bookRoutes);
router.use('/reflections', reflectionRoutes);
router.use('/messages', messageRoutes);

export default router;
