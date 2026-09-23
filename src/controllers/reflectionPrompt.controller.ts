import { Response } from 'express';
import { ReflectionPromptService } from '../services/reflectionPrompt.service';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import {
  serializeReflectionPrompt,
  serializeReflectionPrompts,
} from '../utils/reflectionPromptSerializer';
import {
  CreateReflectionPromptInput,
  ListReflectionPromptsQuery,
  UpdateReflectionPromptInput,
} from '../validators/reflectionPrompt.validator';

function getParam(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

export class ReflectionPromptController {
  static listForChapter = asyncHandler(async (req: AuthRequest, res: Response) => {
    const query = req.query as unknown as ListReflectionPromptsQuery;
    const prompts = await ReflectionPromptService.listForChapter(
      query.bookId,
      query.chapterId,
    );

    return sendSuccess(
      res,
      serializeReflectionPrompts(prompts),
      'Reflection prompts fetched successfully',
    );
  });

  static listAll = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const prompts = await ReflectionPromptService.listAll();
    const enrichment = await ReflectionPromptService.enrichTargets(prompts);

    return sendSuccess(
      res,
      serializeReflectionPrompts(prompts, enrichment),
      'All reflection prompts fetched successfully',
    );
  });

  static listActive = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const prompts = await ReflectionPromptService.listActive();
    return sendSuccess(
      res,
      serializeReflectionPrompts(prompts),
      'Active reflection prompts fetched successfully',
    );
  });

  static create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { prompt, targets } = await ReflectionPromptService.create(
      req.body as CreateReflectionPromptInput,
    );

    return sendSuccess(
      res,
      serializeReflectionPrompt(prompt, targets),
      'Reflection prompt created successfully',
      201,
    );
  });

  static update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { prompt, targets } = await ReflectionPromptService.update(
      getParam(req.params.id),
      req.body as UpdateReflectionPromptInput,
    );

    return sendSuccess(
      res,
      serializeReflectionPrompt(prompt, targets),
      'Reflection prompt updated successfully',
    );
  });

  static remove = asyncHandler(async (req: AuthRequest, res: Response) => {
    await ReflectionPromptService.remove(getParam(req.params.id));
    return sendSuccess(res, null, 'Reflection prompt deleted successfully');
  });
}
