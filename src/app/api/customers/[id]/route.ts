/**
 * Customer API - Get, Update, Delete
 *
 * GET    /api/customers/[id] - Get a single customer
 * PATCH  /api/customers/[id] - Update a customer
 * DELETE /api/customers/[id] - Delete a customer
 *
 * Multi-tenant: Requires proper permissions and organization membership
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  requireAuth,
  successResponse,
  errorResponse,
  logAudit,
  checkCustomerOwnership,
  requirePermission,
  PERMISSIONS,
} from '@/lib/api-utils';
import { updateCustomerSchema } from '@/lib/validation';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/customers/[id]
 * Get a single customer with contacts and deals
 *
 * Requires: customers:read permission
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await context.params;

  // First get the customer to know its organization
  const customerCheck = await prisma.customer.findUnique({
    where: { id },
    select: {
      organizationId: true,
      createdById: true,
      assignedToId: true,
    },
  });

  if (!customerCheck) {
    return errorResponse('NOT_FOUND', '找不到此客戶');
  }

  // Check ownership/access
  const { hasAccess } = await checkCustomerOwnership(
    id,
    session.user.id,
    customerCheck.organizationId
  );

  if (!hasAccess) {
    return errorResponse('FORBIDDEN', '無權存取此客戶');
  }

  // Fetch customer with relations
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      contacts: {
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
      },
      deals: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          documents: true,
          deals: true,
          contacts: true,
        },
      },
    },
  });

  // Log audit event
  await logAudit({
    action: 'read',
    entity: 'customer',
    entityId: id,
    userId: session.user.id,
    organizationId: customerCheck.organizationId,
    request,
  });

  return successResponse(customer);
}

/**
 * PATCH /api/customers/[id]
 * Update a customer
 *
 * Requires: customers:update permission
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await context.params;

  // First get the customer to know its organization
  const customerCheck = await prisma.customer.findUnique({
    where: { id },
    select: {
      organizationId: true,
      createdById: true,
      assignedToId: true,
    },
  });

  if (!customerCheck) {
    return errorResponse('NOT_FOUND', '找不到此客戶');
  }

  // Check ownership/access
  const { hasAccess } = await checkCustomerOwnership(
    id,
    session.user.id,
    customerCheck.organizationId
  );

  if (!hasAccess) {
    return errorResponse('FORBIDDEN', '無權修改此客戶');
  }

  // Check permission
  const { error: permError } = await requirePermission(
    session,
    customerCheck.organizationId,
    PERMISSIONS.CUSTOMERS_UPDATE
  );
  if (permError) return permError;

  try {
    const body = await request.json();

    // Validate input
    const result = updateCustomerSchema.safeParse(body);
    if (!result.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        result.error.issues[0].message
      );
    }

    const data = result.data;

    // Check for duplicate email if updating email (within organization)
    if (data.email) {
      const existing = await prisma.customer.findFirst({
        where: {
          organizationId: customerCheck.organizationId,
          email: data.email,
          NOT: { id },
        },
      });

      if (existing) {
        return errorResponse('CONFLICT', '此電子郵件已存在');
      }
    }

    // Get current state for audit
    const before = await prisma.customer.findUnique({
      where: { id },
      select: {
        name: true,
        email: true,
        phone: true,
        company: true,
        companyPhone: true,
        fax: true,
        taxId: true,
        type: true,
        status: true,
        notes: true,
        assignedToId: true,
      },
    });

    // Update customer
    const customer = await prisma.customer.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        companyPhone: true,
        fax: true,
        taxId: true,
        type: true,
        status: true,
        notes: true,
        organizationId: true,
        createdById: true,
        assignedToId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Log audit event with changes
    await logAudit({
      action: 'update',
      entity: 'customer',
      entityId: id,
      userId: session.user.id,
      organizationId: customerCheck.organizationId,
      details: {
        before,
        after: data,
      },
      request,
    });

    return successResponse(customer);
  } catch (err) {
    console.error('Update customer error:', err);
    return errorResponse('INTERNAL_ERROR', '更新客戶失敗');
  }
}

/**
 * DELETE /api/customers/[id]
 * Delete a customer (cascades to contacts, deals, documents)
 *
 * Requires: customers:delete permission
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await context.params;

  // First get the customer to know its organization
  const customerCheck = await prisma.customer.findUnique({
    where: { id },
    select: {
      organizationId: true,
      createdById: true,
      assignedToId: true,
    },
  });

  if (!customerCheck) {
    return errorResponse('NOT_FOUND', '找不到此客戶');
  }

  // Check ownership/access
  const { hasAccess } = await checkCustomerOwnership(
    id,
    session.user.id,
    customerCheck.organizationId
  );

  if (!hasAccess) {
    return errorResponse('FORBIDDEN', '無權刪除此客戶');
  }

  // Check permission
  const { error: permError } = await requirePermission(
    session,
    customerCheck.organizationId,
    PERMISSIONS.CUSTOMERS_DELETE
  );
  if (permError) return permError;

  try {
    // Get customer info for audit before deletion
    const customer = await prisma.customer.findUnique({
      where: { id },
      select: {
        name: true,
        email: true,
        _count: {
          select: {
            contacts: true,
            deals: true,
            documents: true,
          },
        },
      },
    });

    // Delete customer (cascade deletes contacts, deals per schema)
    await prisma.customer.delete({
      where: { id },
    });

    // Log audit event
    await logAudit({
      action: 'delete',
      entity: 'customer',
      entityId: id,
      userId: session.user.id,
      organizationId: customerCheck.organizationId,
      details: {
        name: customer?.name,
        email: customer?.email,
        deletedRelations: customer?._count,
      },
      request,
    });

    return successResponse({ deleted: true });
  } catch (err) {
    console.error('Delete customer error:', err);
    return errorResponse('INTERNAL_ERROR', '刪除客戶失敗');
  }
}
