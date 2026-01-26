/**
 * Deal API - Single Deal Operations
 *
 * GET    /api/deals/[id] - Get deal details
 * PATCH  /api/deals/[id] - Update a deal
 * DELETE /api/deals/[id] - Delete a deal
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  requireAuth,
  successResponse,
  errorResponse,
  logAudit,
} from '@/lib/api-utils';
import { updateDealSchema } from '@/lib/validation';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/deals/[id]
 * Get a single deal by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const deal = await prisma.deal.findFirst({
    where: {
      id,
      customer: {
        userId: session!.user.id,
      },
    },
    select: {
      id: true,
      title: true,
      value: true,
      currency: true,
      stage: true,
      probability: true,
      closeDate: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          company: true,
          type: true,
          status: true,
        },
      },
    },
  });

  if (!deal) {
    return errorResponse('NOT_FOUND', '找不到此商機');
  }

  // Log audit event
  await logAudit({
    action: 'read',
    entity: 'deal',
    entityId: id,
    userId: session!.user.id,
    request,
  });

  return successResponse(deal);
}

/**
 * PATCH /api/deals/[id]
 * Update a deal
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

    // Verify deal belongs to user's customer
    const existingDeal = await prisma.deal.findFirst({
      where: {
        id,
        customer: {
          userId: session!.user.id,
        },
      },
    });

    if (!existingDeal) {
      return errorResponse('NOT_FOUND', '找不到此商機');
    }

    const data = result.data;

    // Update deal
    const deal = await prisma.deal.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.value !== undefined && { value: data.value }),
        ...(data.currency !== undefined && { currency: data.currency }),
        ...(data.stage !== undefined && { stage: data.stage }),
        ...(data.probability !== undefined && { probability: data.probability }),
        ...(data.closeDate !== undefined && {
          closeDate: data.closeDate ? new Date(data.closeDate) : null,
        }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      select: {
        id: true,
        title: true,
        value: true,
        currency: true,
        stage: true,
        probability: true,
        closeDate: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Log audit event
    await logAudit({
      action: 'update',
      entity: 'deal',
      entityId: id,
      userId: session!.user.id,
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
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  // Verify deal belongs to user's customer
  const deal = await prisma.deal.findFirst({
    where: {
      id,
      customer: {
        userId: session!.user.id,
      },
    },
  });

  if (!deal) {
    return errorResponse('NOT_FOUND', '找不到此商機');
  }

  // Delete deal
  await prisma.deal.delete({
    where: { id },
  });

  // Log audit event
  await logAudit({
    action: 'delete',
    entity: 'deal',
    entityId: id,
    userId: session!.user.id,
    details: { title: deal.title, value: deal.value },
    request,
  });

  return successResponse({ deleted: true });
}
