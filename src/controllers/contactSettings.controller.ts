import { Response } from 'express';
import { ContactSettingsService } from '../services/contactSettings.service';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { serializeContactSettings } from '../utils/contactSettingsSerializer';
import { UpdateContactSettingsInput } from '../validators/contactSettings.validator';

export class ContactSettingsController {
  static get = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const settings = await ContactSettingsService.getOrCreate();
    return sendSuccess(
      res,
      serializeContactSettings(settings),
      'Contact settings fetched successfully',
    );
  });

  static update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const settings = await ContactSettingsService.update(
      req.body as UpdateContactSettingsInput,
    );
    return sendSuccess(
      res,
      serializeContactSettings(settings),
      'Contact settings updated successfully',
    );
  });
}
