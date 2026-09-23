import {
  DEFAULT_TERMS_SETTINGS,
  TermsSettings,
} from '../models/TermsSettings';
import { UpdateTermsSettingsInput } from '../validators/termsSettings.validator';

const SETTINGS_KEY = 'default';

export class TermsSettingsService {
  static async getOrCreate() {
    let settings = await TermsSettings.findOne({ key: SETTINGS_KEY });

    if (!settings) {
      settings = await TermsSettings.create({
        key: SETTINGS_KEY,
        ...DEFAULT_TERMS_SETTINGS,
      });
    }

    return settings;
  }

  static async update(input: UpdateTermsSettingsInput) {
    const settings = await this.getOrCreate();

    if (input.lastUpdatedLabel !== undefined) {
      settings.lastUpdatedLabel = input.lastUpdatedLabel;
    }

    if (input.sections !== undefined) {
      settings.sections = input.sections;
    }

    await settings.save();
    return settings;
  }
}
