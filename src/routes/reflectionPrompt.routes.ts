import { Router } from 'express';
import { ReflectionPromptController } from '../controllers/reflectionPrompt.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createReflectionPromptSchema,
  listReflectionPromptsQuerySchema,
  reflectionPromptIdParamSchema,
  updateReflectionPromptSchema,
} from '../validators/reflectionPrompt.validator';

const router = Router();

router.get(
  '/',
  authenticate,
  validate(listReflectionPromptsQuerySchema, 'query'),
  ReflectionPromptController.listForChapter,
);

router.get(
  '/active',
  authenticate,
  ReflectionPromptController.listActive,
);

router.get(
  '/all',
  authenticate,
  authorize('admin'),
  ReflectionPromptController.listAll,
);

router.post(
  '/',
  authenticate,
  authorize('admin'),
  validate(createReflectionPromptSchema),
  ReflectionPromptController.create,
);

router.patch(
  '/:id',
  authenticate,
  authorize('admin'),
  validate(reflectionPromptIdParamSchema, 'params'),
  validate(updateReflectionPromptSchema),
  ReflectionPromptController.update,
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  validate(reflectionPromptIdParamSchema, 'params'),
  ReflectionPromptController.remove,
);

export default router;
