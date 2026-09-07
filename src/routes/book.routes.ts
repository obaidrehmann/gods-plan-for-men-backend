import { Router } from 'express';
import { BookController } from '../controllers/book.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  bookIdParamSchema,
  createBookSchema,
  updateBookSchema,
} from '../validators/book.validator';

const router = Router();

router.get('/', BookController.list);
router.get('/all', authenticate, authorize('admin'), BookController.listAll);
router.get('/:id', validate(bookIdParamSchema, 'params'), BookController.getById);

router.post(
  '/',
  authenticate,
  authorize('admin'),
  validate(createBookSchema),
  BookController.create,
);

router.patch(
  '/:id',
  authenticate,
  authorize('admin'),
  validate(bookIdParamSchema, 'params'),
  validate(updateBookSchema),
  BookController.update,
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  validate(bookIdParamSchema, 'params'),
  BookController.remove,
);

export default router;
