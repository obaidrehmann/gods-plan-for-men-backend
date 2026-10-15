import { Request, Response } from 'express';
import { PurchaseService } from '../services/purchase.service';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { serializePurchase } from '../utils/purchaseSerializer';
import { AppError } from '../utils/AppError';
import { CreatePurchaseInput } from '../validators/purchase.validator';

function checkoutPage(title: string, message: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f5f6f8; color: #14131f; font-family: system-ui, sans-serif; }
    main { width: min(100% - 32px, 28rem); background: #fff; border-radius: 12px; padding: 28px; }
    h1 { margin: 0 0 8px; color: #050035; font-size: 1.4rem; }
    p { margin: 0; color: rgba(20, 19, 31, 0.7); line-height: 1.5; }
  </style>
</head>
<body>
  <main>
    <h1>${title}</h1>
    <p>${message}</p>
  </main>
</body>
</html>`;
}

function sendCheckout(res: Response, result: Awaited<ReturnType<typeof PurchaseService.startCheckout>>) {
  const completed = result.purchase.status === 'completed';
  const message = result.alreadyOwned
    ? 'Book already purchased'
    : completed
      ? 'Book added to your library'
      : 'Continue to Stripe Checkout';

  return sendSuccess(
    res,
    {
      ...serializePurchase(result.purchase, result.book),
      alreadyOwned: result.alreadyOwned,
      checkoutUrl: result.checkoutUrl,
      sessionId: result.sessionId,
    },
    message,
    result.alreadyOwned || completed ? 200 : 201,
  );
}

export class PurchaseController {
  static create = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const result = await PurchaseService.purchase(req.user.id, req.body as CreatePurchaseInput);
    return sendCheckout(res, result);
  });

  static checkout = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const result = await PurchaseService.startCheckout(
      req.user.id,
      (req.body as CreatePurchaseInput).bookId,
    );
    return sendCheckout(res, result);
  });

  static confirmSession = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const sessionId = Array.isArray(req.params.sessionId)
      ? req.params.sessionId[0]
      : req.params.sessionId;
    const result = await PurchaseService.confirmCheckoutSession(req.user.id, sessionId);
    return sendCheckout(res, result);
  });

  static checkoutReturn = asyncHandler(async (req: Request, res: Response) => {
    const raw = req.query.session_id;
    const sessionId =
      typeof raw === 'string' ? raw : Array.isArray(raw) && typeof raw[0] === 'string' ? raw[0] : '';
    const outcome = sessionId ? await PurchaseService.recordPaidCheckout(sessionId) : 'missing';
    const paid = outcome === 'paid';

    res
      .status(200)
      .type('html')
      .send(
        checkoutPage(
          paid ? 'Payment received' : 'Return to the app',
          paid
            ? 'Stripe confirmed the payment. This sale is in admin reporting. Return to the app to open the book.'
            : 'If you finished paying, return to the app. It will confirm the charge with Stripe and add the book to your library.',
        ),
      );
  });

  static checkoutCancel = asyncHandler(async (_req: Request, res: Response) => {
    res
      .status(200)
      .type('html')
      .send(
        checkoutPage(
          'Checkout canceled',
          'No charge was made. Return to the app to continue browsing.',
        ),
      );
  });

  static sales = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const report = await PurchaseService.salesReport();
    return sendSuccess(res, report, 'Sales report fetched successfully');
  });

  static listMine = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const purchases = await PurchaseService.listMine(req.user.id);
    return sendSuccess(
      res,
      purchases.map((purchase) => serializePurchase(purchase)),
      'Purchases fetched successfully',
    );
  });

  static checkOwnership = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const bookId = Array.isArray(req.params.bookId) ? req.params.bookId[0] : req.params.bookId;
    const isPurchased = await PurchaseService.hasPurchased(req.user.id, bookId);

    return sendSuccess(res, { bookId, isPurchased }, 'Purchase status fetched successfully');
  });
}
