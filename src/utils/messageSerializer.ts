import { IMessageOfTheDay } from '../models/MessageOfTheDay';

export function serializeMessage(message: IMessageOfTheDay) {
  return {
    id: message._id.toString(),
    body: message.body,
    isActive: message.isActive,
    order: message.order,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
}

export function serializeMessages(messages: IMessageOfTheDay[]) {
  return messages.map(serializeMessage);
}
