import { IBookReview } from '../models/BookReview';

type PopulatedUser = {
  _id: { toString(): string };
  name: string;
  email: string;
};

function isPopulatedUser(value: unknown): value is PopulatedUser {
  return (
    typeof value === 'object' &&
    value !== null &&
    '_id' in value &&
    'name' in value &&
    'email' in value
  );
}

export function serializeBookReview(review: IBookReview) {
  const user = isPopulatedUser(review.userId)
    ? {
        id: review.userId._id.toString(),
        name: review.userId.name,
        email: review.userId.email,
      }
    : undefined;

  return {
    id: review._id.toString(),
    userId: isPopulatedUser(review.userId)
      ? review.userId._id.toString()
      : review.userId.toString(),
    bookId: review.bookId.toString(),
    bookTitle: review.bookTitle,
    rating: review.rating,
    comment: review.comment ?? '',
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    ...(user ? { user } : {}),
  };
}

export function serializeBookReviews(reviews: IBookReview[]) {
  return reviews.map(serializeBookReview);
}
