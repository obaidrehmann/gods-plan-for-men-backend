import { Response } from 'express';
import { PurchaseService } from '../services/purchase.service';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { serializePurchase } from '../utils/purchaseSerializer';
import { AppError } from '../utils/AppError';
import { CreatePurchaseInput } from '../validators/purchase.validator';

export class PurchaseController {
  static create = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const result = await PurchaseService.purchaseSimple(
      req.user.id,
      req.body as CreatePurchaseInput,
    );

    return sendSuccess(
      res,
      {
        ...serializePurchase(result.purchase, result.book),
        alreadyOwned: result.alreadyOwned,
      },
      result.alreadyOwned ? 'Book already purchased' : 'Book purchased successfully',
      result.alreadyOwned ? 200 : 201,
    );
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
