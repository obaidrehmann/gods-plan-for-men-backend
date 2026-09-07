import { Router } from 'express';
import { MessageController } from '../controllers/message.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createMessageSchema,
  messageIdParamSchema,
  updateMessageSchema,
} from '../validators/message.validator';

const router = Router();

router.get('/', MessageController.listActive);

router.get('/all', authenticate, authorize('admin'), MessageController.listAll);

router.post(
  '/',
  authenticate,
  authorize('admin'),
  validate(createMessageSchema),
  MessageController.create,
);

router.patch(
  '/:id',
  authenticate,
  authorize('admin'),
  validate(messageIdParamSchema, 'params'),
  validate(updateMessageSchema),
  MessageController.update,
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  validate(messageIdParamSchema, 'params'),
  MessageController.remove,
);

export default router;
