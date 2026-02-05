/**
 * Task API - List & Create
 *
 * GET  /api/tasks - List tasks (paginated, filterable)
 * POST /api/tasks - Create a new task
 *
 * Multi-tenant: Requires organizationId in header or query param
 * ISO 27001 A.9.2.2 (User Access Provisioning)
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  requireAuth,
  successResponse,
  listResponse,
  errorResponse,
  logAudit,
  getPaginationParams,
  getOrganizationId,
  requirePermission,
  PERMISSIONS,
} from '@/lib/api-utils';
import {
  createTaskSchema,
  taskFilterSchema,
  type TaskFilterSchema,
} from '@/lib/validation';
import { getUserDefaultOrganization } from '@/lib/rbac';

// ============================================
// Helper Functions (降低認知複雜度)
// ============================================

/** 解析組織 ID，優先從請求取得，否則使用預設組織 */
async function resolveOrganizationId(
  request: NextRequest,
  userId: string,
  providedOrgId?: string
): Promise<string | null> {
  const orgId = providedOrgId || getOrganizationId(request);
  if (orgId) return orgId;

  const defaultOrg = await getUserDefaultOrganization(userId);
  return defaultOrg?.organization.id || null;
}

/** 從查詢參數解析篩選條件 */
function parseTaskFilters(searchParams: URLSearchParams): TaskFilterSchema {
  const filterResult = taskFilterSchema.safeParse({
    search: searchParams.get('search') || undefined,
    status: searchParams.get('status') || undefined,
    priority: searchParams.get('priority') || undefined,
    type: searchParams.get('type') || undefined,
    projectId: searchParams.get('projectId') || undefined,
    customerId: searchParams.get('customerId') || undefined,
    dealId: searchParams.get('dealId') || undefined,
    assignedToId: searchParams.get('assignedToId') || undefined,
    dueDateFrom: searchParams.get('dueDateFrom') || undefined,
    dueDateTo: searchParams.get('dueDateTo') || undefined,
    startDateFrom: searchParams.get('startDateFrom') || undefined,
    startDateTo: searchParams.get('startDateTo') || undefined,
  });
  return filterResult.success ? filterResult.data : {};
}

/** 建構任務查詢的 where 條件 */
function buildTaskWhereClause(
  organizationId: string,
  filters: TaskFilterSchema,
  userOnlyFilter?: { userId: string }
): Record<string, unknown> {
  const where: Record<string, unknown> = {
    organizationId,
    ...(filters.status && { status: filters.status }),
    ...(filters.priority && { priority: filters.priority }),
    ...(filters.type && { type: filters.type }),
    ...(filters.projectId && { projectId: filters.projectId }),
    ...(filters.customerId && { customerId: filters.customerId }),
    ...(filters.dealId && { dealId: filters.dealId }),
    ...(filters.assignedToId && { assignedToId: filters.assignedToId }),
    ...(filters.search && {
      OR: [
        { title: { contains: filters.search } },
        { description: { contains: filters.search } },
      ],
    }),
  };

  // Date range filters
  if (filters.dueDateFrom || filters.dueDateTo) {
    where.dueDate = {
      ...(filters.dueDateFrom && { gte: new Date(filters.dueDateFrom) }),
      ...(filters.dueDateTo && { lte: new Date(filters.dueDateTo) }),
    };
  }

  if (filters.startDateFrom || filters.startDateTo) {
    where.startDate = {
      ...(filters.startDateFrom && { gte: new Date(filters.startDateFrom) }),
      ...(filters.startDateTo && { lte: new Date(filters.startDateTo) }),
    };
  }

  // User-only filter (when no manage permission)
  if (userOnlyFilter) {
    where.OR = [
      { createdById: userOnlyFilter.userId },
      { assignedToId: userOnlyFilter.userId },
    ];
  }

  return where;
}

/** 解析排序參數 */
function parseTaskOrderBy(searchParams: URLSearchParams): Record<string, string> {
  const sort = searchParams.get('sort') || 'dueDate';
  const order = searchParams.get('order') || 'asc';
  const validSortFields = ['dueDate', 'priority', 'startDate', 'createdAt'];

  if (validSortFields.includes(sort)) {
    return { [sort]: order === 'desc' ? 'desc' : 'asc' };
  }
  return { dueDate: 'asc' };
}

/** 驗證關聯實體是否屬於組織 */
async function validateRelatedEntities(
  data: { projectId?: string | null; customerId?: string | null; dealId?: string | null },
  organizationId: string
): Promise<{ valid: boolean; error?: ReturnType<typeof errorResponse> }> {
  if (data.projectId) {
    const project = await prisma.project.findFirst({
      where: { id: data.projectId, organizationId },
    });
    if (!project) {
      return { valid: false, error: errorResponse('NOT_FOUND', '找不到指定的專案') };
    }
  }

  if (data.customerId) {
    const customer = await prisma.customer.findFirst({
      where: { id: data.customerId, organizationId },
    });
    if (!customer) {
      return { valid: false, error: errorResponse('NOT_FOUND', '找不到指定的客戶') };
    }
  }

  if (data.dealId) {
    const deal = await prisma.deal.findFirst({
      where: { id: data.dealId },
      include: { customer: true },
    });
    if (!deal || deal.customer.organizationId !== organizationId) {
      return { valid: false, error: errorResponse('NOT_FOUND', '找不到指定的商機') };
    }
  }

  return { valid: true };
}

// ============================================
// Task Select Fields
// ============================================

const taskListSelect = {
  id: true,
  title: true,
  description: true,
  type: true,
  priority: true,
  status: true,
  startDate: true,
  dueDate: true,
  dueTime: true,
  completedAt: true,
  isAllDay: true,
  progress: true,
  createdAt: true,
  updatedAt: true,
  createdBy: { select: { id: true, name: true, image: true } },
  assignedTo: { select: { id: true, name: true, image: true } },
  project: { select: { id: true, name: true, color: true } },
  customer: { select: { id: true, name: true } },
  deal: { select: { id: true, title: true } },
} as const;

const taskCreateSelect = {
  id: true,
  title: true,
  description: true,
  type: true,
  priority: true,
  status: true,
  startDate: true,
  dueDate: true,
  dueTime: true,
  isAllDay: true,
  progress: true,
  createdAt: true,
  createdBy: { select: { id: true, name: true } },
  assignedTo: { select: { id: true, name: true } },
  project: { select: { id: true, name: true, color: true } },
} as const;

// ============================================
// API Handlers
// ============================================

/**
 * GET /api/tasks
 * List all tasks for the organization
 */
export async function GET(request: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const searchParams = request.nextUrl.searchParams;
  const { page, limit, skip } = getPaginationParams(searchParams);

  // Resolve organization
  const organizationId = await resolveOrganizationId(request, session.user.id);
  if (!organizationId) {
    return errorResponse('FORBIDDEN', '無法確定組織');
  }

  // Check read permission
  const { error: permError } = await requirePermission(session, organizationId, PERMISSIONS.TASKS_READ);
  if (permError) return permError;

  // Parse filters and check manage permission
  const filters = parseTaskFilters(searchParams);
  const hasManagePermission = await requirePermission(session, organizationId, PERMISSIONS.TASKS_MANAGE);
  const userOnlyFilter = hasManagePermission.error ? { userId: session.user.id } : undefined;

  // Build query
  const where = buildTaskWhereClause(organizationId, filters, userOnlyFilter);
  const orderBy = parseTaskOrderBy(searchParams);

  // Execute queries in parallel
  const [tasks, total] = await Promise.all([
    prisma.task.findMany({ where, skip, take: limit, orderBy, select: taskListSelect }),
    prisma.task.count({ where }),
  ]);

  // Log audit event
  await logAudit({
    action: 'read',
    entity: 'task',
    userId: session.user.id,
    organizationId,
    details: { count: tasks.length, filters },
    request,
  });

  return listResponse(tasks, { page, limit, total });
}

/**
 * POST /api/tasks
 * Create a new task
 *
 * Requires: tasks:write permission
 */
export async function POST(request: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();

    // Validate input
    const result = createTaskSchema.safeParse(body);
    if (!result.success) {
      return errorResponse('VALIDATION_ERROR', result.error.issues[0].message);
    }

    // Resolve organization
    const organizationId = await resolveOrganizationId(
      request,
      session.user.id,
      result.data.organizationId
    );
    if (!organizationId) {
      return errorResponse('FORBIDDEN', '無法確定組織');
    }

    // Check write permission
    const { error: permError } = await requirePermission(session, organizationId, PERMISSIONS.TASKS_WRITE);
    if (permError) return permError;

    // Check assign permission if assigning to someone else
    if (result.data.assignedToId && result.data.assignedToId !== session.user.id) {
      const { error: assignError } = await requirePermission(session, organizationId, PERMISSIONS.TASKS_ASSIGN);
      if (assignError) {
        return errorResponse('FORBIDDEN', '您沒有指派任務的權限');
      }
    }

    // Validate related entities
    const validation = await validateRelatedEntities(result.data, organizationId);
    if (!validation.valid) {
      return validation.error!;
    }

    // Create task
    const task = await prisma.task.create({
      data: {
        title: result.data.title,
        description: result.data.description,
        type: result.data.type,
        priority: result.data.priority,
        status: result.data.status,
        startDate: result.data.startDate ? new Date(result.data.startDate) : null,
        dueDate: result.data.dueDate ? new Date(result.data.dueDate) : null,
        dueTime: result.data.dueTime,
        isAllDay: result.data.isAllDay,
        reminderAt: result.data.reminderAt ? new Date(result.data.reminderAt) : null,
        progress: result.data.progress,
        organizationId,
        createdById: session.user.id,
        assignedToId: result.data.assignedToId || session.user.id,
        projectId: result.data.projectId || null,
        customerId: result.data.customerId || null,
        dealId: result.data.dealId || null,
        contactId: result.data.contactId || null,
      },
      select: taskCreateSelect,
    });

    // Log audit event
    await logAudit({
      action: 'create',
      entity: 'task',
      entityId: task.id,
      userId: session.user.id,
      organizationId,
      details: { task },
      request,
    });

    return successResponse(task, 201);
  } catch (err) {
    console.error('Create task error:', err);
    return errorResponse('INTERNAL_ERROR', '建立任務失敗');
  }
}
