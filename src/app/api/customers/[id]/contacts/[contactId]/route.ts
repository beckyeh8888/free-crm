/**
 * Contact API - Update & Delete
 *
 * PATCH  /api/customers/[id]/contacts/[contactId] - Update a contact
 * DELETE /api/customers/[id]/contacts/[contactId] - Delete a contact
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  requireAuth,
  successResponse,
  errorResponse,
  logAudit,
  checkCustomerOwnership,
} from '@/lib/api-utils';
import { updateContactSchema } from '@/lib/validation';

interface RouteContext {
  params: Promise<{ id: string; contactId: string }>;
}

/**
 * PATCH /api/customers/[id]/contacts/[contactId]
 * Update a contact
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id: customerId, contactId } = await context.params;

  // Check customer ownership
  const { exists, isOwner } = await checkCustomerOwnership(
    customerId,
    session!.user.id
  );

  if (!exists) {
    return errorResponse('NOT_FOUND', '找不到此客戶');
  }

  if (!isOwner) {
    return errorResponse('FORBIDDEN', '無權修改此客戶的聯絡人');
  }

  // Check contact exists and belongs to customer
  const existingContact = await prisma.contact.findUnique({
    where: { id: contactId },
    select: {
      id: true,
      customerId: true,
      name: true,
      email: true,
      phone: true,
      title: true,
      isPrimary: true,
    },
  });

  if (!existingContact || existingContact.customerId !== customerId) {
    return errorResponse('NOT_FOUND', '找不到此聯絡人');
  }

  try {
    const body = await request.json();

    // Validate input
    const result = updateContactSchema.safeParse(body);
    if (!result.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        result.error.issues[0].message
      );
    }

    const data = result.data;

    // If setting as primary, unset other primary contacts
    if (data.isPrimary) {
      await prisma.contact.updateMany({
        where: {
          customerId,
          isPrimary: true,
          NOT: { id: contactId },
        },
        data: { isPrimary: false },
      });
    }

    // Update contact
    const contact = await prisma.contact.update({
      where: { id: contactId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        title: true,
        isPrimary: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Log audit event with changes
    await logAudit({
      action: 'update',
      entity: 'contact',
      entityId: contactId,
      userId: session!.user.id,
      details: {
        customerId,
        before: {
          name: existingContact.name,
          email: existingContact.email,
          phone: existingContact.phone,
          title: existingContact.title,
          isPrimary: existingContact.isPrimary,
        },
        after: data,
      },
      request,
    });

    return successResponse(contact);
  } catch (err) {
    console.error('Update contact error:', err);
    return errorResponse('INTERNAL_ERROR', '更新聯絡人失敗');
  }
}

/**
 * DELETE /api/customers/[id]/contacts/[contactId]
 * Delete a contact
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id: customerId, contactId } = await context.params;

  // Check customer ownership
  const { exists, isOwner } = await checkCustomerOwnership(
    customerId,
    session!.user.id
  );

  if (!exists) {
    return errorResponse('NOT_FOUND', '找不到此客戶');
  }

  if (!isOwner) {
    return errorResponse('FORBIDDEN', '無權刪除此客戶的聯絡人');
  }

  // Check contact exists and belongs to customer
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    select: {
      id: true,
      customerId: true,
      name: true,
      email: true,
    },
  });

  if (!contact || contact.customerId !== customerId) {
    return errorResponse('NOT_FOUND', '找不到此聯絡人');
  }

  try {
    // Delete contact
    await prisma.contact.delete({
      where: { id: contactId },
    });

    // Log audit event
    await logAudit({
      action: 'delete',
      entity: 'contact',
      entityId: contactId,
      userId: session!.user.id,
      details: {
        customerId,
        name: contact.name,
        email: contact.email,
      },
      request,
    });

    return successResponse({ deleted: true });
  } catch (err) {
    console.error('Delete contact error:', err);
    return errorResponse('INTERNAL_ERROR', '刪除聯絡人失敗');
  }
}
