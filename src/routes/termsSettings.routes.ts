import { Router } from 'express';
import { TermsSettingsController } from '../controllers/termsSettings.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updateTermsSettingsSchema } from '../validators/termsSettings.validator';

const router = Router();

router.get('/', TermsSettingsController.get);

router.patch(
  '/',
  authenticate,
  authorize('admin'),
  validate(updateTermsSettingsSchema),
  TermsSettingsController.update,
);

export default router;
