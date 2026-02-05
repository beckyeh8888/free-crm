/**
 * Permissions Module Unit Tests
 * Tests for RBAC permission definitions and utility functions
 */


import {
  PERMISSIONS,
  PERMISSION_DEFINITIONS,
  PERMISSION_CATEGORIES,
  DEFAULT_ROLES,
  isValidPermission,
  getPermissionDefinition,
  getPermissionsByCategory,
  isAdminPermission,
  getDefaultRole,
} from '@/lib/permissions';

describe('PERMISSIONS', () => {
  describe('Structure', () => {
    it('has all customer permissions', () => {
      expect(PERMISSIONS.CUSTOMERS_READ).toBe('customers:read');
      expect(PERMISSIONS.CUSTOMERS_CREATE).toBe('customers:create');
      expect(PERMISSIONS.CUSTOMERS_UPDATE).toBe('customers:update');
      expect(PERMISSIONS.CUSTOMERS_DELETE).toBe('customers:delete');
      expect(PERMISSIONS.CUSTOMERS_ASSIGN).toBe('customers:assign');
      expect(PERMISSIONS.CUSTOMERS_EXPORT).toBe('customers:export');
    });

    it('has all deal permissions', () => {
      expect(PERMISSIONS.DEALS_READ).toBe('deals:read');
      expect(PERMISSIONS.DEALS_CREATE).toBe('deals:create');
      expect(PERMISSIONS.DEALS_UPDATE).toBe('deals:update');
      expect(PERMISSIONS.DEALS_DELETE).toBe('deals:delete');
      expect(PERMISSIONS.DEALS_ASSIGN).toBe('deals:assign');
    });

    it('has all contact permissions', () => {
      expect(PERMISSIONS.CONTACTS_READ).toBe('contacts:read');
      expect(PERMISSIONS.CONTACTS_CREATE).toBe('contacts:create');
      expect(PERMISSIONS.CONTACTS_UPDATE).toBe('contacts:update');
      expect(PERMISSIONS.CONTACTS_DELETE).toBe('contacts:delete');
    });

    it('has all document permissions', () => {
      expect(PERMISSIONS.DOCUMENTS_READ).toBe('documents:read');
      expect(PERMISSIONS.DOCUMENTS_CREATE).toBe('documents:create');
      expect(PERMISSIONS.DOCUMENTS_UPDATE).toBe('documents:update');
      expect(PERMISSIONS.DOCUMENTS_DELETE).toBe('documents:delete');
      expect(PERMISSIONS.DOCUMENTS_ANALYZE).toBe('documents:analyze');
    });

    it('has all report permissions', () => {
      expect(PERMISSIONS.REPORTS_VIEW).toBe('reports:view');
      expect(PERMISSIONS.REPORTS_EXPORT).toBe('reports:export');
      expect(PERMISSIONS.REPORTS_ADVANCED).toBe('reports:advanced');
    });

    it('has all admin permissions', () => {
      expect(PERMISSIONS.ADMIN_USERS).toBe('admin:users');
      expect(PERMISSIONS.ADMIN_USERS_CREATE).toBe('admin:users:create');
      expect(PERMISSIONS.ADMIN_USERS_UPDATE).toBe('admin:users:update');
      expect(PERMISSIONS.ADMIN_USERS_DELETE).toBe('admin:users:delete');
      expect(PERMISSIONS.ADMIN_USERS_SUSPEND).toBe('admin:users:suspend');
      expect(PERMISSIONS.ADMIN_ROLES).toBe('admin:roles');
      expect(PERMISSIONS.ADMIN_ROLES_CREATE).toBe('admin:roles:create');
      expect(PERMISSIONS.ADMIN_ROLES_UPDATE).toBe('admin:roles:update');
      expect(PERMISSIONS.ADMIN_ROLES_DELETE).toBe('admin:roles:delete');
      expect(PERMISSIONS.ADMIN_AUDIT).toBe('admin:audit');
      expect(PERMISSIONS.ADMIN_AUDIT_EXPORT).toBe('admin:audit:export');
      expect(PERMISSIONS.ADMIN_SETTINGS).toBe('admin:settings');
      expect(PERMISSIONS.ADMIN_ORG).toBe('admin:organization');
    });
  });

  describe('Permission Format', () => {
    it('all permissions follow category:action format', () => {
      const permissions = Object.values(PERMISSIONS);
      permissions.forEach((permission) => {
        expect(permission).toMatch(/^[a-z]+:[a-z:]+$/);
      });
    });

    it('has no duplicate permission codes', () => {
      const permissions = Object.values(PERMISSIONS);
      const uniquePermissions = new Set(permissions);
      expect(permissions.length).toBe(uniquePermissions.size);
    });
  });
});

describe('PERMISSION_DEFINITIONS', () => {
  it('has definition for every permission', () => {
    const permissionCodes = Object.values(PERMISSIONS);
    const definedCodes = PERMISSION_DEFINITIONS.map((d) => d.code);

    permissionCodes.forEach((code) => {
      expect(definedCodes).toContain(code);
    });
  });

  it('each definition has required fields', () => {
    PERMISSION_DEFINITIONS.forEach((def) => {
      expect(def.code).toBeDefined();
      expect(def.name).toBeDefined();
      expect(def.category).toBeDefined();
      expect(def.description).toBeDefined();
      expect(typeof def.name).toBe('string');
      expect(typeof def.category).toBe('string');
      expect(typeof def.description).toBe('string');
    });
  });

  it('all categories are valid', () => {
    const validCategories = Object.keys(PERMISSION_CATEGORIES);
    PERMISSION_DEFINITIONS.forEach((def) => {
      expect(validCategories).toContain(def.category);
    });
  });
});

describe('PERMISSION_CATEGORIES', () => {
  it('has all expected categories', () => {
    expect(PERMISSION_CATEGORIES.customers).toBeDefined();
    expect(PERMISSION_CATEGORIES.deals).toBeDefined();
    expect(PERMISSION_CATEGORIES.contacts).toBeDefined();
    expect(PERMISSION_CATEGORIES.documents).toBeDefined();
    expect(PERMISSION_CATEGORIES.reports).toBeDefined();
    expect(PERMISSION_CATEGORIES.admin).toBeDefined();
  });

  it('each category has name and order', () => {
    Object.values(PERMISSION_CATEGORIES).forEach((category) => {
      expect(category.name).toBeDefined();
      expect(category.order).toBeDefined();
      expect(typeof category.name).toBe('string');
      expect(typeof category.order).toBe('number');
    });
  });

  it('categories have unique order values', () => {
    const orders = Object.values(PERMISSION_CATEGORIES).map((c) => c.order);
    const uniqueOrders = new Set(orders);
    expect(orders.length).toBe(uniqueOrders.size);
  });
});

describe('DEFAULT_ROLES', () => {
  describe('Role Structure', () => {
    it('has all expected roles', () => {
      expect(DEFAULT_ROLES.SUPER_ADMIN).toBeDefined();
      expect(DEFAULT_ROLES.ADMIN).toBeDefined();
      expect(DEFAULT_ROLES.MANAGER).toBeDefined();
      expect(DEFAULT_ROLES.SALES).toBeDefined();
      expect(DEFAULT_ROLES.VIEWER).toBeDefined();
    });

    it('each role has required fields', () => {
      Object.values(DEFAULT_ROLES).forEach((role) => {
        expect(role.name).toBeDefined();
        expect(role.description).toBeDefined();
        expect(typeof role.isSystem).toBe('boolean');
        expect(typeof role.isDefault).toBe('boolean');
        expect(Array.isArray(role.permissions)).toBe(true);
      });
    });

    it('all roles have valid permissions', () => {
      const validPermissions = Object.values(PERMISSIONS);
      Object.values(DEFAULT_ROLES).forEach((role) => {
        role.permissions.forEach((permission) => {
          expect(validPermissions).toContain(permission);
        });
      });
    });
  });

  describe('SUPER_ADMIN Role', () => {
    it('has all permissions', () => {
      const allPermissions = Object.values(PERMISSIONS);
      expect(DEFAULT_ROLES.SUPER_ADMIN.permissions).toEqual(allPermissions);
    });

    it('is a system role', () => {
      expect(DEFAULT_ROLES.SUPER_ADMIN.isSystem).toBe(true);
    });

    it('is not the default role', () => {
      expect(DEFAULT_ROLES.SUPER_ADMIN.isDefault).toBe(false);
    });
  });

  describe('ADMIN Role', () => {
    it('has admin permissions except delete user and delete role', () => {
      expect(DEFAULT_ROLES.ADMIN.permissions).toContain(PERMISSIONS.ADMIN_USERS);
      expect(DEFAULT_ROLES.ADMIN.permissions).toContain(PERMISSIONS.ADMIN_ROLES);
      expect(DEFAULT_ROLES.ADMIN.permissions).not.toContain(PERMISSIONS.ADMIN_USERS_DELETE);
      expect(DEFAULT_ROLES.ADMIN.permissions).not.toContain(PERMISSIONS.ADMIN_ROLES_DELETE);
    });

    it('is a system role', () => {
      expect(DEFAULT_ROLES.ADMIN.isSystem).toBe(true);
    });
  });

  describe('MANAGER Role', () => {
    it('has no admin permissions', () => {
      DEFAULT_ROLES.MANAGER.permissions.forEach((permission) => {
        expect(permission.startsWith('admin:')).toBe(false);
      });
    });

    it('has all CRM permissions', () => {
      expect(DEFAULT_ROLES.MANAGER.permissions).toContain(PERMISSIONS.CUSTOMERS_READ);
      expect(DEFAULT_ROLES.MANAGER.permissions).toContain(PERMISSIONS.DEALS_READ);
      expect(DEFAULT_ROLES.MANAGER.permissions).toContain(PERMISSIONS.CONTACTS_READ);
      expect(DEFAULT_ROLES.MANAGER.permissions).toContain(PERMISSIONS.DOCUMENTS_READ);
      expect(DEFAULT_ROLES.MANAGER.permissions).toContain(PERMISSIONS.REPORTS_VIEW);
    });

    it('is a system role', () => {
      expect(DEFAULT_ROLES.MANAGER.isSystem).toBe(true);
    });
  });

  describe('SALES Role', () => {
    it('is the default role', () => {
      expect(DEFAULT_ROLES.SALES.isDefault).toBe(true);
    });

    it('cannot delete customers', () => {
      expect(DEFAULT_ROLES.SALES.permissions).not.toContain(PERMISSIONS.CUSTOMERS_DELETE);
    });

    it('cannot delete deals', () => {
      expect(DEFAULT_ROLES.SALES.permissions).not.toContain(PERMISSIONS.DEALS_DELETE);
    });

    it('has basic CRUD permissions', () => {
      expect(DEFAULT_ROLES.SALES.permissions).toContain(PERMISSIONS.CUSTOMERS_READ);
      expect(DEFAULT_ROLES.SALES.permissions).toContain(PERMISSIONS.CUSTOMERS_CREATE);
      expect(DEFAULT_ROLES.SALES.permissions).toContain(PERMISSIONS.CUSTOMERS_UPDATE);
    });
  });

  describe('VIEWER Role', () => {
    it('has only read permissions', () => {
      DEFAULT_ROLES.VIEWER.permissions.forEach((permission) => {
        expect(permission).toMatch(/:read$|:view$/);
      });
    });

    it('cannot create, update, or delete', () => {
      DEFAULT_ROLES.VIEWER.permissions.forEach((permission) => {
        expect(permission).not.toMatch(/:create$|:update$|:delete$/);
      });
    });
  });

  describe('Only One Default Role', () => {
    it('has exactly one default role', () => {
      const defaultRoles = Object.values(DEFAULT_ROLES).filter((role) => role.isDefault);
      expect(defaultRoles.length).toBe(1);
    });
  });
});

describe('isValidPermission', () => {
  it('returns true for valid permission codes', () => {
    expect(isValidPermission('customers:read')).toBe(true);
    expect(isValidPermission('deals:create')).toBe(true);
    expect(isValidPermission('admin:users')).toBe(true);
  });

  it('returns false for invalid permission codes', () => {
    expect(isValidPermission('invalid:permission')).toBe(false);
    expect(isValidPermission('customers:invalid')).toBe(false);
    expect(isValidPermission('')).toBe(false);
    expect(isValidPermission('random-string')).toBe(false);
  });
});

describe('getPermissionDefinition', () => {
  it('returns definition for valid permission', () => {
    const definition = getPermissionDefinition(PERMISSIONS.CUSTOMERS_READ);
    expect(definition).toBeDefined();
    expect(definition?.code).toBe('customers:read');
    expect(definition?.name).toBe('讀取客戶');
    expect(definition?.category).toBe('customers');
  });

  it('returns undefined for invalid permission', () => {
    // @ts-expect-error Testing invalid input
    const definition = getPermissionDefinition('invalid:permission');
    expect(definition).toBeUndefined();
  });
});

describe('getPermissionsByCategory', () => {
  it('returns permissions for customers category', () => {
    const permissions = getPermissionsByCategory('customers');
    expect(permissions.length).toBeGreaterThan(0);
    permissions.forEach((p) => {
      expect(p.category).toBe('customers');
    });
  });

  it('returns permissions for admin category', () => {
    const permissions = getPermissionsByCategory('admin');
    expect(permissions.length).toBeGreaterThan(0);
    permissions.forEach((p) => {
      expect(p.category).toBe('admin');
    });
  });

  it('returns empty array for invalid category', () => {
    const permissions = getPermissionsByCategory('invalid');
    expect(permissions).toEqual([]);
  });
});

describe('isAdminPermission', () => {
  it('returns true for admin permissions', () => {
    expect(isAdminPermission(PERMISSIONS.ADMIN_USERS)).toBe(true);
    expect(isAdminPermission(PERMISSIONS.ADMIN_ROLES)).toBe(true);
    expect(isAdminPermission(PERMISSIONS.ADMIN_AUDIT)).toBe(true);
    expect(isAdminPermission(PERMISSIONS.ADMIN_SETTINGS)).toBe(true);
  });

  it('returns false for non-admin permissions', () => {
    expect(isAdminPermission(PERMISSIONS.CUSTOMERS_READ)).toBe(false);
    expect(isAdminPermission(PERMISSIONS.DEALS_CREATE)).toBe(false);
    expect(isAdminPermission(PERMISSIONS.REPORTS_VIEW)).toBe(false);
  });
});

describe('getDefaultRole', () => {
  it('returns the SALES role', () => {
    const defaultRole = getDefaultRole();
    expect(defaultRole.name).toBe('Sales');
    expect(defaultRole.isDefault).toBe(true);
  });

  it('returns a role with basic permissions', () => {
    const defaultRole = getDefaultRole();
    expect(defaultRole.permissions).toContain(PERMISSIONS.CUSTOMERS_READ);
    expect(defaultRole.permissions).toContain(PERMISSIONS.CUSTOMERS_CREATE);
    expect(defaultRole.permissions).toContain(PERMISSIONS.DEALS_READ);
  });
});
