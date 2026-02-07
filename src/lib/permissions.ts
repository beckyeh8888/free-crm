/**
 * RBAC Permission Definitions
 *
 * This file defines all permissions and default roles for the CRM system.
 * Follows ISO 27001 A.9.2.2 (User Access Provisioning)
 */

// ============================================
// Permission Code Definitions
// ============================================

export const PERMISSIONS = {
  // Customer Permissions
  CUSTOMERS_READ: 'customers:read',
  CUSTOMERS_CREATE: 'customers:create',
  CUSTOMERS_UPDATE: 'customers:update',
  CUSTOMERS_DELETE: 'customers:delete',
  CUSTOMERS_ASSIGN: 'customers:assign',
  CUSTOMERS_EXPORT: 'customers:export',

  // Deal Permissions
  DEALS_READ: 'deals:read',
  DEALS_CREATE: 'deals:create',
  DEALS_UPDATE: 'deals:update',
  DEALS_DELETE: 'deals:delete',
  DEALS_ASSIGN: 'deals:assign',

  // Contact Permissions
  CONTACTS_READ: 'contacts:read',
  CONTACTS_CREATE: 'contacts:create',
  CONTACTS_UPDATE: 'contacts:update',
  CONTACTS_DELETE: 'contacts:delete',

  // Document Permissions
  DOCUMENTS_READ: 'documents:read',
  DOCUMENTS_CREATE: 'documents:create',
  DOCUMENTS_UPDATE: 'documents:update',
  DOCUMENTS_DELETE: 'documents:delete',
  DOCUMENTS_ANALYZE: 'documents:analyze',

  // Project Permissions
  PROJECTS_READ: 'projects:read',
  PROJECTS_WRITE: 'projects:write',

  // Task Permissions
  TASKS_READ: 'tasks:read',
  TASKS_WRITE: 'tasks:write',
  TASKS_ASSIGN: 'tasks:assign',
  TASKS_MANAGE: 'tasks:manage',

  // Report Permissions
  REPORTS_VIEW: 'reports:view',
  REPORTS_EXPORT: 'reports:export',
  REPORTS_ADVANCED: 'reports:advanced',

  // Admin Permissions
  ADMIN_USERS: 'admin:users',
  ADMIN_USERS_CREATE: 'admin:users:create',
  ADMIN_USERS_UPDATE: 'admin:users:update',
  ADMIN_USERS_DELETE: 'admin:users:delete',
  ADMIN_USERS_SUSPEND: 'admin:users:suspend',
  ADMIN_ROLES: 'admin:roles',
  ADMIN_ROLES_CREATE: 'admin:roles:create',
  ADMIN_ROLES_UPDATE: 'admin:roles:update',
  ADMIN_ROLES_DELETE: 'admin:roles:delete',
  ADMIN_AUDIT: 'admin:audit',
  ADMIN_AUDIT_EXPORT: 'admin:audit:export',
  ADMIN_SETTINGS: 'admin:settings',
  ADMIN_ORG: 'admin:organization',

  // AI Permissions
  AI_USE: 'ai:use',
  AI_CONFIGURE: 'ai:configure',
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ============================================
// Permission Metadata (for seeding and UI)
// ============================================

export interface PermissionDefinition {
  code: PermissionCode;
  name: string;
  category: string;
  description: string;
}

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  // Customer Permissions
  { code: PERMISSIONS.CUSTOMERS_READ, name: '讀取客戶', category: 'customers', description: '查看客戶列表和詳情' },
  { code: PERMISSIONS.CUSTOMERS_CREATE, name: '建立客戶', category: 'customers', description: '新增客戶資料' },
  { code: PERMISSIONS.CUSTOMERS_UPDATE, name: '更新客戶', category: 'customers', description: '編輯客戶資料' },
  { code: PERMISSIONS.CUSTOMERS_DELETE, name: '刪除客戶', category: 'customers', description: '刪除客戶及其關聯資料' },
  { code: PERMISSIONS.CUSTOMERS_ASSIGN, name: '分配客戶', category: 'customers', description: '將客戶分配給其他業務員' },
  { code: PERMISSIONS.CUSTOMERS_EXPORT, name: '匯出客戶', category: 'customers', description: '匯出客戶資料' },

  // Deal Permissions
  { code: PERMISSIONS.DEALS_READ, name: '讀取商機', category: 'deals', description: '查看商機列表和詳情' },
  { code: PERMISSIONS.DEALS_CREATE, name: '建立商機', category: 'deals', description: '新增商機' },
  { code: PERMISSIONS.DEALS_UPDATE, name: '更新商機', category: 'deals', description: '編輯商機資料和階段' },
  { code: PERMISSIONS.DEALS_DELETE, name: '刪除商機', category: 'deals', description: '刪除商機' },
  { code: PERMISSIONS.DEALS_ASSIGN, name: '分配商機', category: 'deals', description: '將商機分配給其他業務員' },

  // Contact Permissions
  { code: PERMISSIONS.CONTACTS_READ, name: '讀取聯絡人', category: 'contacts', description: '查看聯絡人列表和詳情' },
  { code: PERMISSIONS.CONTACTS_CREATE, name: '建立聯絡人', category: 'contacts', description: '新增聯絡人' },
  { code: PERMISSIONS.CONTACTS_UPDATE, name: '更新聯絡人', category: 'contacts', description: '編輯聯絡人資料' },
  { code: PERMISSIONS.CONTACTS_DELETE, name: '刪除聯絡人', category: 'contacts', description: '刪除聯絡人' },

  // Document Permissions
  { code: PERMISSIONS.DOCUMENTS_READ, name: '讀取文件', category: 'documents', description: '查看文件列表和內容' },
  { code: PERMISSIONS.DOCUMENTS_CREATE, name: '上傳文件', category: 'documents', description: '上傳新文件' },
  { code: PERMISSIONS.DOCUMENTS_UPDATE, name: '更新文件', category: 'documents', description: '編輯文件資訊' },
  { code: PERMISSIONS.DOCUMENTS_DELETE, name: '刪除文件', category: 'documents', description: '刪除文件' },
  { code: PERMISSIONS.DOCUMENTS_ANALYZE, name: 'AI 分析文件', category: 'documents', description: '使用 AI 分析文件內容' },

  // Project Permissions
  { code: PERMISSIONS.PROJECTS_READ, name: '檢視專案', category: 'projects', description: '查看專案列表和詳情' },
  { code: PERMISSIONS.PROJECTS_WRITE, name: '編輯專案', category: 'projects', description: '新增、編輯、刪除專案' },

  // Task Permissions
  { code: PERMISSIONS.TASKS_READ, name: '檢視任務', category: 'tasks', description: '查看任務列表和行事曆' },
  { code: PERMISSIONS.TASKS_WRITE, name: '編輯任務', category: 'tasks', description: '新增、編輯、刪除任務' },
  { code: PERMISSIONS.TASKS_ASSIGN, name: '指派任務', category: 'tasks', description: '將任務指派給其他成員' },
  { code: PERMISSIONS.TASKS_MANAGE, name: '管理所有任務', category: 'tasks', description: '管理組織內所有成員的任務' },

  // Report Permissions
  { code: PERMISSIONS.REPORTS_VIEW, name: '查看報表', category: 'reports', description: '查看基本統計報表' },
  { code: PERMISSIONS.REPORTS_EXPORT, name: '匯出報表', category: 'reports', description: '匯出報表資料' },
  { code: PERMISSIONS.REPORTS_ADVANCED, name: '進階報表', category: 'reports', description: '查看進階分析報表' },

  // Admin Permissions
  { code: PERMISSIONS.ADMIN_USERS, name: '用戶管理', category: 'admin', description: '存取用戶管理功能' },
  { code: PERMISSIONS.ADMIN_USERS_CREATE, name: '建立用戶', category: 'admin', description: '邀請新用戶加入' },
  { code: PERMISSIONS.ADMIN_USERS_UPDATE, name: '更新用戶', category: 'admin', description: '編輯用戶資料和角色' },
  { code: PERMISSIONS.ADMIN_USERS_DELETE, name: '刪除用戶', category: 'admin', description: '從組織移除用戶' },
  { code: PERMISSIONS.ADMIN_USERS_SUSPEND, name: '停用用戶', category: 'admin', description: '暫停用戶帳號' },
  { code: PERMISSIONS.ADMIN_ROLES, name: '角色管理', category: 'admin', description: '存取角色管理功能' },
  { code: PERMISSIONS.ADMIN_ROLES_CREATE, name: '建立角色', category: 'admin', description: '建立自定義角色' },
  { code: PERMISSIONS.ADMIN_ROLES_UPDATE, name: '更新角色', category: 'admin', description: '編輯角色權限' },
  { code: PERMISSIONS.ADMIN_ROLES_DELETE, name: '刪除角色', category: 'admin', description: '刪除自定義角色' },
  { code: PERMISSIONS.ADMIN_AUDIT, name: '稽核日誌', category: 'admin', description: '查看稽核日誌' },
  { code: PERMISSIONS.ADMIN_AUDIT_EXPORT, name: '匯出稽核日誌', category: 'admin', description: '匯出稽核日誌報告' },
  { code: PERMISSIONS.ADMIN_SETTINGS, name: '系統設定', category: 'admin', description: '管理系統設定' },
  { code: PERMISSIONS.ADMIN_ORG, name: '組織管理', category: 'admin', description: '管理組織資訊' },

  // AI Permissions
  { code: PERMISSIONS.AI_USE, name: 'AI 功能使用', category: 'ai', description: '使用 AI 助手、Email 草稿、銷售洞察' },
  { code: PERMISSIONS.AI_CONFIGURE, name: 'AI 設定管理', category: 'ai', description: '管理 AI 供應商設定和 API 金鑰' },
];

// ============================================
// Permission Categories (for UI grouping)
// ============================================

export const PERMISSION_CATEGORIES = {
  customers: { name: '客戶管理', order: 1 },
  deals: { name: '商機管理', order: 2 },
  contacts: { name: '聯絡人管理', order: 3 },
  projects: { name: '專案管理', order: 4 },
  tasks: { name: '任務管理', order: 5 },
  documents: { name: '文件管理', order: 6 },
  reports: { name: '報表分析', order: 7 },
  admin: { name: '系統管理', order: 8 },
  ai: { name: 'AI 功能', order: 9 },
} as const;

// ============================================
// Default Role Definitions
// ============================================

export interface DefaultRoleDefinition {
  name: string;
  description: string;
  isSystem: boolean;
  isDefault: boolean;
  permissions: PermissionCode[];
}

export const DEFAULT_ROLES: Record<string, DefaultRoleDefinition> = {
  SUPER_ADMIN: {
    name: 'Super Admin',
    description: '系統超級管理員，擁有所有權限',
    isSystem: true,
    isDefault: false,
    permissions: Object.values(PERMISSIONS),
  },
  ADMIN: {
    name: 'Admin',
    description: '組織管理員，可管理用戶和設定',
    isSystem: true,
    isDefault: false,
    permissions: [
      // All CRM permissions
      PERMISSIONS.CUSTOMERS_READ,
      PERMISSIONS.CUSTOMERS_CREATE,
      PERMISSIONS.CUSTOMERS_UPDATE,
      PERMISSIONS.CUSTOMERS_DELETE,
      PERMISSIONS.CUSTOMERS_ASSIGN,
      PERMISSIONS.CUSTOMERS_EXPORT,
      PERMISSIONS.DEALS_READ,
      PERMISSIONS.DEALS_CREATE,
      PERMISSIONS.DEALS_UPDATE,
      PERMISSIONS.DEALS_DELETE,
      PERMISSIONS.DEALS_ASSIGN,
      PERMISSIONS.CONTACTS_READ,
      PERMISSIONS.CONTACTS_CREATE,
      PERMISSIONS.CONTACTS_UPDATE,
      PERMISSIONS.CONTACTS_DELETE,
      PERMISSIONS.PROJECTS_READ,
      PERMISSIONS.PROJECTS_WRITE,
      PERMISSIONS.TASKS_READ,
      PERMISSIONS.TASKS_WRITE,
      PERMISSIONS.TASKS_ASSIGN,
      PERMISSIONS.TASKS_MANAGE,
      PERMISSIONS.DOCUMENTS_READ,
      PERMISSIONS.DOCUMENTS_CREATE,
      PERMISSIONS.DOCUMENTS_UPDATE,
      PERMISSIONS.DOCUMENTS_DELETE,
      PERMISSIONS.DOCUMENTS_ANALYZE,
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.REPORTS_EXPORT,
      PERMISSIONS.REPORTS_ADVANCED,
      // Admin permissions (except super admin)
      PERMISSIONS.ADMIN_USERS,
      PERMISSIONS.ADMIN_USERS_CREATE,
      PERMISSIONS.ADMIN_USERS_UPDATE,
      PERMISSIONS.ADMIN_USERS_SUSPEND,
      PERMISSIONS.ADMIN_ROLES,
      PERMISSIONS.ADMIN_ROLES_CREATE,
      PERMISSIONS.ADMIN_ROLES_UPDATE,
      PERMISSIONS.ADMIN_AUDIT,
      PERMISSIONS.ADMIN_SETTINGS,
      PERMISSIONS.ADMIN_ORG,
      // AI permissions
      PERMISSIONS.AI_USE,
      PERMISSIONS.AI_CONFIGURE,
    ],
  },
  MANAGER: {
    name: 'Manager',
    description: '團隊經理，可管理團隊成員的客戶和商機',
    isSystem: true,
    isDefault: false,
    permissions: [
      PERMISSIONS.CUSTOMERS_READ,
      PERMISSIONS.CUSTOMERS_CREATE,
      PERMISSIONS.CUSTOMERS_UPDATE,
      PERMISSIONS.CUSTOMERS_DELETE,
      PERMISSIONS.CUSTOMERS_ASSIGN,
      PERMISSIONS.CUSTOMERS_EXPORT,
      PERMISSIONS.DEALS_READ,
      PERMISSIONS.DEALS_CREATE,
      PERMISSIONS.DEALS_UPDATE,
      PERMISSIONS.DEALS_DELETE,
      PERMISSIONS.DEALS_ASSIGN,
      PERMISSIONS.CONTACTS_READ,
      PERMISSIONS.CONTACTS_CREATE,
      PERMISSIONS.CONTACTS_UPDATE,
      PERMISSIONS.CONTACTS_DELETE,
      PERMISSIONS.PROJECTS_READ,
      PERMISSIONS.PROJECTS_WRITE,
      PERMISSIONS.TASKS_READ,
      PERMISSIONS.TASKS_WRITE,
      PERMISSIONS.TASKS_ASSIGN,
      PERMISSIONS.DOCUMENTS_READ,
      PERMISSIONS.DOCUMENTS_CREATE,
      PERMISSIONS.DOCUMENTS_UPDATE,
      PERMISSIONS.DOCUMENTS_DELETE,
      PERMISSIONS.DOCUMENTS_ANALYZE,
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.REPORTS_EXPORT,
      PERMISSIONS.REPORTS_ADVANCED,
      // AI permissions
      PERMISSIONS.AI_USE,
    ],
  },
  SALES: {
    name: 'Sales',
    description: '業務員，可管理自己的客戶和商機',
    isSystem: true,
    isDefault: true, // Default role for new members
    permissions: [
      PERMISSIONS.CUSTOMERS_READ,
      PERMISSIONS.CUSTOMERS_CREATE,
      PERMISSIONS.CUSTOMERS_UPDATE,
      PERMISSIONS.DEALS_READ,
      PERMISSIONS.DEALS_CREATE,
      PERMISSIONS.DEALS_UPDATE,
      PERMISSIONS.CONTACTS_READ,
      PERMISSIONS.CONTACTS_CREATE,
      PERMISSIONS.CONTACTS_UPDATE,
      PERMISSIONS.CONTACTS_DELETE,
      PERMISSIONS.PROJECTS_READ,
      PERMISSIONS.TASKS_READ,
      PERMISSIONS.TASKS_WRITE,
      PERMISSIONS.DOCUMENTS_READ,
      PERMISSIONS.DOCUMENTS_CREATE,
      PERMISSIONS.DOCUMENTS_UPDATE,
      PERMISSIONS.DOCUMENTS_ANALYZE,
      PERMISSIONS.REPORTS_VIEW,
      // AI permissions
      PERMISSIONS.AI_USE,
    ],
  },
  VIEWER: {
    name: 'Viewer',
    description: '檢視者，只能查看資料',
    isSystem: true,
    isDefault: false,
    permissions: [
      PERMISSIONS.CUSTOMERS_READ,
      PERMISSIONS.DEALS_READ,
      PERMISSIONS.CONTACTS_READ,
      PERMISSIONS.PROJECTS_READ,
      PERMISSIONS.TASKS_READ,
      PERMISSIONS.DOCUMENTS_READ,
      PERMISSIONS.REPORTS_VIEW,
    ],
  },
};

// ============================================
// Utility Functions
// ============================================

/**
 * Check if a permission code is valid
 */
export function isValidPermission(code: string): code is PermissionCode {
  return Object.values(PERMISSIONS).includes(code as PermissionCode);
}

/**
 * Get permission definition by code
 */
export function getPermissionDefinition(code: PermissionCode): PermissionDefinition | undefined {
  return PERMISSION_DEFINITIONS.find((p) => p.code === code);
}

/**
 * Get permissions by category
 */
export function getPermissionsByCategory(category: string): PermissionDefinition[] {
  return PERMISSION_DEFINITIONS.filter((p) => p.category === category);
}

/**
 * Check if a permission is an admin permission
 */
export function isAdminPermission(code: PermissionCode): boolean {
  return code.startsWith('admin:');
}

/**
 * Get the default role for new organization members
 */
export function getDefaultRole(): DefaultRoleDefinition {
  const defaultRole = Object.values(DEFAULT_ROLES).find((role) => role.isDefault);
  return defaultRole || DEFAULT_ROLES.SALES;
}
