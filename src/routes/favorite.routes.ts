import { Router } from 'express';
import { FavoriteController } from '../controllers/favorite.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  bookIdParamSchema,
  createFavoriteSchema,
} from '../validators/favorite.validator';

const router = Router();

router.use(authenticate);

router.get('/', FavoriteController.listMine);
router.post('/', validate(createFavoriteSchema), FavoriteController.add);
router.get(
  '/check/:bookId',
  validate(bookIdParamSchema, 'params'),
  FavoriteController.check,
);
router.delete(
  '/:bookId',
  validate(bookIdParamSchema, 'params'),
  FavoriteController.remove,
);

export default router;
