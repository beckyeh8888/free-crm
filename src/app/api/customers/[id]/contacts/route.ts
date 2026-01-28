/**
 * Contact API - List & Create
 *
 * GET  /api/customers/[id]/contacts - List contacts for a customer
 * POST /api/customers/[id]/contacts - Create a new contact
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  requireAuth,
  successResponse,
  listResponse,
  errorResponse,
  logAudit,
  checkCustomerOwnership,
  getPaginationParams,
} from '@/lib/api-utils';
import { createContactSchema } from '@/lib/validation';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/customers/[id]/contacts
 * List all contacts for a customer
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id: customerId } = await context.params;

  // Check customer ownership
  const { exists, isOwner } = await checkCustomerOwnership(
    customerId,
    session.user.id
  );

  if (!exists) {
    return errorResponse('NOT_FOUND', '找不到此客戶');
  }

  if (!isOwner) {
    return errorResponse('FORBIDDEN', '無權存取此客戶');
  }

  const searchParams = request.nextUrl.searchParams;
  const { page, limit, skip } = getPaginationParams(searchParams);

  // Fetch contacts
  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where: { customerId },
      skip,
      take: limit,
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
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
    }),
    prisma.contact.count({ where: { customerId } }),
  ]);

  // Log audit event
  await logAudit({
    action: 'read',
    entity: 'contact',
    userId: session.user.id,
    details: { customerId, count: contacts.length },
    request,
  });

  return listResponse(contacts, { page, limit, total });
}

/**
 * POST /api/customers/[id]/contacts
 * Create a new contact for a customer
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id: customerId } = await context.params;

  // Check customer ownership
  const { exists, isOwner } = await checkCustomerOwnership(
    customerId,
    session.user.id
  );

  if (!exists) {
    return errorResponse('NOT_FOUND', '找不到此客戶');
  }

  if (!isOwner) {
    return errorResponse('FORBIDDEN', '無權新增此客戶的聯絡人');
  }

  try {
    const body = await request.json();

    // Validate input
    const result = createContactSchema.safeParse(body);
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
        where: { customerId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    // Create contact
    const contact = await prisma.contact.create({
      data: {
        ...data,
        customerId,
      },
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

    // Log audit event
    await logAudit({
      action: 'create',
      entity: 'contact',
      entityId: contact.id,
      userId: session.user.id,
      details: {
        customerId,
        name: contact.name,
        email: contact.email,
      },
      request,
    });

    return successResponse(contact, 201);
  } catch (err) {
    console.error('Create contact error:', err);
    return errorResponse('INTERNAL_ERROR', '建立聯絡人失敗');
  }
}
