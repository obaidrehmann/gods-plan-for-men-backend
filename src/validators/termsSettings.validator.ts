import { z } from 'zod';

const termsSectionSchema = z.object({
  title: z.string().trim().min(1, 'Section title is required').max(200),
  body: z.string().trim().min(1, 'Section body is required').max(10000),
});

export const updateTermsSettingsSchema = z
  .object({
    lastUpdatedLabel: z
      .string()
      .trim()
      .min(1, 'Last updated label is required')
      .max(100)
      .optional(),
    sections: z
      .array(termsSectionSchema)
      .min(1, 'At least one section is required')
      .max(50)
      .optional(),
  })
  .refine(
    (data) => data.lastUpdatedLabel !== undefined || data.sections !== undefined,
    { message: 'At least one terms field is required' },
  );

export type UpdateTermsSettingsInput = z.infer<typeof updateTermsSettingsSchema>;
