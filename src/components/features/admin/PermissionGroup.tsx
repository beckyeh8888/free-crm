'use client';

/**
 * PermissionGroup - Permission checkbox group by category
 * WCAG 2.2 AAA Compliant
 */

import { Check, Minus } from 'lucide-react';
import { PERMISSION_CATEGORIES } from '@/lib/permissions';

// Flexible permission interface that works with both API and local types
interface PermissionItem {
  readonly code: string;
  readonly name: string;
  readonly description: string;
}

interface PermissionGroupProps {
  readonly category: string;
  readonly permissions: readonly PermissionItem[];
  readonly selectedPermissions: ReadonlySet<string>;
  readonly onToggle: (code: string) => void;
  readonly onToggleAll: (category: string, codes: readonly string[]) => void;
  readonly disabled?: boolean;
}

export function PermissionGroup({
  category,
  permissions,
  selectedPermissions,
  onToggle,
  onToggleAll,
  disabled = false,
}: PermissionGroupProps) {
  const categoryInfo = PERMISSION_CATEGORIES[category as keyof typeof PERMISSION_CATEGORIES];
  const categoryName = categoryInfo?.name || category;

  const allCodes = permissions.map((p) => p.code);
  const selectedCount = allCodes.filter((code) => selectedPermissions.has(code)).length;
  const isAllSelected = selectedCount === permissions.length;
  const isPartialSelected = selectedCount > 0 && selectedCount < permissions.length;

  const handleToggleAll = () => {
    onToggleAll(category, allCodes);
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Category Header */}
      <button
        type="button"
        onClick={handleToggleAll}
        disabled={disabled}
        className="w-full flex items-center gap-3 px-4 py-3 bg-background-secondary hover:bg-background-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={`${isAllSelected ? '取消全選' : '全選'} ${categoryName}`}
      >
        <div
          className={`
            w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
            ${isAllSelected || isPartialSelected
              ? 'bg-accent-600 border-accent-600'
              : 'border-border-strong bg-transparent'}
            ${disabled ? 'opacity-50' : ''}
          `}
        >
          {isAllSelected && <Check className="w-3 h-3 text-white" />}
          {isPartialSelected && <Minus className="w-3 h-3 text-white" />}
        </div>
        <span className="text-sm font-medium text-text-primary">{categoryName}</span>
        <span className="text-xs text-text-muted ml-auto">
          {selectedCount}/{permissions.length}
        </span>
      </button>

      {/* Permission Items */}
      <div className="divide-y divide-border-subtle">
        {permissions.map((permission) => {
          const isSelected = selectedPermissions.has(permission.code);
          return (
            <label
              key={permission.code}
              className={`
                flex items-center gap-3 px-4 py-2.5 cursor-pointer
                hover:bg-background-hover transition-colors
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggle(permission.code)}
                disabled={disabled}
                className="sr-only"
                aria-describedby={`perm-desc-${permission.code}`}
              />
              <div
                className={`
                  w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0
                  ${isSelected
                    ? 'bg-accent-600 border-accent-600'
                    : 'border-border-strong bg-transparent'}
                `}
              >
                {isSelected && <Check className="w-3 h-3 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary">{permission.name}</p>
                <p
                  id={`perm-desc-${permission.code}`}
                  className="text-xs text-text-muted truncate"
                >
                  {permission.description}
                </p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
