import { Book } from '../models/Book';
import { AppError } from '../utils/AppError';
import { CreateBookInput, UpdateBookInput } from '../validators/book.validator';

export class BookService {
  static async listPublished() {
    return Book.find({ isPublished: true }).sort({ createdAt: -1 });
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

  static async create(input: CreateBookInput) {
    return Book.create(input);
  }

  static async update(id: string, input: UpdateBookInput) {
    const book = await Book.findByIdAndUpdate(id, input, {
      new: true,
      runValidators: true,
    });

    if (!book) {
      throw new AppError('Book not found', 404);
    }

    return book;
  }

  static async remove(id: string) {
    const book = await Book.findByIdAndDelete(id);

    if (!book) {
      throw new AppError('Book not found', 404);
    }

    return book;
  }
}
