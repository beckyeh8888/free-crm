/**
 * Seed Fix Script: 為現有用戶補建組織
 *
 * 此腳本會為所有沒有組織的用戶建立個人組織。
 *
 * 執行方式:
 * npx ts-node prisma/seed-fix-users.ts
 *
 * 或使用 tsx:
 * npx tsx prisma/seed-fix-users.ts
 */

import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import path from 'node:path';
import { PERMISSION_DEFINITIONS } from '../src/lib/permissions';

function createPrismaClient() {
  let databaseUrl = process.env.DATABASE_URL ?? 'file:./dev.db';

  // For local file URLs with libsql adapter, resolve to absolute path
  if (databaseUrl.startsWith('file:./') || databaseUrl.startsWith('file:dev.db')) {
    const relativePath = databaseUrl.replace('file:./', '').replace('file:', '');
    const absolutePath = path.resolve(process.cwd(), relativePath);
    databaseUrl = `file:${absolutePath.replaceAll('\\', '/')}`;
  }

  console.log('[Prisma] Database URL:', databaseUrl);

  const adapter = new PrismaLibSql({ url: databaseUrl });
  return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();

async function main() {
  console.log('🔧 開始修復用戶組織資料...\n');

  // 0. 確保權限表已填充
  console.log('🔐 檢查權限表...');
  const existingPermissions = await prisma.permission.findMany();

  if (existingPermissions.length < PERMISSION_DEFINITIONS.length) {
    console.log(`📝 Seed ${PERMISSION_DEFINITIONS.length - existingPermissions.length} 個權限到資料庫...`);
    const existingCodes = new Set(existingPermissions.map(p => p.code));

    for (const permDef of PERMISSION_DEFINITIONS) {
      if (!existingCodes.has(permDef.code)) {
        await prisma.permission.create({
          data: {
            code: permDef.code,
            name: permDef.name,
            category: permDef.category,
            description: permDef.description,
          },
        });
      }
    }
    console.log(`✅ 權限表已更新，共 ${PERMISSION_DEFINITIONS.length} 個權限\n`);
  } else {
    console.log(`✅ 權限表已有 ${existingPermissions.length} 個權限\n`);
  }

  // 1. 查找或建立 Owner 角色
  let ownerRole = await prisma.role.findFirst({
    where: { name: 'Owner', isSystem: true },
  });

  if (!ownerRole) {
    console.log('📝 建立 Owner 系統角色...');
    ownerRole = await prisma.role.create({
      data: {
        name: 'Owner',
        description: '組織擁有者，擁有所有權限',
        isSystem: true,
      },
    });
    console.log('✅ Owner 角色已建立\n');
  } else {
    console.log('✅ Owner 角色已存在\n');
  }

  // 1.5 確保 Owner 角色擁有所有權限
  console.log('🔐 檢查 Owner 角色權限...');
  const allPermissions = await prisma.permission.findMany();
  const existingRolePermissions = await prisma.rolePermission.findMany({
    where: { roleId: ownerRole.id },
  });

  const existingPermissionIds = new Set(existingRolePermissions.map(rp => rp.permissionId));
  const missingPermissions = allPermissions.filter(p => !existingPermissionIds.has(p.id));

  if (missingPermissions.length > 0) {
    console.log(`📝 為 Owner 角色新增 ${missingPermissions.length} 個權限...`);
    for (const permission of missingPermissions) {
      await prisma.rolePermission.create({
        data: {
          roleId: ownerRole.id,
          permissionId: permission.id,
        },
      });
    }
    console.log(`✅ Owner 角色現在擁有 ${allPermissions.length} 個權限\n`);
  } else {
    console.log(`✅ Owner 角色已擁有所有 ${allPermissions.length} 個權限\n`);
  }

  // 2. 找出沒有組織的用戶
  const usersWithoutOrg = await prisma.user.findMany({
    where: {
      organizations: { none: {} },
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  console.log(`📊 找到 ${usersWithoutOrg.length} 個沒有組織的用戶\n`);

  if (usersWithoutOrg.length === 0) {
    console.log('✨ 所有用戶都已有組織，無需修復！');
    return;
  }

  // 3. 為每個用戶建立組織
  let successCount = 0;
  let errorCount = 0;

  for (const user of usersWithoutOrg) {
    try {
      const orgName = user.name || user.email.split('@')[0];

      await prisma.$transaction(async (tx) => {
        // 建立組織
        const organization = await tx.organization.create({
          data: {
            name: `${orgName} 的組織`,
            slug: `org-${user.id.slice(0, 8)}`,
            plan: 'free',
          },
        });

        // 建立組織成員關聯
        await tx.organizationMember.create({
          data: {
            userId: user.id,
            organizationId: organization.id,
            roleId: ownerRole!.id,
            status: 'active',
          },
        });

        // 記錄審計日誌
        await tx.auditLog.create({
          data: {
            action: 'create',
            entity: 'organization',
            entityId: organization.id,
            organizationId: organization.id,
            details: JSON.stringify({
              reason: 'seed-fix-users',
              userId: user.id,
              userEmail: user.email,
            }),
            ipAddress: 'seed-script',
            userAgent: 'prisma-seed-fix-users',
          },
        });
      });

      console.log(`✅ ${user.email} - 已建立組織「${orgName} 的組織」`);
      successCount++;
    } catch (error) {
      console.error(`❌ ${user.email} - 建立失敗:`, error);
      errorCount++;
    }
  }

  // 4. 輸出摘要
  console.log('\n' + '='.repeat(50));
  console.log('📊 修復摘要');
  console.log('='.repeat(50));
  console.log(`總用戶數: ${usersWithoutOrg.length}`);
  console.log(`成功: ${successCount}`);
  console.log(`失敗: ${errorCount}`);
  console.log('='.repeat(50));

  if (errorCount === 0) {
    console.log('\n✨ 所有用戶已成功修復！');
  } else {
    console.log('\n⚠️ 部分用戶修復失敗，請檢查錯誤訊息');
  }
}

main()
  .catch((e) => {
    console.error('腳本執行失敗:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
