/**
 * Admin Role Detail API
 * GET /api/admin/roles/[id] - Get role details
 * PATCH /api/admin/roles/[id] - Update role
 * DELETE /api/admin/roles/[id] - Delete role
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
  errorResponse,
  logAdminAction,
  PERMISSIONS,
} from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';
import { isValidPermission } from '@/lib/permissions';

// ============================================
// Validation Schemas
// ============================================

const updateRoleSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().max(200).optional(),
  permissions: z
    .array(z.string())
    .min(1, '請至少選擇一個權限')
    .refine(
      (perms) => perms.every((p) => isValidPermission(p)),
      '包含無效的權限代碼'
    )
    .optional(),
  isDefault: z.boolean().optional(),
});

// ============================================
// Helper Functions
// ============================================

async function getRoleWithDetails(roleId: string, organizationId: string) {
  return prisma.role.findFirst({
    where: {
      id: roleId,
      OR: [{ organizationId }, { organizationId: null, isSystem: true }],
    },
    include: {
      permissions: {
        include: {
          permission: {
            select: {
              id: true,
              code: true,
              name: true,
              category: true,
              description: true,
            },
          },
        },
      },
      _count: {
        select: {
          members: {
            where: { organizationId },
          },
        },
      },
    },
  });
}

/**
 * Validate role update - check for duplicate names
 */
async function validateRoleNameUnique(
  name: string | undefined,
  currentName: string,
  roleId: string,
  organizationId: string
): Promise<boolean> {
  if (!name || name === currentName) return true;

  const existingRole = await prisma.role.findFirst({
    where: {
      name,
      id: { not: roleId },
      OR: [{ organizationId }, { organizationId: null }],
    },
  });

  return !existingRole;
}

/**
 * Get permission records by codes
 */
async function getPermissionRecords(
  permissions: string[]
): Promise<{ id: string; code: string }[]> {
  return prisma.permission.findMany({
    where: { code: { in: permissions } },
    select: { id: true, code: true },
  });
}

/**
 * Build update data object
 */
function buildRoleUpdateData(data: {
  name?: string;
  description?: string;
  isDefault?: boolean;
}): Record<string, unknown> {
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;
  return updateData;
}

// ============================================
// GET /api/admin/roles/[id] - Get role details
// ============================================

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // 4. Get role
    const role = await getRoleWithDetails(id, organizationId);

    if (!role) {
      return errorResponse('NOT_FOUND', '角色不存在');
    }

    // 5. Transform response
    const response = {
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      isDefault: role.isDefault,
      organizationId: role.organizationId,
      memberCount: role._count.members,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      permissions: role.permissions.map((rp) => ({
        id: rp.permission.id,
        code: rp.permission.code,
        name: rp.permission.name,
        category: rp.permission.category,
        description: rp.permission.description,
      })),
    };

    return successResponse(response);
  } catch (error) {
    console.error('Get role error:', error);
    return errorResponse('INTERNAL_ERROR', '取得角色詳情失敗');
  }
}

// ============================================
// PATCH /api/admin/roles/[id] - Update role
// ============================================

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Authenticate and authorize
    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    const organizationId =
      getOrganizationId(request) || session.user.defaultOrganizationId;
    if (!organizationId) {
      return errorResponse('FORBIDDEN', '無法確定組織');
    }

    const { error: permError } = await requirePermission(
      session,
      organizationId,
      PERMISSIONS.ADMIN_ROLES_UPDATE
    );
    if (permError) return permError;

    // 2. Validate request body
    const body = await request.json();
    const validatedData = updateRoleSchema.safeParse(body);
    if (!validatedData.success) {
      return errorResponse('VALIDATION_ERROR', validatedData.error.issues[0].message);
    }

    const { name, description, permissions, isDefault } = validatedData.data;

    // 3. Get and validate current role
    const currentRole = await getRoleWithDetails(id, organizationId);
    if (!currentRole) {
      return errorResponse('NOT_FOUND', '角色不存在');
    }

    // 4. Business rule validations
    const isEditingSystemRole = currentRole.isSystem && (name || description || permissions);
    if (isEditingSystemRole) {
      return errorResponse('FORBIDDEN', '無法修改系統角色的名稱、描述或權限');
    }

    const isNameUnique = await validateRoleNameUnique(name, currentRole.name, id, organizationId);
    if (!isNameUnique) {
      return errorResponse('CONFLICT', '此角色名稱已存在');
    }

    // 5. Validate permissions if provided
    let permissionRecords: { id: string; code: string }[] = [];
    if (permissions) {
      permissionRecords = await getPermissionRecords(permissions);
      if (permissionRecords.length !== permissions.length) {
        return errorResponse('VALIDATION_ERROR', '部分權限代碼無效');
      }
    }

    // 6. Store before state for audit
    const beforeState = {
      name: currentRole.name,
      description: currentRole.description,
      isDefault: currentRole.isDefault,
      permissions: currentRole.permissions.map((rp) => rp.permission.code),
    };

    // 7. Execute update in transaction
    const result = await executeRoleUpdate(
      id,
      organizationId,
      { name, description, isDefault },
      permissions,
      permissionRecords,
      currentRole.isDefault
    );

    // 8. Log audit
    await logAdminAction({
      action: permissions ? 'permission_change' : 'update',
      entity: 'role',
      entityId: id,
      userId: session.user.id,
      organizationId,
      before: beforeState,
      after: {
        name: result?.name,
        description: result?.description,
        isDefault: result?.isDefault,
        permissions: result?.permissions.map((rp) => rp.permission.code),
      },
      request,
    });

    // 9. Return response
    return successResponse({
      id: result?.id,
      name: result?.name,
      description: result?.description,
      isSystem: result?.isSystem,
      isDefault: result?.isDefault,
      organizationId: result?.organizationId,
      memberCount: result?._count.members,
      permissions: result?.permissions.map((rp) => ({
        code: rp.permission.code,
        name: rp.permission.name,
        category: rp.permission.category,
      })),
      updatedAt: result?.updatedAt,
    });
  } catch (error) {
    console.error('Update role error:', error);
    return errorResponse('INTERNAL_ERROR', '更新角色失敗');
  }
}

/**
 * Execute role update in a transaction
 */
async function executeRoleUpdate(
  roleId: string,
  organizationId: string,
  updateFields: { name?: string; description?: string; isDefault?: boolean },
  permissions: string[] | undefined,
  permissionRecords: { id: string; code: string }[],
  wasDefault: boolean
) {
  return prisma.$transaction(async (tx) => {
    // Unset other defaults if setting this as default
    if (updateFields.isDefault && !wasDefault) {
      await tx.role.updateMany({
        where: { organizationId, isDefault: true, id: { not: roleId } },
        data: { isDefault: false },
      });
    }

    // Update role
    await tx.role.update({
      where: { id: roleId },
      data: buildRoleUpdateData(updateFields),
    });

    // Update permissions if provided
    if (permissions) {
      await tx.rolePermission.deleteMany({ where: { roleId } });
      await tx.rolePermission.createMany({
        data: permissionRecords.map((p) => ({
          roleId,
          permissionId: p.id,
        })),
      });
    }

    // Return updated role
    return tx.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: {
            permission: { select: { code: true, name: true, category: true } },
          },
        },
        _count: { select: { members: { where: { organizationId } } } },
      },
    });
  });
}

// ============================================
// DELETE /api/admin/roles/[id] - Delete role
// ============================================

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
      PERMISSIONS.ADMIN_ROLES_DELETE
    );
    if (permError) return permError;

    // 4. Get current role
    const currentRole = await getRoleWithDetails(id, organizationId);

    if (!currentRole) {
      return errorResponse('NOT_FOUND', '角色不存在');
    }

    // 5. Prevent deleting system roles
    if (currentRole.isSystem) {
      return errorResponse('FORBIDDEN', '無法刪除系統角色');
    }

    // 6. Prevent deleting roles with members
    if (currentRole._count.members > 0) {
      return errorResponse(
        'CONFLICT',
        `無法刪除：此角色仍有 ${currentRole._count.members} 位成員使用中`
      );
    }

    // 7. Delete role (cascade deletes RolePermission)
    await prisma.role.delete({
      where: { id },
    });

    // 8. Log audit
    await logAdminAction({
      action: 'delete',
      entity: 'role',
      entityId: id,
      userId: session.user.id,
      organizationId,
      before: {
        name: currentRole.name,
        description: currentRole.description,
        permissions: currentRole.permissions.map((rp) => rp.permission.code),
      },
      request,
    });

    return successResponse({
      deleted: true,
      roleId: id,
      roleName: currentRole.name,
    });
  } catch (error) {
    console.error('Delete role error:', error);
    return errorResponse('INTERNAL_ERROR', '刪除角色失敗');
  }
}
