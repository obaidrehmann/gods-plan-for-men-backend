import { Router } from 'express';
import { ReflectionController } from '../controllers/reflection.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createReflectionSchema,
  reflectionIdParamSchema,
  updateReflectionSchema,
} from '../validators/reflection.validator';

const router = Router();

router.use(authenticate);

router.get('/admin', authorize('admin'), ReflectionController.listSubmitted);
router.get(
  '/admin/:id',
  authorize('admin'),
  validate(reflectionIdParamSchema, 'params'),
  ReflectionController.getSubmitted,
);

router.get('/', ReflectionController.listMine);
router.post('/', validate(createReflectionSchema), ReflectionController.create);
router.get(
  '/:id',
  validate(reflectionIdParamSchema, 'params'),
  ReflectionController.getMine,
);
router.patch(
  '/:id',
  validate(reflectionIdParamSchema, 'params'),
  validate(updateReflectionSchema),
  ReflectionController.update,
);
router.delete(
  '/:id',
  validate(reflectionIdParamSchema, 'params'),
  ReflectionController.remove,
);
router.post(
  '/:id/submit',
  validate(reflectionIdParamSchema, 'params'),
  ReflectionController.submit,
);

export default router;
