import { Router } from 'express';
import { BookReviewController } from '../controllers/bookReview.controller';
import { authenticate, authorize, optionalAuthenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  bookReviewBookIdParamSchema,
  bookReviewIdParamSchema,
  createBookReviewSchema,
  updateBookReviewSchema,
} from '../validators/bookReview.validator';

const router = Router();

router.get(
  '/book/:bookId',
  optionalAuthenticate,
  validate(bookReviewBookIdParamSchema, 'params'),
  BookReviewController.listForBook,
);

router.use(authenticate);

router.get('/admin', authorize('admin'), BookReviewController.listAdmin);
router.delete(
  '/admin/:id',
  authorize('admin'),
  validate(bookReviewIdParamSchema, 'params'),
  BookReviewController.removeAdmin,
);

router.get(
  '/mine/:bookId',
  validate(bookReviewBookIdParamSchema, 'params'),
  BookReviewController.mineForBook,
);
router.post('/', validate(createBookReviewSchema), BookReviewController.upsert);
router.patch(
  '/:id',
  validate(bookReviewIdParamSchema, 'params'),
  validate(updateBookReviewSchema),
  BookReviewController.updateMine,
);
router.delete(
  '/:id',
  validate(bookReviewIdParamSchema, 'params'),
  BookReviewController.removeMine,
);

export default router;
