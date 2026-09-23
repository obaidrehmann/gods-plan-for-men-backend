import { Response } from 'express';
import { TermsSettingsService } from '../services/termsSettings.service';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { serializeTermsSettings } from '../utils/termsSettingsSerializer';
import { UpdateTermsSettingsInput } from '../validators/termsSettings.validator';

export class TermsSettingsController {
  static get = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const settings = await TermsSettingsService.getOrCreate();
    return sendSuccess(
      res,
      serializeTermsSettings(settings),
      'Terms settings fetched successfully',
    );
  });

  static update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const settings = await TermsSettingsService.update(
      req.body as UpdateTermsSettingsInput,
    );
    return sendSuccess(
      res,
      serializeTermsSettings(settings),
      'Terms settings updated successfully',
    );
  });
}
