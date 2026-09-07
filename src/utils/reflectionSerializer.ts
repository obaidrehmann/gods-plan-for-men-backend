import { IReflection } from '../models/Reflection';

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

export function serializeReflection(reflection: IReflection) {
  const user = isPopulatedUser(reflection.userId)
    ? {
        id: reflection.userId._id.toString(),
        name: reflection.userId.name,
        email: reflection.userId.email,
      }
    : undefined;

  return {
    id: reflection._id.toString(),
    userId: isPopulatedUser(reflection.userId)
      ? reflection.userId._id.toString()
      : reflection.userId.toString(),
    bookId: reflection.bookId.toString(),
    chapterId: reflection.chapterId.toString(),
    title: reflection.title,
    body: reflection.body,
    status: reflection.status,
    submittedAt: reflection.submittedAt ?? null,
    bookTitle: reflection.bookTitle,
    chapterTitle: reflection.chapterTitle,
    chapterNumber: reflection.chapterNumber,
    createdAt: reflection.createdAt,
    updatedAt: reflection.updatedAt,
    ...(user ? { user } : {}),
  };
}

export function serializeReflections(reflections: IReflection[]) {
  return reflections.map(serializeReflection);
}
