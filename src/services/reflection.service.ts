import { Types } from 'mongoose';
import { toStoredMediaPath } from '../middleware/upload';
import { Book } from '../models/Book';
import { IReflection, Reflection } from '../models/Reflection';
import { AppError } from '../utils/AppError';
import {
  CreateReflectionInput,
  ReflectionMessageInput,
  UpdateReflectionInput,
} from '../validators/reflection.validator';

type ChapterSnapshot = {
  chapterId: Types.ObjectId;
  bookTitle: string;
  chapterTitle: string;
  chapterNumber: string;
  chapterImageUrl: string | null;
};

export class ReflectionService {
  private static async resolveChapter(
    bookId: string,
    chapterId: string,
  ): Promise<ChapterSnapshot & { bookId: Types.ObjectId }> {
    const book = await Book.findById(bookId);

    if (!book) {
      throw new AppError('Book not found', 404);
    }

    const chapter = book.chapters.id(chapterId);

    if (!chapter) {
      throw new AppError('Chapter not found', 404);
    }

    const imageSource = chapter.imageUrl || book.coverUrl || null;

    return {
      bookId: book._id as Types.ObjectId,
      chapterId: chapter._id as Types.ObjectId,
      bookTitle: book.title,
      chapterTitle: chapter.title,
      chapterNumber: chapter.number,
      chapterImageUrl: imageSource ? toStoredMediaPath(imageSource) : null,
    };
  }

  private static assertPrivate(reflection: IReflection) {
    if (reflection.status === 'submitted') {
      throw new AppError('Submitted reflections cannot be modified', 403);
    }
  }

  private static async getOwned(id: string, userId: string) {
    const reflection = await Reflection.findById(id);

    if (!reflection || reflection.userId.toString() !== userId) {
      throw new AppError('Reflection not found', 404);
    }

    return reflection;
  }

  /** Move legacy adminResponse into messages[] once, so conversation is canonical. */
  private static migrateLegacyMessages(reflection: IReflection) {
    if ((reflection.messages?.length ?? 0) > 0) {
      return;
    }

    if (!reflection.adminResponse?.trim()) {
      return;
    }

    reflection.messages.push({
      role: 'admin',
      body: reflection.adminResponse,
      authorId:
        reflection.adminRespondedBy ??
        (reflection.userId as Types.ObjectId),
      createdAt: reflection.adminRespondedAt ?? reflection.updatedAt ?? new Date(),
    } as never);
  }

  private static appendMessage(
    reflection: IReflection,
    role: 'admin' | 'user',
    authorId: string,
    body: string,
  ) {
    this.migrateLegacyMessages(reflection);

    const now = new Date();
    reflection.messages.push({
      role,
      body,
      authorId: new Types.ObjectId(authorId),
      createdAt: now,
    } as never);

    if (role === 'admin') {
      reflection.adminResponse = body;
      reflection.adminRespondedAt = now;
      reflection.adminRespondedBy = new Types.ObjectId(authorId);
      reflection.userSeenAdminResponseAt = null;
    }

    return now;
  }

  static async listMine(userId: string) {
    return Reflection.find({ userId }).sort({ createdAt: -1 });
  }

  static async getMine(id: string, userId: string) {
    return this.getOwned(id, userId);
  }

  static async create(userId: string, input: CreateReflectionInput) {
    const chapter = await this.resolveChapter(input.bookId, input.chapterId);
    const title = input.title?.trim() || chapter.chapterTitle;

    return Reflection.create({
      userId,
      bookId: chapter.bookId,
      chapterId: chapter.chapterId,
      title,
      body: input.body,
      status: 'private',
      messages: [],
      bookTitle: chapter.bookTitle,
      chapterTitle: chapter.chapterTitle,
      chapterNumber: chapter.chapterNumber,
      chapterImageUrl: chapter.chapterImageUrl,
    });
  }

  static async update(id: string, userId: string, input: UpdateReflectionInput) {
    const reflection = await this.getOwned(id, userId);
    this.assertPrivate(reflection);

    if (input.bookId && input.chapterId) {
      const chapter = await this.resolveChapter(input.bookId, input.chapterId);
      reflection.bookId = chapter.bookId;
      reflection.chapterId = chapter.chapterId;
      reflection.bookTitle = chapter.bookTitle;
      reflection.chapterTitle = chapter.chapterTitle;
      reflection.chapterNumber = chapter.chapterNumber;
      reflection.chapterImageUrl = chapter.chapterImageUrl;
    }

    if (input.title !== undefined) {
      reflection.title = input.title;
    }

    if (input.body !== undefined) {
      reflection.body = input.body;
    }

    await reflection.save();
    return reflection;
  }

  static async remove(id: string, userId: string) {
    const reflection = await this.getOwned(id, userId);
    this.assertPrivate(reflection);
    await reflection.deleteOne();
    return reflection;
  }

  static async submit(id: string, userId: string) {
    const reflection = await this.getOwned(id, userId);

    if (reflection.status === 'submitted') {
      throw new AppError('Reflection is already submitted', 400);
    }

    reflection.status = 'submitted';
    reflection.submittedAt = new Date();
    await reflection.save();
    return reflection;
  }

  static async listSubmittedForAdmin() {
    return Reflection.find({ status: 'submitted' })
      .populate('userId', 'name email')
      .sort({ submittedAt: -1, createdAt: -1 });
  }

  static async getSubmittedForAdmin(id: string) {
    const reflection = await Reflection.findOne({
      _id: id,
      status: 'submitted',
    }).populate('userId', 'name email');

    if (!reflection) {
      throw new AppError('Reflection not found', 404);
    }

    return reflection;
  }

  static async respondAsAdmin(
    id: string,
    adminId: string,
    input: ReflectionMessageInput,
  ) {
    const reflection = await Reflection.findOne({
      _id: id,
      status: 'submitted',
    }).populate('userId', 'name email');

    if (!reflection) {
      throw new AppError('Reflection not found', 404);
    }

    this.appendMessage(reflection, 'admin', adminId, input.body ?? input.response ?? '');
    await reflection.save();
    return reflection;
  }

  static async replyAsUser(id: string, userId: string, input: ReflectionMessageInput) {
    const reflection = await this.getOwned(id, userId);

    if (reflection.status !== 'submitted') {
      throw new AppError('Only submitted reflections can receive replies', 400);
    }

    this.appendMessage(
      reflection,
      'user',
      userId,
      input.body ?? input.response ?? '',
    );
    await reflection.save();
    return reflection;
  }

  static async countPendingForAdmin() {
    const submitted = await Reflection.find({ status: 'submitted' }).select(
      'messages adminResponse',
    );

    return submitted.filter((reflection) => {
      const messages = reflection.messages ?? [];
      if (messages.length === 0) {
        return !reflection.adminResponse?.trim();
      }
      return messages[messages.length - 1].role === 'user';
    }).length;
  }

  static async countUnreadAdminRepliesForUser(userId: string) {
    const reflections = await Reflection.find({
      userId,
      status: 'submitted',
    }).select('messages adminResponse adminRespondedAt userSeenAdminResponseAt');

    return reflections.filter((reflection) => {
      const messages = reflection.messages ?? [];
      let lastAdminAt: Date | null = null;

      if (messages.length > 0) {
        for (let index = messages.length - 1; index >= 0; index -= 1) {
          if (messages[index].role === 'admin') {
            lastAdminAt = messages[index].createdAt;
            break;
          }
        }
      } else if (reflection.adminResponse?.trim()) {
        lastAdminAt = reflection.adminRespondedAt ?? null;
      }

      if (!lastAdminAt) return false;
      if (!reflection.userSeenAdminResponseAt) return true;
      return reflection.userSeenAdminResponseAt < lastAdminAt;
    }).length;
  }

  static async markAdminRepliesSeen(userId: string) {
    const now = new Date();
    const reflections = await Reflection.find({
      userId,
      status: 'submitted',
    }).select('_id messages adminResponse adminRespondedAt userSeenAdminResponseAt');

    const idsToUpdate: Types.ObjectId[] = [];

    for (const reflection of reflections) {
      const messages = reflection.messages ?? [];
      let lastAdminAt: Date | null = null;

      if (messages.length > 0) {
        for (let index = messages.length - 1; index >= 0; index -= 1) {
          if (messages[index].role === 'admin') {
            lastAdminAt = messages[index].createdAt;
            break;
          }
        }
      } else if (reflection.adminResponse?.trim()) {
        lastAdminAt = reflection.adminRespondedAt ?? null;
      }

      if (!lastAdminAt) continue;
      if (
        !reflection.userSeenAdminResponseAt ||
        reflection.userSeenAdminResponseAt < lastAdminAt
      ) {
        idsToUpdate.push(reflection._id as Types.ObjectId);
      }
    }

    if (!idsToUpdate.length) {
      return 0;
    }

    const result = await Reflection.updateMany(
      { _id: { $in: idsToUpdate } },
      { $set: { userSeenAdminResponseAt: now } },
    );
    return result.modifiedCount;
  }
}
