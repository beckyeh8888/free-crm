'use client';

/**
 * ToggleSwitch - Accessible toggle switch component
 * WCAG 2.2 AAA Compliant - role="switch", aria-checked, focus-visible
 */

interface ToggleSwitchProps {
  readonly enabled: boolean;
  readonly onToggle: () => void;
  readonly 'aria-label'?: string;
  readonly disabled?: boolean;
}

export function ToggleSwitch({
  enabled,
  onToggle,
  'aria-label': ariaLabel,
  disabled = false,
}: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={ariaLabel}
      onClick={onToggle}
      disabled={disabled}
      className={`
        relative w-11 h-6 rounded-full transition-colors duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 focus-visible:ring-offset-2 focus-visible:ring-offset-background-tertiary
        disabled:opacity-50 disabled:cursor-not-allowed
        ${enabled ? 'bg-accent-600' : 'bg-[#333333]'}
      `}
    >
      <span
        className={`
          absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200
          ${enabled ? 'translate-x-[22px]' : 'translate-x-0.5'}
        `}
      />
    </button>
  );
}
