import { Document, Schema, model } from 'mongoose';

export type TermsSection = {
  title: string;
  body: string;
};

export type TermsSettingsFields = {
  lastUpdatedLabel: string;
  sections: TermsSection[];
};

export const DEFAULT_TERMS_SETTINGS: TermsSettingsFields = {
  lastUpdatedLabel: 'August 1, 2026',
  sections: [
    {
      title: '1. Using the Companion',
      body: 'This app is offered as a quiet space for reading, listening, and private reflection. Use it in a way that honors your own pace and the content provided.',
    },
    {
      title: '2. Your Reflections',
      body: 'Entries you write stay private to your account. We do not publish or share your reflections with other readers.',
    },
    {
      title: '3. Audio and Reading',
      body: 'Chapters, audio, and related materials are for personal, non-commercial use within the app. Please do not redistribute downloaded files.',
    },
    {
      title: '4. Account Care',
      body: 'You are responsible for keeping your sign-in details safe. Let us know if you believe someone else has used your account.',
    },
    {
      title: '5. Changes',
      body: 'We may update these terms as the companion grows. Continued use after an update means you accept the revised terms.',
    },
  ],
};

export interface ITermsSettings extends Document, TermsSettingsFields {
  key: string;
  createdAt: Date;
  updatedAt: Date;
}

const termsSectionSchema = new Schema<TermsSection>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10000,
    },
  },
  { _id: false },
);

const termsSettingsSchema = new Schema<ITermsSettings>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'default',
    },
    lastUpdatedLabel: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      default: DEFAULT_TERMS_SETTINGS.lastUpdatedLabel,
    },
    sections: {
      type: [termsSectionSchema],
      required: true,
      default: DEFAULT_TERMS_SETTINGS.sections,
      validate: {
        validator(value: TermsSection[]) {
          return Array.isArray(value) && value.length > 0 && value.length <= 50;
        },
        message: 'Terms must include between 1 and 50 sections',
      },
    },
  },
  {
    timestamps: true,
  },
);

export const TermsSettings = model<ITermsSettings>('TermsSettings', termsSettingsSchema);
