import { ITermsSettings } from '../models/TermsSettings';

export function serializeTermsSettings(settings: ITermsSettings) {
  return {
    id: settings._id.toString(),
    lastUpdatedLabel: settings.lastUpdatedLabel,
    sections: settings.sections.map((section) => ({
      title: section.title,
      body: section.body,
    })),
    updatedAt: settings.updatedAt,
  };
}
