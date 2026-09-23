import { Types } from 'mongoose';
import { Book } from '../models/Book';
import {
  IReflectionPrompt,
  IReflectionPromptTarget,
  ReflectionPrompt,
} from '../models/ReflectionPrompt';
import { AppError } from '../utils/AppError';
import { EnrichedPromptTarget } from '../utils/reflectionPromptSerializer';
import {
  CreateReflectionPromptInput,
  UpdateReflectionPromptInput,
} from '../validators/reflectionPrompt.validator';

type TargetInput = { bookId: string; chapterId: string };

export class ReflectionPromptService {
  private static assertNoDuplicateTargets(targets: TargetInput[]) {
    const seen = new Set<string>();

    for (const target of targets) {
      const key = `${target.bookId}:${target.chapterId}`;
      if (seen.has(key)) {
        throw new AppError('Duplicate book/chapter targets are not allowed', 400);
      }
      seen.add(key);
    }
  }

  private static async assertTargetsAvailable(
    targets: TargetInput[],
    excludePromptId?: string,
  ) {
    const conflict = await ReflectionPrompt.findOne({
      ...(excludePromptId ? { _id: { $ne: excludePromptId } } : {}),
      $or: targets.map((target) => ({
        targets: {
          $elemMatch: {
            bookId: new Types.ObjectId(target.bookId),
            chapterId: new Types.ObjectId(target.chapterId),
          },
        },
      })),
    });

    if (conflict) {
      throw new AppError(
        'Another prompt already uses one of these book/chapter pairs. Each chapter can only have one prompt.',
        409,
      );
    }
  }

  private static async resolveTargets(
    targets: TargetInput[],
    excludePromptId?: string,
  ): Promise<EnrichedPromptTarget[]> {
    this.assertNoDuplicateTargets(targets);
    await this.assertTargetsAvailable(targets, excludePromptId);

    const bookIds = [...new Set(targets.map((target) => target.bookId))];
    const books = await Book.find({ _id: { $in: bookIds } });
    const bookById = new Map(books.map((book) => [book._id.toString(), book]));

    return targets.map((target) => {
      const book = bookById.get(target.bookId);

      if (!book) {
        throw new AppError(`Book not found: ${target.bookId}`, 404);
      }

      const chapter = book.chapters.id(target.chapterId);

      if (!chapter) {
        throw new AppError(
          `Chapter not found for book "${book.title}": ${target.chapterId}`,
          404,
        );
      }

      return {
        bookId: book._id as Types.ObjectId,
        chapterId: chapter._id as Types.ObjectId,
        bookTitle: book.title,
        chapterTitle: chapter.title,
        chapterNumber: chapter.number,
      };
    });
  }

  static async enrichTargets(
    prompts: IReflectionPrompt[],
  ): Promise<Map<string, EnrichedPromptTarget[]>> {
    const bookIds = [
      ...new Set(
        prompts.flatMap((prompt) =>
          prompt.targets.map((target) => target.bookId.toString()),
        ),
      ),
    ];

    const books = bookIds.length
      ? await Book.find({ _id: { $in: bookIds } })
      : [];
    const bookById = new Map(books.map((book) => [book._id.toString(), book]));
    const result = new Map<string, EnrichedPromptTarget[]>();

    for (const prompt of prompts) {
      const enriched = prompt.targets.map((target: IReflectionPromptTarget) => {
        const book = bookById.get(target.bookId.toString());
        const chapter = book?.chapters.id(target.chapterId.toString());

        return {
          bookId: target.bookId,
          chapterId: target.chapterId,
          bookTitle: book?.title ?? 'Unknown book',
          chapterTitle: chapter?.title ?? 'Unknown chapter',
          chapterNumber: chapter?.number ?? '',
        };
      });

      result.set(prompt._id.toString(), enriched);
    }

    return result;
  }

  static async listForChapter(bookId: string, chapterId: string) {
    return ReflectionPrompt.find({
      isActive: true,
      targets: {
        $elemMatch: {
          bookId: new Types.ObjectId(bookId),
          chapterId: new Types.ObjectId(chapterId),
        },
      },
    }).sort({ order: 1, createdAt: -1 });
  }

  static async listAll() {
    return ReflectionPrompt.find().sort({ order: 1, createdAt: -1 });
  }

  static async listActive() {
    return ReflectionPrompt.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
  }

  static async getById(id: string) {
    const prompt = await ReflectionPrompt.findById(id);

    if (!prompt) {
      throw new AppError('Reflection prompt not found', 404);
    }

    return prompt;
  }

  static async create(input: CreateReflectionPromptInput) {
    const resolvedTargets = await this.resolveTargets(input.targets);
    const order =
      input.order ??
      ((await ReflectionPrompt.findOne().sort({ order: -1 }).select('order'))?.order ??
        -1) + 1;

    const prompt = await ReflectionPrompt.create({
      body: input.body,
      targets: resolvedTargets.map((target) => ({
        bookId: target.bookId,
        chapterId: target.chapterId,
      })),
      isActive: input.isActive ?? true,
      order,
    });

    return { prompt, targets: resolvedTargets };
  }

  static async update(id: string, input: UpdateReflectionPromptInput) {
    const prompt = await this.getById(id);

    if (input.body !== undefined) {
      prompt.body = input.body;
    }

    if (input.isActive !== undefined) {
      prompt.isActive = input.isActive;
    }

    if (input.order !== undefined) {
      prompt.order = input.order;
    }

    let enrichedTargets: EnrichedPromptTarget[] | undefined;

    if (input.targets !== undefined) {
      enrichedTargets = await this.resolveTargets(input.targets, id);
      prompt.targets = enrichedTargets.map((target) => ({
        bookId: target.bookId,
        chapterId: target.chapterId,
      }));
    }

    await prompt.save();

    if (!enrichedTargets) {
      const enrichment = await this.enrichTargets([prompt]);
      enrichedTargets = enrichment.get(prompt._id.toString());
    }

    return { prompt, targets: enrichedTargets ?? [] };
  }

  static async remove(id: string) {
    const prompt = await ReflectionPrompt.findByIdAndDelete(id);

    if (!prompt) {
      throw new AppError('Reflection prompt not found', 404);
    }

    return prompt;
  }
}
