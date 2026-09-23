import {
  ContactSettings,
  DEFAULT_CONTACT_SETTINGS,
} from '../models/ContactSettings';
import { UpdateContactSettingsInput } from '../validators/contactSettings.validator';

const SETTINGS_KEY = 'default';

export class ContactSettingsService {
  static async getOrCreate() {
    let settings = await ContactSettings.findOne({ key: SETTINGS_KEY });

    if (!settings) {
      settings = await ContactSettings.create({
        key: SETTINGS_KEY,
        ...DEFAULT_CONTACT_SETTINGS,
      });
    }

    return settings;
  }

  static async update(input: UpdateContactSettingsInput) {
    const settings = await this.getOrCreate();

    if (input.email !== undefined) {
      settings.email = input.email;
    }
    if (input.phone !== undefined) {
      settings.phone = input.phone;
    }
    if (input.hours !== undefined) {
      settings.hours = input.hours;
    }
    if (input.replyTime !== undefined) {
      settings.replyTime = input.replyTime;
    }

    await settings.save();
    return settings;
  }
}
