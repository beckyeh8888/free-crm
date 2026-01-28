/**
 * Organization Test Data Factory
 * For multi-tenant schema (Sprint 2)
 */

import { prisma } from '@/lib/prisma';
import { DEFAULT_PERMISSIONS } from '@/lib/permissions';

export interface OrganizationFactoryData {
  name?: string;
  slug?: string;
  plan?: 'free' | 'pro' | 'enterprise';
}

export interface MemberFactoryData {
  userId: string;
  organizationId: string;
  roleId: string;
  status?: 'active' | 'invited' | 'suspended';
}

let orgCounter = 0;

/**
 * Build organization data without creating in database
 */
export function buildOrganization(overrides: OrganizationFactoryData = {}) {
  orgCounter++;
  const timestamp = Date.now();
  return {
    name: overrides.name ?? `Test Organization ${orgCounter}`,
    slug: overrides.slug ?? `test-org-${orgCounter}-${timestamp}`,
    plan: overrides.plan ?? 'free',
  };
}

/**
 * Create organization in database
 */
export async function createOrganization(overrides: OrganizationFactoryData = {}) {
  const data = buildOrganization(overrides);

  return prisma.organization.create({
    data,
  });
}

/**
 * Create default system role (Admin) for an organization
 */
export async function createAdminRole(organizationId: string) {
  return prisma.role.create({
    data: {
      name: 'Admin',
      description: 'Full administrator access',
      organizationId,
      isSystem: true,
      isDefault: false,
    },
  });
}

/**
 * Create default user role for an organization
 */
export async function createUserRole(organizationId: string) {
  return prisma.role.create({
    data: {
      name: 'User',
      description: 'Standard user access',
      organizationId,
      isSystem: true,
      isDefault: true,
    },
  });
}

/**
 * Create organization member
 */
export async function createMember(data: MemberFactoryData) {
  return prisma.organizationMember.create({
    data: {
      userId: data.userId,
      organizationId: data.organizationId,
      roleId: data.roleId,
      status: data.status ?? 'active',
    },
  });
}

/**
 * Create a complete test context with:
 * - Organization
 * - Admin role
 * - User role
 * - User as organization member with specified role
 *
 * This is the main helper for setting up integration tests
 */
export async function createTestContext(userId: string, roleType: 'admin' | 'user' = 'admin') {
  // Create organization
  const organization = await createOrganization();

  // Create roles
  const adminRole = await createAdminRole(organization.id);
  const userRole = await createUserRole(organization.id);

  // Add user as member with the specified role
  const role = roleType === 'admin' ? adminRole : userRole;
  const member = await createMember({
    userId,
    organizationId: organization.id,
    roleId: role.id,
  });

  return {
    organization,
    adminRole,
    userRole,
    member,
    currentRole: role,
  };
}

/**
 * Reset factory counter
 */
export function resetOrganizationFactory() {
  orgCounter = 0;
}
