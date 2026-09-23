import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { uploadAvatar } from '../middleware/upload';
import { validate } from '../middleware/validate';
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
  updateNotificationPreferencesSchema,
  updateProfileSchema,
  updateSecuritySchema,
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
router.patch(
  '/me/password',
  authenticate,
  validate(changePasswordSchema),
  AuthController.changePassword,
);
router.patch(
  '/me/security',
  authenticate,
  validate(updateSecuritySchema),
  AuthController.updateSecurity,
);
router.patch(
  '/me/notifications',
  authenticate,
  validate(updateNotificationPreferencesSchema),
  AuthController.updateNotificationPreferences,
);

export default router;
