import { toStoredMediaPath } from '../middleware/upload';
import { IBook, IChapter } from '../models/Book';

function serializeChapter(chapter: IChapter) {
  return {
    id: chapter._id.toString(),
    number: chapter.number,
    title: chapter.title,
    duration: chapter.duration,
    // Relative path only — clients prepend their API origin.
    audioUrl: toStoredMediaPath(chapter.audioUrl) ?? chapter.audioUrl,
    order: chapter.order,
  };
}

export function serializeBook(book: IBook) {
  const chapters = [...book.chapters].sort((a, b) => a.order - b.order).map(serializeChapter);

  return {
    id: book._id.toString(),
    title: book.title,
    author: book.author,
    description: book.description,
    shortBlurb: book.shortBlurb ?? '',
    coverUrl: toStoredMediaPath(book.coverUrl),
    isPublished: book.isPublished,
    isFeatured: book.isFeatured,
    chapters,
    createdAt: book.createdAt,
    updatedAt: book.updatedAt,
  };
}

export function serializeBooks(books: IBook[]) {
  return books.map(serializeBook);
}
