import { Response } from 'express';
import { MessageService } from '../services/message.service';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { serializeMessage, serializeMessages } from '../utils/messageSerializer';
import {
  CreateMessageInput,
  UpdateMessageInput,
} from '../validators/message.validator';

function getParam(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

export class MessageController {
  static listActive = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const messages = await MessageService.listActive();
    return sendSuccess(
      res,
      serializeMessages(messages),
      'Messages fetched successfully',
    );
  });

  static listAll = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const messages = await MessageService.listAll();
    return sendSuccess(
      res,
      serializeMessages(messages),
      'All messages fetched successfully',
    );
  });

  static create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const message = await MessageService.create(req.body as CreateMessageInput);
    return sendSuccess(res, serializeMessage(message), 'Message created successfully', 201);
  });

  static update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const message = await MessageService.update(
      getParam(req.params.id),
      req.body as UpdateMessageInput,
    );
    return sendSuccess(res, serializeMessage(message), 'Message updated successfully');
  });

  static remove = asyncHandler(async (req: AuthRequest, res: Response) => {
    await MessageService.remove(getParam(req.params.id));
    return sendSuccess(res, null, 'Message deleted successfully');
  });
}
