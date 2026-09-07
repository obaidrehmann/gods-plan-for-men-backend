import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { uploadAvatar } from '../middleware/upload';
import { validate } from '../middleware/validate';
import {
  loginSchema,
  registerSchema,
  updateProfileSchema,
} from '../validators/auth.validator';

const router = Router();

router.post('/register', validate(registerSchema), AuthController.register);
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/admin/login', validate(loginSchema), AuthController.adminLogin);
router.get('/me', authenticate, AuthController.me);
router.patch('/me', authenticate, validate(updateProfileSchema), AuthController.updateProfile);
router.post(
  '/me/avatar',
  authenticate,
  uploadAvatar.single('avatar'),
  AuthController.updateAvatar,
);

export default router;
