import { MessageOfTheDay } from '../models/MessageOfTheDay';
import { AppError } from '../utils/AppError';
import {
  CreateMessageInput,
  UpdateMessageInput,
} from '../validators/message.validator';

export class MessageService {
  static async listActive() {
    return MessageOfTheDay.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
  }

  static async listAll() {
    return MessageOfTheDay.find().sort({ order: 1, createdAt: -1 });
  }

  static async getById(id: string) {
    const message = await MessageOfTheDay.findById(id);

    if (!message) {
      throw new AppError('Message not found', 404);
    }

    return message;
  }

  static async create(input: CreateMessageInput) {
    const order =
      input.order ??
      ((await MessageOfTheDay.findOne().sort({ order: -1 }).select('order'))?.order ?? -1) + 1;

    return MessageOfTheDay.create({
      body: input.body,
      isActive: input.isActive ?? true,
      order,
    });
  }

  static async update(id: string, input: UpdateMessageInput) {
    const message = await MessageOfTheDay.findByIdAndUpdate(id, input, {
      new: true,
      runValidators: true,
    });

    if (!message) {
      throw new AppError('Message not found', 404);
    }

    return message;
  }

  static async remove(id: string) {
    const message = await MessageOfTheDay.findByIdAndDelete(id);

    if (!message) {
      throw new AppError('Message not found', 404);
    }

    return message;
  }
}
