/**
 * Admin Role Management API
 * GET /api/admin/roles - List organization roles
 * POST /api/admin/roles - Create custom role
 *
 * ISO 27001 A.9.2.2 (User Access Provisioning)
 * ISO 27001 A.9.2.3 (Management of Privileged Access Rights)
 */

import { z } from 'zod';
import {
  requireAuth,
  requirePermission,
  getOrganizationId,
  successResponse,
  listResponse,
  errorResponse,
  logAdminAction,
  PERMISSIONS,
} from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';
import { isValidPermission } from '@/lib/permissions';

// ============================================
// Validation Schemas
// ============================================

const createRoleSchema = z.object({
  name: z.string().min(1, '請輸入角色名稱').max(50, '角色名稱不能超過 50 字'),
  description: z.string().max(200, '描述不能超過 200 字').optional(),
  permissions: z
    .array(z.string())
    .min(1, '請至少選擇一個權限')
    .refine(
      (perms) => perms.every((p) => isValidPermission(p)),
      '包含無效的權限代碼'
    ),
  isDefault: z.boolean().default(false),
});

// ============================================
// GET /api/admin/roles - List organization roles
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

    // 3. Check permission
    const { error: permError } = await requirePermission(
      session,
      organizationId,
      PERMISSIONS.ADMIN_ROLES
    );
    if (permError) return permError;

    // 4. Parse query parameters
    const url = new URL(request.url);
    const includeSystem = url.searchParams.get('includeSystem') !== 'false';
    const includePermissions = url.searchParams.get('includePermissions') === 'true';

    // 5. Build filter conditions
    const where: Record<string, unknown> = {
      OR: [
        { organizationId },
        // Include system roles (organizationId is null)
        ...(includeSystem ? [{ organizationId: null, isSystem: true }] : []),
      ],
    };

    // 6. Query roles
    const roles = await prisma.role.findMany({
      where,
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
      include: {
        permissions: includePermissions
          ? {
              include: {
                permission: {
                  select: {
                    code: true,
                    name: true,
                    category: true,
                  },
                },
              },
            }
          : false,
        _count: {
          select: {
            members: {
              where: { organizationId },
            },
          },
        },
      },
    });

    // 7. Transform response
    const transformedRoles = roles.map((role) => {
      const perms = role.permissions as unknown;
      const permissionList = includePermissions && Array.isArray(perms)
        ? (perms as { permission: { code: string; name: string; category: string } }[]).map((rp) => ({
            code: rp.permission.code,
            name: rp.permission.name,
            category: rp.permission.category,
          }))
        : undefined;

      return {
        id: role.id,
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
        isDefault: role.isDefault,
        organizationId: role.organizationId,
        memberCount: role._count.members,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
        permissions: permissionList,
        permissionCount: includePermissions && Array.isArray(perms)
          ? perms.length
          : undefined,
      };
    });

    return listResponse(transformedRoles, {
      page: 1,
      limit: roles.length,
      total: roles.length,
    });
  } catch (error) {
    console.error('List roles error:', error);
    return errorResponse('INTERNAL_ERROR', '取得角色列表失敗');
  }
}

// ============================================
// POST /api/admin/roles - Create custom role
// ============================================

export async function POST(request: Request) {
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

    // 3. Check permission
    const { error: permError } = await requirePermission(
      session,
      organizationId,
      PERMISSIONS.ADMIN_ROLES_CREATE
    );
    if (permError) return permError;

    // 4. Parse and validate request body
    const body = await request.json();
    const validatedData = createRoleSchema.safeParse(body);

    if (!validatedData.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        validatedData.error.issues[0].message
      );
    }

    const { name, description, permissions, isDefault } = validatedData.data;

    // 5. Check for duplicate role name in organization
    const existingRole = await prisma.role.findFirst({
      where: {
        name,
        OR: [{ organizationId }, { organizationId: null }],
      },
    });

    if (existingRole) {
      return errorResponse('CONFLICT', '此角色名稱已存在');
    }

    // 6. Get permission IDs
    const permissionRecords = await prisma.permission.findMany({
      where: {
        code: { in: permissions },
      },
    });

    if (permissionRecords.length !== permissions.length) {
      return errorResponse('VALIDATION_ERROR', '部分權限代碼無效');
    }

    // 7. Create role with permissions in transaction
    const result = await prisma.$transaction(async (tx) => {
      // If setting as default, unset other defaults first
      if (isDefault) {
        await tx.role.updateMany({
          where: { organizationId, isDefault: true },
          data: { isDefault: false },
        });
      }

      // Create role
      const role = await tx.role.create({
        data: {
          name,
          description,
          organizationId,
          isSystem: false,
          isDefault,
          permissions: {
            createMany: {
              data: permissionRecords.map((p) => ({
                permissionId: p.id,
              })),
            },
          },
        },
        include: {
          permissions: {
            include: {
              permission: {
                select: {
                  code: true,
                  name: true,
                  category: true,
                },
              },
            },
          },
        },
      });

      return role;
    });

    // 8. Log audit
    await logAdminAction({
      action: 'create',
      entity: 'role',
      entityId: result.id,
      userId: session.user.id,
      organizationId,
      after: {
        name: result.name,
        description: result.description,
        permissions: permissions,
        isDefault,
      },
      request,
    });

    // 9. Transform response
    const response = {
      id: result.id,
      name: result.name,
      description: result.description,
      isSystem: result.isSystem,
      isDefault: result.isDefault,
      organizationId: result.organizationId,
      permissions: result.permissions.map((rp) => ({
        code: rp.permission.code,
        name: rp.permission.name,
        category: rp.permission.category,
      })),
      createdAt: result.createdAt,
    };

    return successResponse(response, 201);
  } catch (error) {
    console.error('Create role error:', error);
    return errorResponse('INTERNAL_ERROR', '建立角色失敗');
  }
}
