/**
 * Unified Search API
 *
 * GET /api/search?q=keyword&limit=5
 *
 * Searches across multiple resources in parallel:
 * - Customers
 * - Deals
 * - Contacts
 * - Documents
 *
 * Multi-tenant: Results scoped to user's organization
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  requireAuth,
  successResponse,
  errorResponse,
} from '@/lib/api-utils';
import { getUserDefaultOrganization } from '@/lib/rbac';

interface SearchResult {
  readonly customers: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
    readonly company: string | null;
    readonly companyPhone: string | null;
    readonly type: string;
    readonly email: string | null;
    readonly phone: string | null;
  }>;
  readonly deals: ReadonlyArray<{
    readonly id: string;
    readonly title: string;
    readonly value: number;
    readonly stage: string;
  }>;
  readonly contacts: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
    readonly email: string | null;
    readonly customerName: string | null;
  }>;
  readonly documents: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
    readonly type: string;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    // 1. Auth check
    const { session, error: authError } = await requireAuth();
    if (authError) {
      return authError;
    }

    if (!session?.user?.id) {
      return errorResponse('UNAUTHORIZED', '請先登入');
    }

    // 2. Get organization
    const membership = await getUserDefaultOrganization(session.user.id);
    if (!membership) {
      return errorResponse('NOT_FOUND', '找不到組織');
    }

    const organizationId = membership.organization.id;

    // 3. Parse query params
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q')?.trim() || '';
    const limit = Math.min(Number.parseInt(searchParams.get('limit') || '5', 10), 10);

    // 4. If no query, return empty results
    if (!query) {
      const emptyResult: SearchResult = {
        customers: [],
        deals: [],
        contacts: [],
        documents: [],
      };
      return successResponse(emptyResult);
    }

    // 5. Search all resources in parallel
    // Note: SQLite doesn't support 'mode: insensitive', so we use LOWER() via raw query
    // or just do case-sensitive contains. For simplicity, using contains (case-sensitive).
    const [customers, deals, contacts, documents] = await Promise.all([
      // Search customers
      prisma.customer.findMany({
        where: {
          organizationId,
          OR: [
            { name: { contains: query } },
            { company: { contains: query } },
            { companyPhone: { contains: query } },
            { email: { contains: query } },
            { phone: { contains: query } },
          ],
        },
        select: {
          id: true,
          name: true,
          company: true,
          companyPhone: true,
          type: true,
          email: true,
          phone: true,
        },
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),

      // Search deals (via customer.organizationId)
      prisma.deal.findMany({
        where: {
          customer: {
            organizationId,
          },
          OR: [
            { title: { contains: query } },
          ],
        },
        select: {
          id: true,
          title: true,
          value: true,
          stage: true,
        },
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),

      // Search contacts
      prisma.contact.findMany({
        where: {
          customer: {
            organizationId,
          },
          OR: [
            { name: { contains: query } },
            { email: { contains: query } },
            { title: { contains: query } },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          customer: {
            select: {
              name: true,
            },
          },
        },
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),

      // Search documents
      prisma.document.findMany({
        where: {
          organizationId,
          OR: [
            { name: { contains: query } },
            { content: { contains: query } },
          ],
        },
        select: {
          id: true,
          name: true,
          type: true,
        },
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    // 6. Transform contacts to include customerName
    const transformedContacts = contacts.map((contact) => ({
      id: contact.id,
      name: contact.name,
      email: contact.email,
      customerName: contact.customer?.name ?? null,
    }));

    // 7. Transform deals - value is Decimal, convert to number
    const transformedDeals = deals.map((d) => ({
      id: d.id,
      title: d.title,
      value: typeof d.value === 'number' ? d.value : Number(d.value),
      stage: d.stage,
    }));

    // 8. Return results
    const result: SearchResult = {
      customers,
      deals: transformedDeals,
      contacts: transformedContacts,
      documents,
    };

    return successResponse(result);
  } catch (error) {
    console.error('Search error:', error);
    return errorResponse('INTERNAL_ERROR', '搜尋失敗');
  }
}
