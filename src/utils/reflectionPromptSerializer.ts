import { Types } from 'mongoose';
import { IReflectionPrompt, IReflectionPromptTarget } from '../models/ReflectionPrompt';

export type SerializedPromptTarget = {
  bookId: string;
  chapterId: string;
  bookTitle?: string;
  chapterTitle?: string;
  chapterNumber?: string;
};

export type EnrichedPromptTarget = IReflectionPromptTarget & {
  bookTitle?: string;
  chapterTitle?: string;
  chapterNumber?: string;
};

function serializeTarget(target: EnrichedPromptTarget): SerializedPromptTarget {
  return {
    bookId: target.bookId.toString(),
    chapterId: target.chapterId.toString(),
    ...(target.bookTitle !== undefined ? { bookTitle: target.bookTitle } : {}),
    ...(target.chapterTitle !== undefined ? { chapterTitle: target.chapterTitle } : {}),
    ...(target.chapterNumber !== undefined ? { chapterNumber: target.chapterNumber } : {}),
  };
}

export function serializeReflectionPrompt(
  prompt: IReflectionPrompt,
  enrichedTargets?: EnrichedPromptTarget[],
) {
  const targets = enrichedTargets ?? (prompt.targets as EnrichedPromptTarget[]);

  return {
    id: prompt._id.toString(),
    body: prompt.body,
    targets: targets.map(serializeTarget),
    isActive: prompt.isActive,
    order: prompt.order,
    createdAt: prompt.createdAt,
    updatedAt: prompt.updatedAt,
  };
}

export function serializeReflectionPrompts(
  prompts: IReflectionPrompt[],
  enrichmentByPromptId?: Map<string, EnrichedPromptTarget[]>,
) {
  return prompts.map((prompt) => {
    const id = (prompt._id as Types.ObjectId).toString();
    return serializeReflectionPrompt(prompt, enrichmentByPromptId?.get(id));
  });
}
