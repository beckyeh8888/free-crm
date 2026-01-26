/**
 * NextAuth Configuration
 * ISO 27001 Compliant Authentication
 *
 * Note: Roles are now handled via OrganizationMember, not on User model
 */

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions['adapter'],
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('請輸入電子郵件和密碼');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            organizations: {
              where: { status: 'active' },
              include: {
                organization: true,
                role: true,
              },
              take: 1, // Get first/default organization
            },
          },
        });

        if (!user || !user.password) {
          throw new Error('電子郵件或密碼錯誤');
        }

        // Check if user is suspended
        if (user.status === 'suspended') {
          throw new Error('帳號已被停用，請聯繫管理員');
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValid) {
          throw new Error('電子郵件或密碼錯誤');
        }

        // Update last login time
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        // Get default organization if exists
        const defaultOrg = user.organizations[0];

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          status: user.status,
          // Include default organization context
          defaultOrganizationId: defaultOrg?.organization.id,
          defaultOrganizationName: defaultOrg?.organization.name,
          defaultRole: defaultOrg?.role.name,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.status = (user as { status?: string }).status;
        token.defaultOrganizationId = (user as { defaultOrganizationId?: string }).defaultOrganizationId;
        token.defaultOrganizationName = (user as { defaultOrganizationName?: string }).defaultOrganizationName;
        token.defaultRole = (user as { defaultRole?: string }).defaultRole;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.status = (token.status as string) || 'active';
        session.user.defaultOrganizationId = token.defaultOrganizationId as string | undefined;
        session.user.defaultOrganizationName = token.defaultOrganizationName as string | undefined;
        session.user.defaultRole = token.defaultRole as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
