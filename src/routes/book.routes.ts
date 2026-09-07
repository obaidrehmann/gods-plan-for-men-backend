import { Router } from 'express';
import { BookController } from '../controllers/book.controller';
import { authenticate, authorize } from '../middleware/auth';
import { uploadAudio, uploadCover } from '../middleware/upload';
import { validate } from '../middleware/validate';
import {
  bookIdParamSchema,
  chapterIdParamSchema,
  createBookSchema,
  createChapterSchema,
  updateBookSchema,
  updateChapterSchema,
} from '../validators/book.validator';

const router = Router();

router.get('/', BookController.list);
router.get('/all', authenticate, authorize('admin'), BookController.listAll);

router.post(
  '/',
  authenticate,
  authorize('admin'),
  uploadCover.single('cover'),
  validate(createBookSchema),
  BookController.create,
);

router.get('/:id', validate(bookIdParamSchema, 'params'), BookController.getById);

router.patch(
  '/:id',
  authenticate,
  authorize('admin'),
  validate(bookIdParamSchema, 'params'),
  validate(updateBookSchema),
  BookController.update,
);

router.post(
  '/:id/cover',
  authenticate,
  authorize('admin'),
  validate(bookIdParamSchema, 'params'),
  uploadCover.single('cover'),
  BookController.uploadCover,
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  validate(bookIdParamSchema, 'params'),
  BookController.remove,
);

router.post(
  '/:id/chapters',
  authenticate,
  authorize('admin'),
  validate(bookIdParamSchema, 'params'),
  uploadAudio.single('audio'),
  validate(createChapterSchema),
  BookController.addChapter,
);

router.patch(
  '/:id/chapters/:chapterId',
  authenticate,
  authorize('admin'),
  validate(chapterIdParamSchema, 'params'),
  uploadAudio.single('audio'),
  validate(updateChapterSchema),
  BookController.updateChapter,
);

router.delete(
  '/:id/chapters/:chapterId',
  authenticate,
  authorize('admin'),
  validate(chapterIdParamSchema, 'params'),
  BookController.removeChapter,
);

export default router;
