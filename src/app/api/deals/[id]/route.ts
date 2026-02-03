/**
 * Deal API - Single Deal Operations
 *
 * GET    /api/deals/[id] - Get deal details
 * PATCH  /api/deals/[id] - Update a deal
 * DELETE /api/deals/[id] - Delete a deal
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
  checkDealOwnership,
  requirePermission,
  PERMISSIONS,
} from '@/lib/api-utils';
import { updateDealSchema } from '@/lib/validation';
import type { z } from 'zod';

type RouteParams = { params: Promise<{ id: string }> };
type UpdateDealData = z.infer<typeof updateDealSchema>;

// ============================================
// Helper Functions
// ============================================

/**
 * Check if a deal stage transition represents closing
 */
const CLOSED_STAGES = new Set(['closed_won', 'closed_lost']);

function isDealClosing(newStage: string | undefined, currentStage: string): boolean {
  if (!newStage) return false;
  const isNewStageClosed = CLOSED_STAGES.has(newStage);
  const isCurrentStageOpen = !CLOSED_STAGES.has(currentStage);
  return isNewStageClosed && isCurrentStageOpen;
}

/**
 * Build deal update data from validated input
 */
function buildDealUpdateData(data: UpdateDealData, isClosing: boolean) {
  return {
    ...(data.title !== undefined && { title: data.title }),
    ...(data.value !== undefined && { value: data.value }),
    ...(data.currency !== undefined && { currency: data.currency }),
    ...(data.stage !== undefined && { stage: data.stage }),
    ...(data.probability !== undefined && { probability: data.probability }),
    ...(data.closeDate !== undefined && {
      closeDate: data.closeDate ? new Date(data.closeDate) : null,
    }),
    ...(data.notes !== undefined && { notes: data.notes }),
    ...(data.assignedToId !== undefined && { assignedToId: data.assignedToId }),
    ...(isClosing && { closedAt: new Date() }),
  };
}

/**
 * Verify deal access (ownership + permission)
 */
async function verifyDealAccessForUpdate(
  dealId: string,
  userId: string,
  organizationId: string,
  session: NonNullable<Awaited<ReturnType<typeof requireAuth>>['session']>
): Promise<{ error: Response | null }> {
  const { hasAccess } = await checkDealOwnership(dealId, userId, organizationId);
  if (!hasAccess) {
    return { error: errorResponse('FORBIDDEN', '無權修改此商機') };
  }

  const { error: permError } = await requirePermission(
    session,
    organizationId,
    PERMISSIONS.DEALS_UPDATE
  );
  if (permError) {
    return { error: permError };
  }

  return { error: null };
}

/**
 * GET /api/deals/[id]
 * Get a single deal by ID
 *
 * Requires: deals:read permission
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  // First check deal exists and get organization
  const dealCheck = await prisma.deal.findUnique({
    where: { id },
    select: {
      createdById: true,
      assignedToId: true,
      customer: {
        select: {
          organizationId: true,
        },
      },
    },
  });

  if (!dealCheck) {
    return errorResponse('NOT_FOUND', '找不到此商機');
  }

  // Check ownership/access
  const { hasAccess } = await checkDealOwnership(
    id,
    session.user.id,
    dealCheck.customer.organizationId
  );

  if (!hasAccess) {
    return errorResponse('FORBIDDEN', '無權存取此商機');
  }

  const deal = await prisma.deal.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      value: true,
      currency: true,
      stage: true,
      probability: true,
      closeDate: true,
      closedAt: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
      createdById: true,
      assignedToId: true,
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          company: true,
          type: true,
          status: true,
          organizationId: true,
        },
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
    },
  });

  // Log audit event
  await logAudit({
    action: 'read',
    entity: 'deal',
    entityId: id,
    userId: session.user.id,
    organizationId: dealCheck.customer.organizationId,
    request,
  });

  return successResponse(deal);
}

/**
 * PATCH /api/deals/[id]
 * Update a deal
 *
 * Requires: deals:update permission
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  try {
    const body = await request.json();

    // Validate input
    const result = updateDealSchema.safeParse(body);
    if (!result.success) {
      return errorResponse('VALIDATION_ERROR', result.error.issues[0].message);
    }

    // Verify deal exists and get organization
    const existingDeal = await prisma.deal.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        value: true,
        stage: true,
        createdById: true,
        assignedToId: true,
        customer: {
          select: {
            organizationId: true,
          },
        },
      },
    });

    if (!existingDeal) {
      return errorResponse('NOT_FOUND', '找不到此商機');
    }

    // Check ownership/access and permission
    const { error: accessError } = await verifyDealAccessForUpdate(
      id,
      session.user.id,
      existingDeal.customer.organizationId,
      session
    );
    if (accessError) return accessError;

    const data = result.data;

    // Check if deal is being closed
    const isClosing = isDealClosing(data.stage, existingDeal.stage);

    // Update deal
    const deal = await prisma.deal.update({
      where: { id },
      data: buildDealUpdateData(data, isClosing),
      select: {
        id: true,
        title: true,
        value: true,
        currency: true,
        stage: true,
        probability: true,
        closeDate: true,
        closedAt: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        createdById: true,
        assignedToId: true,
        customer: {
          select: {
            id: true,
            name: true,
            organizationId: true,
          },
        },
      },
    });

    // Log audit event
    await logAudit({
      action: 'update',
      entity: 'deal',
      entityId: id,
      userId: session.user.id,
      organizationId: existingDeal.customer.organizationId,
      details: {
        before: { stage: existingDeal.stage, value: existingDeal.value },
        after: { stage: deal.stage, value: deal.value },
      },
      request,
    });

    return successResponse(deal);
  } catch (err) {
    console.error('Update deal error:', err);
    return errorResponse('INTERNAL_ERROR', '更新商機失敗');
  }
}

/**
 * DELETE /api/deals/[id]
 * Delete a deal
 *
 * Requires: deals:delete permission
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  // Verify deal exists and get organization
  const deal = await prisma.deal.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      value: true,
      createdById: true,
      assignedToId: true,
      customer: {
        select: {
          organizationId: true,
        },
      },
    },
  });

  if (!deal) {
    return errorResponse('NOT_FOUND', '找不到此商機');
  }

  // Check ownership/access
  const { hasAccess } = await checkDealOwnership(
    id,
    session.user.id,
    deal.customer.organizationId
  );

  if (!hasAccess) {
    return errorResponse('FORBIDDEN', '無權刪除此商機');
  }

  // Check permission
  const { error: permError } = await requirePermission(
    session,
    deal.customer.organizationId,
    PERMISSIONS.DEALS_DELETE
  );
  if (permError) return permError;

  // Delete deal
  await prisma.deal.delete({
    where: { id },
  });

  // Log audit event
  await logAudit({
    action: 'delete',
    entity: 'deal',
    entityId: id,
    userId: session.user.id,
    organizationId: deal.customer.organizationId,
    details: { title: deal.title, value: deal.value },
    request,
  });

  return successResponse({ deleted: true });
}
