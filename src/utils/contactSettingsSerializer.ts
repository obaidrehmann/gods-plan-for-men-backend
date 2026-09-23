import { IContactSettings } from '../models/ContactSettings';

export function serializeContactSettings(settings: IContactSettings) {
  return {
    id: settings._id.toString(),
    email: settings.email,
    phone: settings.phone,
    hours: settings.hours,
    replyTime: settings.replyTime,
    updatedAt: settings.updatedAt,
  };
}
