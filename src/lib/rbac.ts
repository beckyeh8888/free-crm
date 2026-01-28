/**
 * RBAC (Role-Based Access Control) Core Logic
 *
 * This module provides functions for checking user permissions and roles.
 * Follows ISO 27001 A.9.2.2 (User Access Provisioning)
 */

import { prisma } from './prisma';
import { PERMISSIONS, PermissionCode, isValidPermission } from './permissions';

// ============================================
// Types
// ============================================

export interface UserPermissionContext {
  userId: string;
  organizationId: string;
  permissions: Set<PermissionCode>;
  role: {
    id: string;
    name: string;
    isSystem: boolean;
  };
  memberStatus: string;
}

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}

// ============================================
// Permission Cache (in-memory, short TTL)
// ============================================

const permissionCache = new Map<string, { permissions: Set<PermissionCode>; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache

function getCacheKey(userId: string, organizationId: string): string {
  return `${userId}:${organizationId}`;
}

function getCachedPermissions(userId: string, organizationId: string): Set<PermissionCode> | null {
  const key = getCacheKey(userId, organizationId);
  const cached = permissionCache.get(key);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.permissions;
  }

  // Remove expired cache
  if (cached) {
    permissionCache.delete(key);
  }

  return null;
}

function setCachedPermissions(
  userId: string,
  organizationId: string,
  permissions: Set<PermissionCode>
): void {
  const key = getCacheKey(userId, organizationId);
  permissionCache.set(key, {
    permissions,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

/**
 * Clear permission cache for a user (call when role/permissions change)
 */
export function clearPermissionCache(userId: string, organizationId?: string): void {
  if (organizationId) {
    permissionCache.delete(getCacheKey(userId, organizationId));
  } else {
    // Clear all caches for this user
    for (const key of permissionCache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        permissionCache.delete(key);
      }
    }
  }
}

// ============================================
// Core Permission Functions
// ============================================

/**
 * Get user's permissions for an organization
 */
export async function getUserPermissions(
  userId: string,
  organizationId: string
): Promise<Set<PermissionCode>> {
  // Check cache first
  const cached = getCachedPermissions(userId, organizationId);
  if (cached) {
    return cached;
  }

  // Query database
  const member = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId,
      },
    },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  if (member?.status !== 'active') {
    return new Set();
  }

  const permissions = new Set<PermissionCode>(
    member.role.permissions
      .map((rp) => rp.permission.code)
      .filter((code): code is PermissionCode => isValidPermission(code))
  );

  // Cache the result
  setCachedPermissions(userId, organizationId, permissions);

  return permissions;
}

/**
 * Get full user permission context for an organization
 */
export async function getUserPermissionContext(
  userId: string,
  organizationId: string
): Promise<UserPermissionContext | null> {
  const member = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId,
      },
    },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  if (!member) {
    return null;
  }

  const permissions = new Set<PermissionCode>(
    member.role.permissions
      .map((rp) => rp.permission.code)
      .filter((code): code is PermissionCode => isValidPermission(code))
  );

  return {
    userId,
    organizationId,
    permissions,
    role: {
      id: member.role.id,
      name: member.role.name,
      isSystem: member.role.isSystem,
    },
    memberStatus: member.status,
  };
}

/**
 * Check if a user has a specific permission
 */
export async function hasPermission(
  userId: string,
  organizationId: string,
  permission: PermissionCode
): Promise<boolean> {
  const permissions = await getUserPermissions(userId, organizationId);
  return permissions.has(permission);
}

/**
 * Check if a user has any of the specified permissions
 */
export async function hasAnyPermission(
  userId: string,
  organizationId: string,
  requiredPermissions: PermissionCode[]
): Promise<boolean> {
  const permissions = await getUserPermissions(userId, organizationId);
  return requiredPermissions.some((p) => permissions.has(p));
}

/**
 * Check if a user has all of the specified permissions
 */
export async function hasAllPermissions(
  userId: string,
  organizationId: string,
  requiredPermissions: PermissionCode[]
): Promise<boolean> {
  const permissions = await getUserPermissions(userId, organizationId);
  return requiredPermissions.every((p) => permissions.has(p));
}

/**
 * Detailed permission check with reason
 */
export async function checkPermission(
  userId: string,
  organizationId: string,
  permission: PermissionCode
): Promise<PermissionCheckResult> {
  // Check if user is a member of the organization
  const member = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId,
      },
    },
  });

  if (!member) {
    return {
      allowed: false,
      reason: 'User is not a member of this organization',
    };
  }

  if (member.status === 'suspended') {
    return {
      allowed: false,
      reason: 'User membership is suspended',
    };
  }

  if (member.status === 'invited') {
    return {
      allowed: false,
      reason: 'User has not accepted the invitation',
    };
  }

  const hasPermissionResult = await hasPermission(userId, organizationId, permission);

  if (!hasPermissionResult) {
    return {
      allowed: false,
      reason: `User does not have the required permission: ${permission}`,
    };
  }

  return { allowed: true };
}

// ============================================
// Organization Membership Functions
// ============================================

/**
 * Check if a user is a member of an organization
 */
export async function isOrganizationMember(
  userId: string,
  organizationId: string
): Promise<boolean> {
  const member = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId,
      },
    },
  });

  return member !== null && member.status === 'active';
}

/**
 * Get user's organizations
 */
export async function getUserOrganizations(userId: string) {
  const memberships = await prisma.organizationMember.findMany({
    where: {
      userId,
      status: 'active',
    },
    include: {
      organization: true,
      role: true,
    },
  });

  return memberships.map((m) => ({
    organization: m.organization,
    role: m.role,
    joinedAt: m.joinedAt,
  }));
}

/**
 * Get user's default/primary organization
 */
export async function getUserDefaultOrganization(userId: string) {
  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId,
      status: 'active',
    },
    include: {
      organization: true,
      role: true,
    },
    orderBy: {
      joinedAt: 'asc', // First joined organization is default
    },
  });

  return membership
    ? {
        organization: membership.organization,
        role: membership.role,
      }
    : null;
}

// ============================================
// Role Functions
// ============================================

/**
 * Get a user's role in an organization
 */
export async function getUserRole(userId: string, organizationId: string) {
  const member = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId,
      },
    },
    include: {
      role: true,
    },
  });

  return member?.role || null;
}

/**
 * Check if a user has a specific role
 */
export async function hasRole(
  userId: string,
  organizationId: string,
  roleName: string
): Promise<boolean> {
  const role = await getUserRole(userId, organizationId);
  return role?.name === roleName;
}

/**
 * Check if a user is an admin (has admin:users permission)
 */
export async function isAdmin(userId: string, organizationId: string): Promise<boolean> {
  return hasPermission(userId, organizationId, PERMISSIONS.ADMIN_USERS);
}

/**
 * Check if a user is a super admin (has all permissions)
 */
export async function isSuperAdmin(userId: string, organizationId: string): Promise<boolean> {
  const role = await getUserRole(userId, organizationId);
  return role?.name === 'Super Admin' || false;
}

// ============================================
// Resource Access Control
// ============================================

/**
 * Check if a user can access a customer
 * (either assigned to them or they have permission to view all)
 */
export async function canAccessCustomer(
  userId: string,
  organizationId: string,
  customerId: string
): Promise<boolean> {
  // First check if user has read permission
  const hasReadPermission = await hasPermission(userId, organizationId, PERMISSIONS.CUSTOMERS_READ);
  if (!hasReadPermission) {
    return false;
  }

  // Check if user can assign customers (means they can see all)
  const canAssign = await hasPermission(userId, organizationId, PERMISSIONS.CUSTOMERS_ASSIGN);
  if (canAssign) {
    // Verify customer belongs to the organization
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        organizationId,
      },
    });
    return customer !== null;
  }

  // Otherwise, check if customer is assigned to or created by the user
  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      organizationId,
      OR: [{ assignedToId: userId }, { createdById: userId }],
    },
  });

  return customer !== null;
}

/**
 * Check if a user can access a deal
 */
export async function canAccessDeal(
  userId: string,
  organizationId: string,
  dealId: string
): Promise<boolean> {
  const hasReadPermission = await hasPermission(userId, organizationId, PERMISSIONS.DEALS_READ);
  if (!hasReadPermission) {
    return false;
  }

  const canAssign = await hasPermission(userId, organizationId, PERMISSIONS.DEALS_ASSIGN);

  const deal = await prisma.deal.findFirst({
    where: {
      id: dealId,
      customer: {
        organizationId,
      },
      ...(canAssign
        ? {}
        : {
            OR: [{ assignedToId: userId }, { createdById: userId }],
          }),
    },
  });

  return deal !== null;
}

// ============================================
// Utility Types for API
// ============================================

export type { PermissionCode } from './permissions';
export { PERMISSIONS } from './permissions';
