/**
 * Admin Permissions List API
 * GET /api/admin/permissions - List all available permissions
 *
 * This API returns all permission definitions for use in role management UI.
 * Permissions are organized by category for easier display.
 *
 * ISO 27001 A.9.2.2 (User Access Provisioning)
 */

import {
  requireAuth,
  requirePermission,
  getOrganizationId,
  successResponse,
  errorResponse,
  PERMISSIONS,
} from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';
import {
  PERMISSION_DEFINITIONS,
  PERMISSION_CATEGORIES,
  type PermissionDefinition,
} from '@/lib/permissions';

// ============================================
// Types
// ============================================

interface PermissionCategory {
  category: string;
  name: string;
  order: number;
  permissions: PermissionDefinition[];
}

// ============================================
// GET /api/admin/permissions - List all permissions
// ============================================

export async function GET(request: Request) {
  try {
    // 1. Authenticate
    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    // 2. Get organization ID
    const organizationId =
      getOrganizationId(request) || session.user.defaultOrganizationId;
    if (!organizationId) {
      return errorResponse('FORBIDDEN', '無法確定組織');
    }

    // 3. Check permission (any admin role permission is sufficient)
    const { error: permError } = await requirePermission(
      session,
      organizationId,
      PERMISSIONS.ADMIN_ROLES
    );
    if (permError) return permError;

    // 4. Parse query parameters
    const url = new URL(request.url);
    const groupByCategory = url.searchParams.get('groupByCategory') !== 'false';
    const category = url.searchParams.get('category');

    // 5. Filter permissions if category specified
    let permissions = [...PERMISSION_DEFINITIONS];
    if (category) {
      permissions = permissions.filter((p) => p.category === category);
    }

    // 6. Optionally get permission IDs from database (for role assignment)
    const dbPermissions = await prisma.permission.findMany({
      select: {
        id: true,
        code: true,
      },
    });

    const permissionIdMap = new Map(
      dbPermissions.map((p) => [p.code, p.id])
    );

    // 7. Transform response
    if (groupByCategory) {
      // Group permissions by category
      const grouped: PermissionCategory[] = [];

      for (const [categoryKey, categoryInfo] of Object.entries(
        PERMISSION_CATEGORIES
      )) {
        const categoryPermissions = permissions.filter(
          (p) => p.category === categoryKey
        );

        if (categoryPermissions.length > 0) {
          grouped.push({
            category: categoryKey,
            name: categoryInfo.name,
            order: categoryInfo.order,
            permissions: categoryPermissions.map((p) => ({
              ...p,
              id: permissionIdMap.get(p.code),
            })) as PermissionDefinition[],
          });
        }
      }

      // Sort by order
      grouped.sort((a, b) => a.order - b.order);

      return successResponse({
        grouped,
        totalCount: permissions.length,
        categories: Object.entries(PERMISSION_CATEGORIES).map(
          ([key, info]) => ({
            key,
            name: info.name,
            order: info.order,
          })
        ),
      });
    } else {
      // Return flat list with IDs
      const flatPermissions = permissions.map((p) => ({
        ...p,
        id: permissionIdMap.get(p.code),
      }));

      return successResponse({
        permissions: flatPermissions,
        totalCount: flatPermissions.length,
      });
    }
  } catch (error) {
    console.error('List permissions error:', error);
    return errorResponse('INTERNAL_ERROR', '取得權限列表失敗');
  }
}
