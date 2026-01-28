/**
 * FilterBar Component - WCAG 2.2 AAA Compliant
 *
 * A flexible filter bar with search input and filter dropdowns.
 */

import { ReactNode, useCallback, useId } from 'react';
import { TextInput } from '../TextInput';
import { Select, SelectOption } from '../Select';
import { Button } from '../Button';

export interface FilterField {
  /** Field key */
  readonly key: string;
  /** Field label */
  readonly label: string;
  /** Field type */
  readonly type: 'search' | 'select';
  /** Placeholder text */
  readonly placeholder?: string;
  /** Options for select type */
  readonly options?: SelectOption[];
  /** Field width (CSS value) */
  readonly width?: string;
}

export interface FilterValues {
  [key: string]: string;
}

export interface FilterBarProps {
  /** Filter field definitions */
  readonly fields: readonly FilterField[];
  /** Current filter values */
  readonly values: FilterValues;
  /** Callback when values change */
  readonly onChange: (values: FilterValues) => void;
  /** Callback when search/filter is submitted */
  readonly onSubmit?: () => void;
  /** Callback to clear all filters */
  readonly onClear?: () => void;
  /** Show clear button */
  readonly showClear?: boolean;
  /** Show submit button */
  readonly showSubmit?: boolean;
  /** Submit button text */
  readonly submitText?: string;
  /** Clear button text */
  readonly clearText?: string;
  /** Loading state */
  readonly loading?: boolean;
  /** Disabled state */
  readonly disabled?: boolean;
  /** Additional actions to render */
  readonly actions?: ReactNode;
  /** Layout direction */
  readonly layout?: 'horizontal' | 'vertical';
  /** Compact mode */
  readonly compact?: boolean;
}

export function FilterBar({
  fields,
  values,
  onChange,
  onSubmit,
  onClear,
  showClear = true,
  showSubmit = false,
  submitText = '搜尋',
  clearText = '清除',
  loading = false,
  disabled = false,
  actions,
  layout = 'horizontal',
  compact = false,
}: FilterBarProps) {
  const id = useId();

  const handleFieldChange = useCallback(
    (key: string, value: string) => {
      onChange({ ...values, [key]: value });
    },
    [values, onChange]
  );

  const handleClear = useCallback(() => {
    const clearedValues: FilterValues = {};
    fields.forEach((field) => {
      clearedValues[field.key] = '';
    });
    onChange(clearedValues);
    onClear?.();
  }, [fields, onChange, onClear]);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = useCallback(
    (e) => {
      e.preventDefault();
      onSubmit?.();
    },
    [onSubmit]
  );

  const hasValues = Object.values(values).some((v) => v && v.trim() !== '');

  const fieldSize = compact ? 'sm' : 'md';

  return (
    <form
      onSubmit={handleSubmit}
      className={`
        ${layout === 'horizontal' ? 'flex flex-wrap items-end gap-4' : 'space-y-4'}
      `}
      role="search"
      aria-label="篩選條件"
    >
      {fields.map((field) => (
        <div
          key={field.key}
          className={layout === 'horizontal' ? '' : 'w-full'}
          style={{ width: layout === 'horizontal' ? field.width : undefined }}
        >
          {field.type === 'search' ? (
            <TextInput
              id={`${id}-${field.key}`}
              label={field.label}
              placeholder={field.placeholder}
              value={values[field.key] || ''}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              disabled={disabled}
              size={fieldSize}
              type="search"
              autoComplete="off"
            />
          ) : (
            <Select
              id={`${id}-${field.key}`}
              label={field.label}
              placeholder={field.placeholder}
              options={field.options || []}
              value={values[field.key] || ''}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              disabled={disabled}
              size={fieldSize}
            />
          )}
        </div>
      ))}

      <div
        className={`
          flex items-center gap-2
          ${layout === 'vertical' ? 'pt-2' : ''}
          ${compact ? '' : 'pb-0.5'}
        `}
      >
        {showSubmit && (
          <Button
            type="submit"
            variant="primary"
            size={fieldSize}
            loading={loading}
            disabled={disabled}
          >
            {submitText}
          </Button>
        )}

        {showClear && hasValues && (
          <Button
            type="button"
            variant="ghost"
            size={fieldSize}
            onClick={handleClear}
            disabled={disabled || loading}
          >
            {clearText}
          </Button>
        )}

        {actions}
      </div>
    </form>
  );
}

export default FilterBar;
