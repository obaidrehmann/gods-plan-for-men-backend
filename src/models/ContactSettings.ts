import { Document, Schema, model } from 'mongoose';

export type ContactSettingsFields = {
  email: string;
  phone: string;
  hours: string;
  replyTime: string;
};

export const DEFAULT_CONTACT_SETTINGS: ContactSettingsFields = {
  email: 'support@calmcompanion.com',
  phone: '+1 (800) 555-0142',
  hours: 'Mon–Fri, 9:00 AM – 6:00 PM EST',
  replyTime: 'Usually replies within a day',
};

export interface IContactSettings extends Document, ContactSettingsFields {
  key: string;
  createdAt: Date;
  updatedAt: Date;
}

const contactSettingsSchema = new Schema<IContactSettings>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'default',
    },
    email: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
      default: DEFAULT_CONTACT_SETTINGS.email,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
      default: DEFAULT_CONTACT_SETTINGS.phone,
    },
    hours: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
      default: DEFAULT_CONTACT_SETTINGS.hours,
    },
    replyTime: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
      default: DEFAULT_CONTACT_SETTINGS.replyTime,
    },
  },
  {
    timestamps: true,
  },
);

export const ContactSettings = model<IContactSettings>(
  'ContactSettings',
  contactSettingsSchema,
);
