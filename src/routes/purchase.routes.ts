import { Router } from 'express';
import { PurchaseController } from '../controllers/purchase.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  bookIdParamSchema,
  createPurchaseSchema,
} from '../validators/purchase.validator';

const router = Router();

router.use(authenticate);

router.get('/', PurchaseController.listMine);
router.post('/', validate(createPurchaseSchema), PurchaseController.create);
router.get(
  '/check/:bookId',
  validate(bookIdParamSchema, 'params'),
  PurchaseController.checkOwnership,
);

export default router;
