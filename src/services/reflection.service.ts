import { Types } from 'mongoose';
import { Book } from '../models/Book';
import { IReflection, Reflection } from '../models/Reflection';
import { AppError } from '../utils/AppError';
import {
  CreateReflectionInput,
  UpdateReflectionInput,
} from '../validators/reflection.validator';

type ChapterSnapshot = {
  chapterId: Types.ObjectId;
  bookTitle: string;
  chapterTitle: string;
  chapterNumber: string;
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

    return {
      bookId: book._id as Types.ObjectId,
      chapterId: chapter._id as Types.ObjectId,
      bookTitle: book.title,
      chapterTitle: chapter.title,
      chapterNumber: chapter.number,
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
      bookTitle: chapter.bookTitle,
      chapterTitle: chapter.chapterTitle,
      chapterNumber: chapter.chapterNumber,
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
}
