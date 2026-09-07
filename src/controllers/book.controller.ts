import { Response } from 'express';
import { BookService } from '../services/book.service';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { CreateBookInput, UpdateBookInput } from '../validators/book.validator';

function getParam(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

export class BookController {
  static list = asyncHandler(async (_req, res: Response) => {
    const books = await BookService.listPublished();
    return sendSuccess(res, books, 'Books fetched successfully');
  });

  static listAll = asyncHandler(async (_req, res: Response) => {
    const books = await BookService.listAll();
    return sendSuccess(res, books, 'All books fetched successfully');
  });

  static getById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const isAdmin = req.user?.role === 'admin';
    const book = await BookService.getById(getParam(req.params.id), isAdmin);
    return sendSuccess(res, book, 'Book fetched successfully');
  });

  static create = asyncHandler(async (req, res: Response) => {
    const book = await BookService.create(req.body as CreateBookInput);
    return sendSuccess(res, book, 'Book created successfully', 201);
  });

  static update = asyncHandler(async (req, res: Response) => {
    const book = await BookService.update(
      getParam(req.params.id),
      req.body as UpdateBookInput,
    );
    return sendSuccess(res, book, 'Book updated successfully');
  });

  static remove = asyncHandler(async (req, res: Response) => {
    await BookService.remove(getParam(req.params.id));
    return sendSuccess(res, null, 'Book deleted successfully');
  });
}
