import { z } from 'zod';

// Inquiry type enum
export const InquiryTypeSchema = z.enum([
  'WEDDING',
  'PORTRAIT',
  'COMMERCIAL',
  'EVENT',
  'FAMILY',
  'PRODUCT',
  'REAL_ESTATE',
  'HEADSHOT',
  'OTHER',
]);

// Inquiry status enum
export const InquiryStatusSchema = z.enum([
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'PROPOSAL_SENT',
  'NEGOTIATING',
  'CONVERTED',
  'REJECTED',
  'ARCHIVED',
]);

// Create inquiry schema (public form submission)
export const CreateInquirySchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(255),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(5, 'Phone number is required').max(20),
  company: z.string().max(255).optional().nullable(),
  inquiryType: InquiryTypeSchema,
  shootDate: z.string().datetime().optional().nullable(),
  shootDescription: z.string().min(10, 'Shoot description must be at least 10 characters'),
  location: z.string().max(255).optional().nullable(),
  specialRequirements: z.string().optional().nullable(),
  budgetMin: z.number().positive().optional().nullable(),
  budgetMax: z.number().positive().optional().nullable(),
  attachmentUrls: z.array(z.string().url()).optional().default([]),
  source: z.string().optional().nullable(), // 'website', 'google', 'referral', etc.
});

// Update inquiry schema (admin-only fields)
export const UpdateInquirySchema = z.object({
  internalNotes: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  status: InquiryStatusSchema.optional(),
});

// Update inquiry status schema
export const UpdateInquiryStatusSchema = z.object({
  status: InquiryStatusSchema,
});

// Convert inquiry to client schema
export const ConvertInquirySchema = z.object({
  // Optional fields to pre-fill in new client
  status: z.string().optional(), // ACTIVE, INACTIVE, etc.
  notes: z.string().optional(),
});

// Send email schema (admin action)
export const SendInquiryEmailSchema = z.object({
  templateName: z.string(), // e.g., 'inquiry_confirmation', 'status_update'
  customMessage: z.string().optional(),
  recipientEmail: z.string().email().optional(), // Override default inquiry email
});

// Query parameters schema for listing inquiries
export const ListInquiriesQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  status: InquiryStatusSchema.optional(),
  type: InquiryTypeSchema.optional(),
  search: z.string().optional(), // Search by name or email
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  budgetMin: z.string().optional().transform((val) => (val ? parseFloat(val) : undefined)),
  budgetMax: z.string().optional().transform((val) => (val ? parseFloat(val) : undefined)),
  tags: z.string().optional().transform((val) => (val ? val.split(',') : undefined)),
});

// ID parameter schema
export const InquiryIdSchema = z.object({
  id: z.string().min(1, 'Inquiry ID is required'),
});

// Type exports for TypeScript
export type CreateInquiryInput = z.infer<typeof CreateInquirySchema>;
export type UpdateInquiryInput = z.infer<typeof UpdateInquirySchema>;
export type UpdateInquiryStatusInput = z.infer<typeof UpdateInquiryStatusSchema>;
export type ConvertInquiryInput = z.infer<typeof ConvertInquirySchema>;
export type SendInquiryEmailInput = z.infer<typeof SendInquiryEmailSchema>;
export type ListInquiriesQuery = z.infer<typeof ListInquiriesQuerySchema>;
export type InquiryIdParam = z.infer<typeof InquiryIdSchema>;
