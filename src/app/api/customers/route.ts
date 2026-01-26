/**
 * Customer API - List & Create
 *
 * GET  /api/customers - List customers (paginated, filterable)
 * POST /api/customers - Create a new customer
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
} from '@/lib/api-utils';
import {
  createCustomerSchema,
  customerFilterSchema,
} from '@/lib/validation';

/**
 * GET /api/customers
 * List all customers for the authenticated user
 *
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * - search: string (search by name, email, company)
 * - type: 'B2B' | 'B2C'
 * - status: 'active' | 'inactive' | 'lead'
 */
export async function GET(request: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const searchParams = request.nextUrl.searchParams;
  const { page, limit, skip } = getPaginationParams(searchParams);

  // Parse filters
  const filterResult = customerFilterSchema.safeParse({
    search: searchParams.get('search') || undefined,
    type: searchParams.get('type') || undefined,
    status: searchParams.get('status') || undefined,
  });

  const filters = filterResult.success ? filterResult.data : {};

  // Build where clause
  const where = {
    userId: session!.user.id,
    ...(filters.type && { type: filters.type }),
    ...(filters.status && { status: filters.status }),
    ...(filters.search && {
      OR: [
        { name: { contains: filters.search } },
        { email: { contains: filters.search } },
        { company: { contains: filters.search } },
      ],
    }),
  };

  // Execute queries in parallel
  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        type: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            contacts: true,
            deals: true,
          },
        },
      },
    }),
    prisma.customer.count({ where }),
  ]);

  // Log audit event (bulk read)
  await logAudit({
    action: 'read',
    entity: 'customer',
    userId: session!.user.id,
    details: { count: customers.length, filters },
    request,
  });

  return listResponse(customers, { page, limit, total });
}

/**
 * POST /api/customers
 * Create a new customer
 */
export async function POST(request: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();

    // Validate input
    const result = createCustomerSchema.safeParse(body);
    if (!result.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        result.error.issues[0].message
      );
    }

    const data = result.data;

    // Check for duplicate email (optional, only if email provided)
    if (data.email) {
      const existing = await prisma.customer.findFirst({
        where: {
          userId: session!.user.id,
          email: data.email,
        },
      });

      if (existing) {
        return errorResponse('CONFLICT', '此電子郵件已存在');
      }
    }

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        ...data,
        userId: session!.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        type: true,
        status: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Log audit event
    await logAudit({
      action: 'create',
      entity: 'customer',
      entityId: customer.id,
      userId: session!.user.id,
      details: { name: customer.name, email: customer.email },
      request,
    });

    return successResponse(customer, 201);
  } catch (err) {
    console.error('Create customer error:', err);
    return errorResponse('INTERNAL_ERROR', '建立客戶失敗');
  }
}
