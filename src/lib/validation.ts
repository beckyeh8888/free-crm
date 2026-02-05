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
// Zod v4: Use z.email() instead of z.string().email()
export const emailSchema = z.email('Invalid email format');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[a-z]/, 'Password must contain lowercase letter')
  .regex(/\d/, 'Password must contain number')
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

// Contact schema (for creation)
export const createContactSchema = z.object({
  name: nameSchema,
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  title: z.string().max(100).optional(),
  isPrimary: z.boolean().default(false),
});

export const updateContactSchema = createContactSchema.partial();

// Legacy contact schema (with customerId)
// Zod v4: Use z.cuid() instead of z.string().cuid()
export const contactSchema = z.object({
  customerId: z.cuid(),
  name: nameSchema,
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  title: z.string().max(100).optional(),
  isPrimary: z.boolean().default(false),
});

export type Contact = z.infer<typeof contactSchema>;

// ============================================
// Pagination & Filter Schemas
// ============================================

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const customerFilterSchema = z.object({
  search: z.string().optional(),
  type: z.enum(['B2B', 'B2C']).optional(),
  status: z.enum(['active', 'inactive', 'lead']).optional(),
});

// ============================================
// Customer CRUD Schemas
// ============================================

export const createCustomerSchema = z.object({
  name: z.string().min(1, '請輸入客戶名稱').max(100),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  company: z.string().max(200).optional(),
  type: z.enum(['B2B', 'B2C']).default('B2B'),
  status: z.enum(['active', 'inactive', 'lead']).default('active'),
  notes: z.string().max(5000).optional(),
  // Multi-tenant fields (Zod v4: z.cuid())
  organizationId: z.cuid().optional(), // Can be provided or inferred from context
  assignedToId: z.cuid().optional(), // Assigned sales rep
});

export const updateCustomerSchema = createCustomerSchema.partial();

export type CreateCustomer = z.infer<typeof createCustomerSchema>;
export type UpdateCustomer = z.infer<typeof updateCustomerSchema>;

// ============================================
// Document Analysis Schema
// ============================================

// Zod v4: Use z.cuid() instead of z.string().cuid()
export const documentAnalysisSchema = z.object({
  documentId: z.cuid(),
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

// ============================================
// Deal CRUD Schemas
// ============================================

export const dealStageEnum = z.enum([
  'lead',
  'qualified',
  'proposal',
  'negotiation',
  'closed_won',
  'closed_lost',
]);

// Zod v4: Use z.cuid() and z.iso.datetime()
export const createDealSchema = z.object({
  title: z.string().min(1, '請輸入商機名稱').max(200),
  customerId: z.cuid({ message: '無效的客戶 ID' }),
  value: z.number().min(0).optional(),
  currency: z.string().length(3).default('TWD'),
  stage: dealStageEnum.default('lead'),
  probability: z.number().min(0).max(100).default(0),
  closeDate: z.iso.datetime().optional(),
  notes: z.string().max(5000).optional(),
  // Multi-tenant field
  assignedToId: z.cuid().optional(), // Assigned sales rep
});

export const updateDealSchema = z.object({
  title: z.string().min(1, '請輸入商機名稱').max(200).optional(),
  value: z.number().min(0).optional(),
  currency: z.string().length(3).optional(),
  stage: dealStageEnum.optional(),
  probability: z.number().min(0).max(100).optional(),
  closeDate: z.iso.datetime().optional().nullable(),
  notes: z.string().max(5000).optional(),
  assignedToId: z.cuid().optional().nullable(), // Can reassign
});

export const dealFilterSchema = z.object({
  search: z.string().optional(),
  stage: dealStageEnum.optional(),
  customerId: z.cuid().optional(),
  minValue: z.coerce.number().optional(),
  maxValue: z.coerce.number().optional(),
});

export type CreateDeal = z.infer<typeof createDealSchema>;
export type UpdateDeal = z.infer<typeof updateDealSchema>;
export type DealStage = z.infer<typeof dealStageEnum>;

// ============================================
// Document CRUD Schemas
// ============================================

export const documentTypeEnum = z.enum([
  'contract',
  'email',
  'meeting_notes',
  'quotation',
]);

export const createDocumentSchema = z.object({
  name: z.string().min(1, '請輸入文件名稱').max(200),
  type: documentTypeEnum.default('contract'),
  content: z.string().max(50000).optional(),
  customerId: z.cuid({ message: '無效的客戶 ID' }).optional().nullable(),
});

export const updateDocumentSchema = z.object({
  name: z.string().min(1, '請輸入文件名稱').max(200).optional(),
  type: documentTypeEnum.optional(),
  content: z.string().max(50000).optional(),
  customerId: z.cuid({ message: '無效的客戶 ID' }).optional().nullable(),
});

export const documentFilterSchema = z.object({
  search: z.string().optional(),
  type: documentTypeEnum.optional(),
  customerId: z.cuid().optional(),
});

export type CreateDocument = z.infer<typeof createDocumentSchema>;
export type UpdateDocument = z.infer<typeof updateDocumentSchema>;
export type DocumentType = z.infer<typeof documentTypeEnum>;

// ============================================
// Project Schemas (Sprint 5)
// ============================================

export const projectStatusEnum = z.enum(['active', 'completed', 'on_hold', 'cancelled']);

export const createProjectSchema = z.object({
  name: z.string().min(1, '請輸入專案名稱').max(200),
  description: z.string().max(2000).optional(),
  status: projectStatusEnum.default('active'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  customerId: z.cuid().optional().nullable(),
  organizationId: z.cuid().optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export const projectFilterSchema = z.object({
  search: z.string().optional(),
  status: projectStatusEnum.optional(),
  customerId: z.cuid().optional(),
});

export type CreateProject = z.infer<typeof createProjectSchema>;
export type UpdateProject = z.infer<typeof updateProjectSchema>;
export type ProjectStatus = z.infer<typeof projectStatusEnum>;

// ============================================
// Task Schemas (Sprint 5)
// ============================================

export const taskTypeEnum = z.enum(['task', 'call', 'meeting', 'email', 'follow_up', 'milestone']);
export const taskPriorityEnum = z.enum(['low', 'medium', 'high', 'urgent']);
export const taskStatusEnum = z.enum(['pending', 'in_progress', 'completed', 'cancelled']);

export const createTaskSchema = z.object({
  title: z.string().min(1, '請輸入任務標題').max(200),
  description: z.string().max(2000).optional(),
  type: taskTypeEnum.default('task'),
  priority: taskPriorityEnum.default('medium'),
  status: taskStatusEnum.default('pending'),
  startDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  dueTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  isAllDay: z.boolean().default(false),
  reminderAt: z.string().datetime().optional(),
  progress: z.number().min(0).max(100).default(0),
  assignedToId: z.cuid().optional().nullable(),
  projectId: z.cuid().optional().nullable(),
  customerId: z.cuid().optional().nullable(),
  dealId: z.cuid().optional().nullable(),
  contactId: z.cuid().optional().nullable(),
  organizationId: z.cuid().optional(),
});

export const updateTaskSchema = createTaskSchema.partial();

export const taskFilterSchema = z.object({
  search: z.string().optional(),
  status: taskStatusEnum.optional(),
  priority: taskPriorityEnum.optional(),
  type: taskTypeEnum.optional(),
  projectId: z.cuid().optional(),
  customerId: z.cuid().optional(),
  dealId: z.cuid().optional(),
  assignedToId: z.cuid().optional(),
  dueDateFrom: z.string().datetime().optional(),
  dueDateTo: z.string().datetime().optional(),
  startDateFrom: z.string().datetime().optional(),
  startDateTo: z.string().datetime().optional(),
});

export const calendarQuerySchema = z.object({
  start: z.string().datetime(),
  end: z.string().datetime(),
  type: taskTypeEnum.optional(),
});

export const ganttQuerySchema = z.object({
  start: z.string().datetime(),
  end: z.string().datetime(),
  projectId: z.cuid().optional(),
  customerId: z.cuid().optional(),
  dealId: z.cuid().optional(),
  assignedToId: z.cuid().optional(),
  includeDependencies: z.coerce.boolean().default(true),
});

export type CreateTask = z.infer<typeof createTaskSchema>;
export type UpdateTask = z.infer<typeof updateTaskSchema>;
export type TaskType = z.infer<typeof taskTypeEnum>;
export type TaskPriority = z.infer<typeof taskPriorityEnum>;
export type TaskStatus = z.infer<typeof taskStatusEnum>;
export type TaskFilterSchema = z.infer<typeof taskFilterSchema>;

// ============================================
// Task Dependency Schemas (Sprint 5)
// ============================================

export const dependencyTypeEnum = z.enum([
  'finish_to_start',
  'start_to_start',
  'finish_to_finish',
  'start_to_finish',
]);

export const createDependencySchema = z.object({
  prerequisiteId: z.cuid({ message: '無效的前置任務 ID' }),
  type: dependencyTypeEnum.default('finish_to_start'),
});

export type CreateDependency = z.infer<typeof createDependencySchema>;
export type DependencyType = z.infer<typeof dependencyTypeEnum>;
