import { Router } from 'express';
import { ContactSettingsController } from '../controllers/contactSettings.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updateContactSettingsSchema } from '../validators/contactSettings.validator';

const router = Router();

router.get('/', ContactSettingsController.get);

router.patch(
  '/',
  authenticate,
  authorize('admin'),
  validate(updateContactSettingsSchema),
  ContactSettingsController.update,
);

export default router;
