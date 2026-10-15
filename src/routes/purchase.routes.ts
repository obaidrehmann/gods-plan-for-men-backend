import { Router } from 'express';
import { PurchaseController } from '../controllers/purchase.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  bookIdParamSchema,
  checkoutSessionParamSchema,
  createPurchaseSchema,
  paymentIntentParamSchema,
} from '../validators/purchase.validator';

const router = Router();

router.get('/checkout/return', PurchaseController.checkoutReturn);
router.get('/checkout/cancel', PurchaseController.checkoutCancel);

router.use(authenticate);

router.get('/sales', authorize('admin'), PurchaseController.sales);
router.post('/checkout', validate(createPurchaseSchema), PurchaseController.checkout);
router.get(
  '/checkout/payment-intents/:paymentIntentId',
  validate(paymentIntentParamSchema, 'params'),
  PurchaseController.confirmPaymentIntent,
);
router.get(
  '/checkout/sessions/:sessionId',
  validate(checkoutSessionParamSchema, 'params'),
  PurchaseController.confirmSession,
);
router.get('/', PurchaseController.listMine);
router.post('/', validate(createPurchaseSchema), PurchaseController.create);
router.get(
  '/check/:bookId',
  validate(bookIdParamSchema, 'params'),
  PurchaseController.checkOwnership,
);

export default router;
