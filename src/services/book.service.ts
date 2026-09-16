import { Book, IBook } from '../models/Book';
import {
  audioPublicPath,
  chapterImagePublicPath,
  coverPublicPath,
  deleteUploadedFile,
  pdfPublicPath,
} from '../middleware/upload';
import { AppError } from '../utils/AppError';
import {
  CreateBookInput,
  CreateChapterInput,
  UpdateBookInput,
  UpdateChapterInput,
} from '../validators/book.validator';
import { PurchaseService } from './purchase.service';
import { FavoriteService } from './favorite.service';
import { BookReview } from '../models/BookReview';

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

  static async updatePdf(id: string, pdfFilename: string) {
    const book = await Book.findById(id);

    if (!book) {
      throw new AppError('Book not found', 404);
    }

    deleteUploadedFile(book.pdfUrl);
    book.pdfUrl = pdfPublicPath(pdfFilename);
    await book.save();
    return book;
  }

  static async removePdf(id: string) {
    const book = await Book.findById(id);

    if (!book) {
      throw new AppError('Book not found', 404);
    }

    deleteUploadedFile(book.pdfUrl);
    book.pdfUrl = undefined;
    await book.save();
    return book;
  }

  static async remove(id: string) {
    const book = await Book.findById(id);

    if (!book) {
      throw new AppError('Book not found', 404);
    }

    deleteUploadedFile(book.coverUrl);
    deleteUploadedFile(book.pdfUrl);
    for (const chapter of book.chapters) {
      deleteUploadedFile(chapter.audioUrl);
      deleteUploadedFile(chapter.imageUrl);
    }

    await PurchaseService.removeForBook(book._id.toString());
    await FavoriteService.removeForBook(book._id.toString());
    await BookReview.deleteMany({ bookId: book._id });
    await book.deleteOne();
    return book;
  }

  static async addChapter(
    bookId: string,
    input: CreateChapterInput,
    audioFilename?: string,
    imageFilename?: string,
  ) {
    const book = await Book.findById(bookId);

    if (!book) {
      throw new AppError('Book not found', 404);
    }

    const textContent = input.textContent?.trim() ?? '';
    const hasAudio = Boolean(audioFilename);
    const mediaType = book.mediaType ?? 'both';

    if (mediaType === 'audio' && !hasAudio) {
      throw new AppError('Chapter audio file is required for audio books', 400);
    }

    if (mediaType === 'readable' && !textContent) {
      throw new AppError('Chapter text is required for readable books', 400);
    }

    if (mediaType === 'both' && !hasAudio && !textContent) {
      throw new AppError('Provide chapter audio and/or chapter text', 400);
    }

    const order = input.order ?? book.chapters.length;
    book.chapters.push({
      number: input.number,
      title: input.title,
      duration: input.duration ?? '',
      audioUrl: audioFilename ? audioPublicPath(audioFilename) : '',
      imageUrl: imageFilename ? chapterImagePublicPath(imageFilename) : '',
      textContent,
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
    imageFilename?: string,
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
    if (input.textContent !== undefined) chapter.textContent = input.textContent;

    if (audioFilename) {
      deleteUploadedFile(chapter.audioUrl);
      chapter.audioUrl = audioPublicPath(audioFilename);
    }

    if (imageFilename) {
      deleteUploadedFile(chapter.imageUrl);
      chapter.imageUrl = chapterImagePublicPath(imageFilename);
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
    deleteUploadedFile(chapter.imageUrl);
    chapter.deleteOne();
    await book.save();
    return book;
  }
}
