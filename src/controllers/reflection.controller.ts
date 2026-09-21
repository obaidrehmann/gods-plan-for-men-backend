import { Response } from 'express';
import { ReflectionService } from '../services/reflection.service';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import {
  serializeReflection,
  serializeReflections,
} from '../utils/reflectionSerializer';
import {
  AdminRespondInput,
  CreateReflectionInput,
  ReflectionMessageInput,
  UpdateReflectionInput,
} from '../validators/reflection.validator';

function getParam(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

function requireUser(req: AuthRequest) {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }
  return req.user;
}

export class ReflectionController {
  static listMine = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = requireUser(req);
    const reflections = await ReflectionService.listMine(user.id);
    return sendSuccess(
      res,
      serializeReflections(reflections),
      'Reflections fetched successfully',
    );
  });

  static getMine = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = requireUser(req);
    const reflection = await ReflectionService.getMine(getParam(req.params.id), user.id);
    return sendSuccess(res, serializeReflection(reflection), 'Reflection fetched successfully');
  });

  static create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = requireUser(req);
    const reflection = await ReflectionService.create(
      user.id,
      req.body as CreateReflectionInput,
    );
    return sendSuccess(res, serializeReflection(reflection), 'Reflection saved successfully', 201);
  });

  static update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = requireUser(req);
    const reflection = await ReflectionService.update(
      getParam(req.params.id),
      user.id,
      req.body as UpdateReflectionInput,
    );
    return sendSuccess(res, serializeReflection(reflection), 'Reflection updated successfully');
  });

  static remove = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = requireUser(req);
    await ReflectionService.remove(getParam(req.params.id), user.id);
    return sendSuccess(res, null, 'Reflection deleted successfully');
  });

  static submit = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = requireUser(req);
    const reflection = await ReflectionService.submit(getParam(req.params.id), user.id);
    return sendSuccess(res, serializeReflection(reflection), 'Reflection submitted successfully');
  });

  static listSubmitted = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const reflections = await ReflectionService.listSubmittedForAdmin();
    return sendSuccess(
      res,
      serializeReflections(reflections),
      'Submitted reflections fetched successfully',
    );
  });

  static getSubmitted = asyncHandler(async (req: AuthRequest, res: Response) => {
    const reflection = await ReflectionService.getSubmittedForAdmin(getParam(req.params.id));
    return sendSuccess(res, serializeReflection(reflection), 'Reflection fetched successfully');
  });

  static respond = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = requireUser(req);
    const reflection = await ReflectionService.respondAsAdmin(
      getParam(req.params.id),
      user.id,
      req.body as AdminRespondInput,
    );
    return sendSuccess(
      res,
      serializeReflection(reflection),
      'Response saved successfully',
    );
  });

  static replyAsUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = requireUser(req);
    const reflection = await ReflectionService.replyAsUser(
      getParam(req.params.id),
      user.id,
      req.body as ReflectionMessageInput,
    );
    return sendSuccess(
      res,
      serializeReflection(reflection),
      'Reply sent successfully',
    );
  });

  static adminStats = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const pendingResponseCount = await ReflectionService.countPendingForAdmin();
    return sendSuccess(
      res,
      { pendingResponseCount },
      'Reflection stats fetched successfully',
    );
  });

  static myStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = requireUser(req);
    const unreadAdminResponseCount =
      await ReflectionService.countUnreadAdminRepliesForUser(user.id);
    return sendSuccess(
      res,
      { unreadAdminResponseCount },
      'Reflection stats fetched successfully',
    );
  });

  static markAdminRepliesSeen = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = requireUser(req);
    const markedCount = await ReflectionService.markAdminRepliesSeen(user.id);
    return sendSuccess(
      res,
      { markedCount, unreadAdminResponseCount: 0 },
      'Admin replies marked as seen',
    );
  });
}
