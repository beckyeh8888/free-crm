/**
 * User Registration API
 * POST /api/auth/register
 *
 * Security: Zod validation + bcrypt hashing
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

// Zod v4: Use z.email() instead of z.string().email()
const registerSchema = z.object({
  name: z
    .string()
    .min(1, '請輸入姓名')
    .max(100, '姓名不得超過 100 字元'),
  email: z.email('請輸入有效的電子郵件'),
  password: z
    .string()
    .min(8, '密碼至少需要 8 個字元')
    .regex(/[A-Z]/, '密碼需包含大寫字母')
    .regex(/[a-z]/, '密碼需包含小寫字母')
    .regex(/\d/, '密碼需包含數字')
    .regex(/[^A-Za-z0-9]/, '密碼需包含特殊字元'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = result.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: '此電子郵件已被註冊' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with organization in a transaction
    const user = await prisma.$transaction(async (tx) => {
      // 1. Create user
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      });

      // 2. Find or create Owner role
      let ownerRole = await tx.role.findFirst({
        where: { name: 'Owner', isSystem: true },
      });

      if (!ownerRole) {
        ownerRole = await tx.role.create({
          data: {
            name: 'Owner',
            description: '組織擁有者，擁有所有權限',
            isSystem: true,
          },
        });
      }

      // 3. Create personal organization
      const orgName = name || email.split('@')[0];
      const organization = await tx.organization.create({
        data: {
          name: `${orgName} 的組織`,
          slug: `org-${newUser.id.slice(0, 8)}`,
          plan: 'free',
        },
      });

      // 4. Create organization membership with Owner role
      await tx.organizationMember.create({
        data: {
          userId: newUser.id,
          organizationId: organization.id,
          roleId: ownerRole.id,
          status: 'active',
        },
      });

      // 5. Log audit event
      await tx.auditLog.create({
        data: {
          action: 'create',
          entity: 'user',
          entityId: newUser.id,
          organizationId: organization.id,
          details: JSON.stringify({
            email: newUser.email,
            organizationName: organization.name,
          }),
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      });

      return newUser;
    });

    return NextResponse.json(
      { message: '註冊成功', user },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: '註冊失敗，請稍後再試' },
      { status: 500 }
    );
  }
}
