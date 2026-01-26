/**
 * NextAuth.js Type Extensions
 * Extends default types to include custom user properties
 *
 * Multi-tenant: Includes organization context in session
 */

import 'next-auth';
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      status: string;
      defaultOrganizationId?: string;
      defaultOrganizationName?: string;
      defaultRole?: string;
    } & DefaultSession['user'];
  }

  interface User {
    status?: string;
    defaultOrganizationId?: string;
    defaultOrganizationName?: string;
    defaultRole?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    status?: string;
    defaultOrganizationId?: string;
    defaultOrganizationName?: string;
    defaultRole?: string;
  }
}
