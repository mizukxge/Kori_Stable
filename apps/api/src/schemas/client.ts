import { z } from 'zod';

// Client status enum
export const ClientStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'PENDING', 'ARCHIVED']);

// Create client schema
export const CreateClientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  company: z.string().optional(),
  status: ClientStatusSchema.optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional().default('US'),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
});

// Update client schema (all fields optional)
export const UpdateClientSchema = CreateClientSchema.partial();

// Update status schema
export const UpdateStatusSchema = z.object({
  status: ClientStatusSchema,
});

// Query parameters schema for listing clients
export const ListClientsQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  status: ClientStatusSchema.optional(),
  search: z.string().optional(),
  tags: z.string().optional().transform((val) => (val ? val.split(',') : undefined)),
});

// ID parameter schema
export const ClientIdSchema = z.object({
  id: z.string().min(1, 'Client ID is required'),
});

// Type exports for TypeScript
export type CreateClientInput = z.infer<typeof CreateClientSchema>;
export type UpdateClientInput = z.infer<typeof UpdateClientSchema>;
export type UpdateStatusInput = z.infer<typeof UpdateStatusSchema>;
export type ListClientsQuery = z.infer<typeof ListClientsQuerySchema>;
export type ClientIdParam = z.infer<typeof ClientIdSchema>;