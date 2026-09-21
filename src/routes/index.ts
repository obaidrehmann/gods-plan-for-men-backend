import { Router } from 'express';
import authRoutes from './auth.routes';
import bookRoutes from './book.routes';
import favoriteRoutes from './favorite.routes';
import messageRoutes from './message.routes';
import purchaseRoutes from './purchase.routes';
import reflectionPromptRoutes from './reflectionPrompt.routes';
import reflectionRoutes from './reflection.routes';
import reviewRoutes from './bookReview.routes';
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
router.use('/purchases', purchaseRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/reviews', reviewRoutes);
router.use('/reflections', reflectionRoutes);
router.use('/reflection-prompts', reflectionPromptRoutes);
router.use('/messages', messageRoutes);

export default router;
