import { Response } from 'express';
import { BookService } from '../services/book.service';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { serializeBook, serializeBooks } from '../utils/bookSerializer';
import { AppError } from '../utils/AppError';
import {
  CreateBookInput,
  CreateChapterInput,
  UpdateBookInput,
  UpdateChapterInput,
} from '../validators/book.validator';

function getParam(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

export class BookController {
  static list = asyncHandler(async (_req, res: Response) => {
    const books = await BookService.listPublished();
    return sendSuccess(res, serializeBooks(books), 'Books fetched successfully');
  });

  static listAll = asyncHandler(async (_req, res: Response) => {
    const books = await BookService.listAll();
    return sendSuccess(res, serializeBooks(books), 'All books fetched successfully');
  });

  static getById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const isAdmin = req.user?.role === 'admin';
    const book = await BookService.getById(getParam(req.params.id), isAdmin);
    return sendSuccess(res, serializeBook(book), 'Book fetched successfully');
  });

  static create = asyncHandler(async (req, res: Response) => {
    const cover = req.file;
    const book = await BookService.create(req.body as CreateBookInput, cover?.filename);
    return sendSuccess(res, serializeBook(book), 'Book created successfully', 201);
  });

  static update = asyncHandler(async (req, res: Response) => {
    const book = await BookService.update(
      getParam(req.params.id),
      req.body as UpdateBookInput,
    );
    return sendSuccess(res, serializeBook(book), 'Book updated successfully');
  });

  static uploadCover = asyncHandler(async (req, res: Response) => {
    if (!req.file) {
      throw new AppError('Cover image is required', 400);
    }

    const book = await BookService.updateCover(getParam(req.params.id), req.file.filename);
    return sendSuccess(res, serializeBook(book), 'Cover updated successfully');
  });

  static remove = asyncHandler(async (req, res: Response) => {
    await BookService.remove(getParam(req.params.id));
    return sendSuccess(res, null, 'Book deleted successfully');
  });

  static addChapter = asyncHandler(async (req, res: Response) => {
    if (!req.file) {
      throw new AppError('Chapter audio file is required', 400);
    }

    const book = await BookService.addChapter(
      getParam(req.params.id),
      req.body as CreateChapterInput,
      req.file.filename,
    );
    return sendSuccess(res, serializeBook(book), 'Chapter added successfully', 201);
  });

  static updateChapter = asyncHandler(async (req, res: Response) => {
    const book = await BookService.updateChapter(
      getParam(req.params.id),
      getParam(req.params.chapterId),
      req.body as UpdateChapterInput,
      req.file?.filename,
    );
    return sendSuccess(res, serializeBook(book), 'Chapter updated successfully');
  });

  static removeChapter = asyncHandler(async (req, res: Response) => {
    const book = await BookService.removeChapter(
      getParam(req.params.id),
      getParam(req.params.chapterId),
    );
    return sendSuccess(res, serializeBook(book), 'Chapter deleted successfully');
  });
}
