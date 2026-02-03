/**
 * Command Palette Commands Definition
 *
 * Defines all available quick actions in the command palette.
 */

import {
  Users,
  DollarSign,
  FileText,
  LayoutDashboard,
  Settings,
  Plus,
  type LucideIcon,
} from 'lucide-react';

type CommandCategory = 'navigation' | 'create' | 'action';

interface Command {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly category: CommandCategory;
  readonly icon: LucideIcon;
  readonly shortcut?: string;
  readonly action: {
    readonly type: 'navigate' | 'action';
    readonly path?: string;
    readonly handler?: () => void;
  };
}

/**
 * All available commands in the command palette
 */
export const commands: ReadonlyArray<Command> = [
  // Navigation commands
  {
    id: 'goto-dashboard',
    label: '前往儀表板',
    description: '返回主控台',
    category: 'navigation',
    icon: LayoutDashboard,
    shortcut: 'G D',
    action: { type: 'navigate', path: '/dashboard' },
  },
  {
    id: 'goto-customers',
    label: '前往客戶',
    description: '查看客戶列表',
    category: 'navigation',
    icon: Users,
    shortcut: 'G C',
    action: { type: 'navigate', path: '/customers' },
  },
  {
    id: 'goto-deals',
    label: '前往商機',
    description: '查看商機 Pipeline',
    category: 'navigation',
    icon: DollarSign,
    shortcut: 'G D',
    action: { type: 'navigate', path: '/deals' },
  },
  {
    id: 'goto-documents',
    label: '前往文件',
    description: '查看文件列表',
    category: 'navigation',
    icon: FileText,
    shortcut: 'G F',
    action: { type: 'navigate', path: '/documents' },
  },
  {
    id: 'goto-settings',
    label: '前往設定',
    description: '系統設定',
    category: 'navigation',
    icon: Settings,
    shortcut: 'G S',
    action: { type: 'navigate', path: '/settings' },
  },

  // Create commands
  {
    id: 'create-customer',
    label: '新增客戶',
    description: '建立新客戶',
    category: 'create',
    icon: Plus,
    shortcut: 'N C',
    action: { type: 'navigate', path: '/customers?action=new' },
  },
  {
    id: 'create-deal',
    label: '新增商機',
    description: '建立新商機',
    category: 'create',
    icon: Plus,
    shortcut: 'N D',
    action: { type: 'navigate', path: '/deals?action=new' },
  },
  {
    id: 'create-document',
    label: '新增文件',
    description: '上傳或建立文件',
    category: 'create',
    icon: Plus,
    shortcut: 'N F',
    action: { type: 'navigate', path: '/documents?action=new' },
  },
];

/**
 * Get commands by category
 */
export function getCommandsByCategory(category: CommandCategory): ReadonlyArray<Command> {
  return commands.filter((cmd) => cmd.category === category);
}

/**
 * Filter commands by search query
 */
export function filterCommands(query: string): ReadonlyArray<Command> {
  const lowerQuery = query.toLowerCase();
  return commands.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(lowerQuery) ||
      cmd.description?.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get category display name
 */
export function getCategoryLabel(category: CommandCategory): string {
  switch (category) {
    case 'navigation':
      return '導航';
    case 'create':
      return '建立';
    case 'action':
      return '動作';
    default:
      return category;
  }
}

export type { Command, CommandCategory };
