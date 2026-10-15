import {
  ContactSettings,
  DEFAULT_CONTACT_SETTINGS,
  LEGACY_PLACEHOLDER_PHONES,
  LEGACY_TEMPLATE_SUPPORT_EMAIL,
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
    } else {
      let replacedPlaceholder = false;

      if (settings.email.trim().toLowerCase() === LEGACY_TEMPLATE_SUPPORT_EMAIL) {
        settings.email = DEFAULT_CONTACT_SETTINGS.email;
        replacedPlaceholder = true;
      }

      if (LEGACY_PLACEHOLDER_PHONES.includes(settings.phone.trim())) {
        settings.phone = DEFAULT_CONTACT_SETTINGS.phone;
        replacedPlaceholder = true;
      }

      if (replacedPlaceholder) {
        await settings.save();
      }
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
