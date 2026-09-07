import { Book, IBook } from '../models/Book';
import {
  audioPublicPath,
  coverPublicPath,
  deleteUploadedFile,
} from '../middleware/upload';
import { AppError } from '../utils/AppError';
import {
  CreateBookInput,
  CreateChapterInput,
  UpdateBookInput,
  UpdateChapterInput,
} from '../validators/book.validator';

export class BookService {
  static async listPublished() {
    return Book.find({ isPublished: true }).sort({ isFeatured: -1, createdAt: -1 });
  }

  static async listAll() {
    return Book.find().sort({ createdAt: -1 });
  }

  static async getById(id: string, includeUnpublished = false) {
    const query = includeUnpublished ? { _id: id } : { _id: id, isPublished: true };
    const book = await Book.findOne(query);

    if (!book) {
      throw new AppError('Book not found', 404);
    }

    return book;
  }

  private static async clearOtherFeatured(exceptId?: string) {
    const filter = exceptId ? { _id: { $ne: exceptId }, isFeatured: true } : { isFeatured: true };
    await Book.updateMany(filter, { $set: { isFeatured: false } });
  }

  static async create(input: CreateBookInput, coverFilename?: string) {
    if (input.isFeatured) {
      await this.clearOtherFeatured();
    }

    return Book.create({
      ...input,
      coverUrl: coverFilename ? coverPublicPath(coverFilename) : undefined,
      chapters: [],
    });
  }

  static async update(id: string, input: UpdateBookInput) {
    if (input.isFeatured === true) {
      await this.clearOtherFeatured(id);
    }

    const book = await Book.findByIdAndUpdate(id, input, {
      new: true,
      runValidators: true,
    });

    if (!book) {
      throw new AppError('Book not found', 404);
    }

    return book;
  }

  static async updateCover(id: string, coverFilename: string) {
    const book = await Book.findById(id);

    if (!book) {
      throw new AppError('Book not found', 404);
    }

    deleteUploadedFile(book.coverUrl);
    book.coverUrl = coverPublicPath(coverFilename);
    await book.save();
    return book;
  }

  static async remove(id: string) {
    const book = await Book.findById(id);

    if (!book) {
      throw new AppError('Book not found', 404);
    }

    deleteUploadedFile(book.coverUrl);
    for (const chapter of book.chapters) {
      deleteUploadedFile(chapter.audioUrl);
    }

    await book.deleteOne();
    return book;
  }

  static async addChapter(bookId: string, input: CreateChapterInput, audioFilename: string) {
    const book = await Book.findById(bookId);

    if (!book) {
      throw new AppError('Book not found', 404);
    }

    const order = input.order ?? book.chapters.length;
    book.chapters.push({
      number: input.number,
      title: input.title,
      duration: input.duration,
      audioUrl: audioPublicPath(audioFilename),
      order,
    } as IBook['chapters'][number]);

    await book.save();
    return book;
  }

  static async updateChapter(
    bookId: string,
    chapterId: string,
    input: UpdateChapterInput,
    audioFilename?: string,
  ) {
    const book = await Book.findById(bookId);

    if (!book) {
      throw new AppError('Book not found', 404);
    }

    const chapter = book.chapters.id(chapterId);

    if (!chapter) {
      throw new AppError('Chapter not found', 404);
    }

    if (input.number !== undefined) chapter.number = input.number;
    if (input.title !== undefined) chapter.title = input.title;
    if (input.duration !== undefined) chapter.duration = input.duration;
    if (input.order !== undefined) chapter.order = input.order;

    if (audioFilename) {
      deleteUploadedFile(chapter.audioUrl);
      chapter.audioUrl = audioPublicPath(audioFilename);
    }

    await book.save();
    return book;
  }

  static async removeChapter(bookId: string, chapterId: string) {
    const book = await Book.findById(bookId);

    if (!book) {
      throw new AppError('Book not found', 404);
    }

    const chapter = book.chapters.id(chapterId);

    if (!chapter) {
      throw new AppError('Chapter not found', 404);
    }

    deleteUploadedFile(chapter.audioUrl);
    chapter.deleteOne();
    await book.save();
    return book;
  }
}
