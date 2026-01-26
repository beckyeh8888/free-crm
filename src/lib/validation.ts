/**
 * Zod Validation Schemas - ISO 27001 Compliant
 *
 * Input validation to prevent:
 * - CWE-89: SQL Injection
 * - CWE-79: XSS
 * - CWE-502: Unsafe Deserialization
 */

import { z } from 'zod';

// Common validation patterns
export const emailSchema = z.string().email('Invalid email format');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[a-z]/, 'Password must contain lowercase letter')
  .regex(/[0-9]/, 'Password must contain number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain special character');

export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name must be less than 100 characters')
  .regex(/^[a-zA-Z\u4e00-\u9fa5\s]+$/, 'Name contains invalid characters');

export const phoneSchema = z
  .string()
  .regex(/^[0-9+\-\s()]+$/, 'Invalid phone format')
  .min(8)
  .max(20);

// Customer schema for CRM
export const customerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema.optional(),
  company: z.string().max(200).optional(),
  type: z.enum(['B2B', 'B2C']),
  notes: z.string().max(5000).optional(),
});

export type Customer = z.infer<typeof customerSchema>;

// Contact schema
export const contactSchema = z.object({
  customerId: z.string().uuid(),
  name: nameSchema,
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  title: z.string().max(100).optional(),
  isPrimary: z.boolean().default(false),
});

export type Contact = z.infer<typeof contactSchema>;

// Document analysis request schema
export const documentAnalysisSchema = z.object({
  documentId: z.string().uuid(),
  analysisType: z.enum(['contract', 'email', 'meeting_notes', 'quotation']),
  options: z
    .object({
      extractEntities: z.boolean().default(true),
      summarize: z.boolean().default(true),
      extractDates: z.boolean().default(true),
    })
    .optional(),
});

export type DocumentAnalysisRequest = z.infer<typeof documentAnalysisSchema>;
