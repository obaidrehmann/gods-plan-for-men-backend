import { toStoredMediaPath } from '../middleware/upload';
import { IBook, IChapter } from '../models/Book';

function serializeChapter(chapter: IChapter, includeReadableContent: boolean) {
  return {
    id: chapter._id.toString(),
    number: chapter.number,
    title: chapter.title,
    duration: chapter.duration ?? '',
    // Relative path only — clients prepend their API origin.
    audioUrl: chapter.audioUrl ? toStoredMediaPath(chapter.audioUrl) ?? chapter.audioUrl : '',
    imageUrl: chapter.imageUrl ? toStoredMediaPath(chapter.imageUrl) ?? chapter.imageUrl : '',
    textContent: includeReadableContent ? chapter.textContent ?? '' : '',
    hasTextContent: Boolean(chapter.textContent?.trim()),
    pdfUrl: includeReadableContent ? toStoredMediaPath(chapter.pdfUrl) : null,
    hasPdf: Boolean(chapter.pdfUrl?.trim()),
    order: chapter.order,
  };
}

type SerializeBookOptions = {
  isPurchased?: boolean;
  isFavorite?: boolean;
  averageRating?: number;
  ratingCount?: number;
  myReview?: {
    id: string;
    rating: number;
    comment: string;
  } | null;
};

export function serializeBook(book: IBook, options: SerializeBookOptions = {}) {
  const includeReadableContent = Boolean(options.isPurchased);
  const chapters = [...book.chapters]
    .sort((a, b) => a.order - b.order)
    .map((chapter) => serializeChapter(chapter, includeReadableContent));

  return {
    id: book._id.toString(),
    title: book.title,
    author: book.author,
    description: book.description,
    shortBlurb: book.shortBlurb ?? '',
    coverUrl: toStoredMediaPath(book.coverUrl),
    price: Number(book.price ?? 0),
    currency: (book.currency ?? 'USD').toUpperCase(),
    mediaType: book.mediaType ?? 'both',
    isPublished: book.isPublished,
    isFeatured: book.isFeatured,
    isPurchased: options.isPurchased ?? false,
    isFavorite: options.isFavorite ?? false,
    averageRating: options.averageRating ?? 0,
    ratingCount: options.ratingCount ?? 0,
    myReview: options.myReview ?? null,
    chapters,
    createdAt: book.createdAt,
    updatedAt: book.updatedAt,
  };
}

export function serializeBooks(books: IBook[]) {
  return books.map((book) => serializeBook(book));
}
