import { toStoredMediaPath } from '../middleware/upload';
import { IReflection, IReflectionMessage } from '../models/Reflection';

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

export type SerializedReflectionMessage = {
  id: string;
  role: 'admin' | 'user';
  body: string;
  authorId: string;
  createdAt: Date;
};

function getConversationMessages(reflection: IReflection): SerializedReflectionMessage[] {
  const stored = (reflection.messages ?? []).map((message: IReflectionMessage) => ({
    id: message._id.toString(),
    role: message.role,
    body: message.body,
    authorId: message.authorId.toString(),
    createdAt: message.createdAt,
  }));

  if (stored.length > 0) {
    return stored.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }

  // Legacy single-reply documents
  if (reflection.adminResponse?.trim()) {
    return [
      {
        id: `legacy-${reflection._id.toString()}`,
        role: 'admin',
        body: reflection.adminResponse,
        authorId: reflection.adminRespondedBy?.toString() ?? '',
        createdAt: reflection.adminRespondedAt ?? reflection.updatedAt,
      },
    ];
  }

  return [];
}

function getLastAdminMessage(messages: SerializedReflectionMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].role === 'admin') {
      return messages[index];
    }
  }
  return null;
}

function hasUnreadAdminResponse(
  messages: SerializedReflectionMessage[],
  userSeenAdminResponseAt?: Date | null,
) {
  const lastAdmin = getLastAdminMessage(messages);
  if (!lastAdmin) return false;
  if (!userSeenAdminResponseAt) return true;
  return new Date(userSeenAdminResponseAt) < new Date(lastAdmin.createdAt);
}

export function serializeReflection(reflection: IReflection) {
  const user = isPopulatedUser(reflection.userId)
    ? {
        id: reflection.userId._id.toString(),
        name: reflection.userId.name,
        email: reflection.userId.email,
      }
    : undefined;

  const messages = getConversationMessages(reflection);
  const lastAdmin = getLastAdminMessage(messages);
  const lastMessage = messages[messages.length - 1] ?? null;

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
    messages,
    adminResponse: lastAdmin?.body ?? null,
    adminRespondedAt: lastAdmin?.createdAt ?? null,
    userSeenAdminResponseAt: reflection.userSeenAdminResponseAt ?? null,
    hasUnreadAdminResponse: hasUnreadAdminResponse(
      messages,
      reflection.userSeenAdminResponseAt,
    ),
    awaitingAdminReply:
      reflection.status === 'submitted' &&
      (!lastMessage || lastMessage.role === 'user'),
    bookTitle: reflection.bookTitle,
    chapterTitle: reflection.chapterTitle,
    chapterNumber: reflection.chapterNumber,
    chapterImageUrl: reflection.chapterImageUrl
      ? toStoredMediaPath(reflection.chapterImageUrl)
      : null,
    createdAt: reflection.createdAt,
    updatedAt: reflection.updatedAt,
    ...(user ? { user } : {}),
  };
}

export function serializeReflections(reflections: IReflection[]) {
  return reflections.map(serializeReflection);
}
