import { z } from 'zod';

export const EnquirySchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(120),
  email: z.string().email('A valid email address is required'),
  phone: z.string().max(30).optional().nullable(),
  nationality: z.string().max(80).optional().nullable(),
  travelDate: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val ? new Date(val) : null))
    .refine((val) => val === null || !isNaN(val!.getTime()), { message: 'Invalid travel date' }),
  groupSize: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val ? Number(val) : null))
    .refine((val) => val === null || (Number.isInteger(val) && val > 0 && val <= 500), {
      message: 'Group size must be a positive number'
    }),
  budgetRange: z.string().max(80).optional().nullable(),
  tripLengthDays: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val ? Number(val) : null))
    .refine((val) => val === null || (Number.isInteger(val) && val > 0 && val <= 90), {
      message: 'Trip length must be between 1 and 90 days'
    }),
  message: z.string().max(2000).optional().nullable()
});

export type EnquiryInput = z.infer<typeof EnquirySchema>;

export const ItineraryGenerateSchema = z.object({
  attractionIds: z
    .array(z.string().cuid())
    .min(1, 'Select at least one attraction')
    .max(30),
  days: z.number().int().min(1).max(14),
  budget: z.enum(['Budget', 'Mid-range', 'Premium', 'Luxury']).default('Mid-range'),
  pace: z.enum(['Relaxed', 'Balanced', 'Packed']).default('Balanced'),
  groupType: z.string().max(60).default('Couple')
});

export type ItineraryGenerateInput = z.infer<typeof ItineraryGenerateSchema>;

export const AIGenerateSchema = z.object({
  days: z.number().int().min(1).max(14),
  groupType: z.string().max(60),
  budget: z.string().max(60),
  pace: z.string().max(60),
  interests: z.array(z.string().max(60)).min(1).max(10),
  mustSee: z.array(z.string().max(100)).max(20).optional()
});

export type AIGenerateInput = z.infer<typeof AIGenerateSchema>;
