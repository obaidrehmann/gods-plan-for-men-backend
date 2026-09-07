import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  updateUserStatusSchema,
  userIdParamSchema,
} from '../validators/user.validator';

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/', UserController.list);

router.patch(
  '/:id/status',
  validate(userIdParamSchema, 'params'),
  validate(updateUserStatusSchema),
  UserController.updateStatus,
);

export default router;
