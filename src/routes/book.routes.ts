import { Router } from 'express';
import { BookController } from '../controllers/book.controller';
import { authenticate, authorize, optionalAuthenticate } from '../middleware/auth';
import { uploadChapterMedia, uploadCover } from '../middleware/upload';
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

router.get('/', optionalAuthenticate, BookController.list);
router.get('/all', authenticate, authorize('admin'), BookController.listAll);

router.post(
  '/',
  authenticate,
  authorize('admin'),
  uploadCover.single('cover'),
  validate(createBookSchema),
  BookController.create,
);

router.get(
  '/:id',
  optionalAuthenticate,
  validate(bookIdParamSchema, 'params'),
  BookController.getById,
);

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
  uploadChapterMedia.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'image', maxCount: 1 },
    { name: 'pdf', maxCount: 1 },
  ]),
  validate(createChapterSchema),
  BookController.addChapter,
);

router.patch(
  '/:id/chapters/:chapterId',
  authenticate,
  authorize('admin'),
  validate(chapterIdParamSchema, 'params'),
  uploadChapterMedia.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'image', maxCount: 1 },
    { name: 'pdf', maxCount: 1 },
  ]),
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
