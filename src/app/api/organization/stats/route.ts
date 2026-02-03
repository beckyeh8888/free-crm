/**
 * Organization Stats API - Usage statistics
 * Follows ISO 27001 A.9.2.2 (User Access Provisioning)
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  requireAuth,
  requireOrgMember,
  getOrganizationId,
  successResponse,
  errorResponse,
} from '@/lib/api-utils';

// ============================================
// GET /api/organization/stats
// ============================================

export async function GET(request: NextRequest) {
  // Auth check
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  // Get organization ID
  const organizationId =
    getOrganizationId(request) ?? session.user.defaultOrganizationId;

  if (!organizationId) {
    return errorResponse('NOT_FOUND', '找不到組織');
  }

  // Permission check - any org member can view stats
  const { error: permError } = await requireOrgMember(session, organizationId);
  if (permError) return permError;

  // Get counts
  const [
    memberCount,
    customerCount,
    dealCount,
    documentCount,
    activeMembers,
    suspendedMembers,
    openDeals,
    wonDeals,
    lostDeals,
  ] = await Promise.all([
    // Total members
    prisma.organizationMember.count({
      where: { organizationId },
    }),
    // Total customers
    prisma.customer.count({
      where: { organizationId },
    }),
    // Total deals
    prisma.deal.count({
      where: { customer: { organizationId } },
    }),
    // Total documents
    prisma.document.count({
      where: { organizationId },
    }),
    // Active members
    prisma.organizationMember.count({
      where: { organizationId, status: 'active' },
    }),
    // Suspended members
    prisma.organizationMember.count({
      where: { organizationId, status: 'suspended' },
    }),
    // Open deals
    prisma.deal.count({
      where: {
        customer: { organizationId },
        stage: { in: ['lead', 'qualified', 'proposal', 'negotiation'] },
      },
    }),
    // Won deals
    prisma.deal.count({
      where: {
        customer: { organizationId },
        stage: 'won',
      },
    }),
    // Lost deals
    prisma.deal.count({
      where: {
        customer: { organizationId },
        stage: 'lost',
      },
    }),
  ]);

  // Get plan limits
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { plan: true },
  });

  const planLimits: Record<string, { members: number; customers: number; documents: number }> = {
    free: { members: 5, customers: 100, documents: 100 },
    pro: { members: 25, customers: 1000, documents: 1000 },
    enterprise: { members: -1, customers: -1, documents: -1 }, // -1 = unlimited
  };

  const limits = planLimits[organization?.plan || 'free'] || planLimits.free;

  return successResponse({
    counts: {
      members: memberCount,
      customers: customerCount,
      deals: dealCount,
      documents: documentCount,
    },
    memberBreakdown: {
      active: activeMembers,
      suspended: suspendedMembers,
      invited: memberCount - activeMembers - suspendedMembers,
    },
    dealBreakdown: {
      open: openDeals,
      won: wonDeals,
      lost: lostDeals,
    },
    limits: {
      members: limits.members,
      customers: limits.customers,
      documents: limits.documents,
    },
    usage: {
      membersUsage: limits.members === -1 ? 0 : Math.round((memberCount / limits.members) * 100),
      customersUsage: limits.customers === -1 ? 0 : Math.round((customerCount / limits.customers) * 100),
      documentsUsage: limits.documents === -1 ? 0 : Math.round((documentCount / limits.documents) * 100),
    },
  });
}
