/**
 * LoadingState Component - WCAG 2.2 AAA Compliant
 *
 * Displays loading indicators with various styles.
 */

import { ReactNode } from 'react';

export type LoadingVariant = 'spinner' | 'skeleton' | 'dots';

export interface LoadingStateProps {
  /** Loading variant */
  readonly variant?: LoadingVariant;
  /** Loading message */
  readonly message?: string;
  /** Size of the loader */
  readonly size?: 'sm' | 'md' | 'lg';
  /** Full page overlay */
  readonly fullPage?: boolean;
  /** Number of skeleton lines (for skeleton variant) */
  readonly skeletonLines?: number;
  /** Custom content to show while loading */
  readonly children?: ReactNode;
}

const sizeClasses = {
  sm: {
    spinner: 'w-6 h-6 border-2',
    dots: 'w-2 h-2',
    text: 'text-sm',
  },
  md: {
    spinner: 'w-10 h-10 border-3',
    dots: 'w-3 h-3',
    text: 'text-base',
  },
  lg: {
    spinner: 'w-16 h-16 border-4',
    dots: 'w-4 h-4',
    text: 'text-lg',
  },
};

function Spinner({ size = 'md' }: { readonly size?: 'sm' | 'md' | 'lg' }) {
  // Use aria-hidden instead of role="presentation" for decorative elements
  return (
    <div
      className={`
        ${sizeClasses[size].spinner}
        border-gray-200 dark:border-gray-700
        border-t-blue-600 dark:border-t-blue-400
        rounded-full animate-spin
      `}
      aria-hidden="true"
    />
  );
}

function Dots({ size = 'md' }: { readonly size?: 'sm' | 'md' | 'lg' }) {
  // Use semantic keys instead of array index
  const dots = ['dot-1', 'dot-2', 'dot-3'] as const;
  return (
    <div className="flex gap-1.5">
      {dots.map((id, i) => (
        <div
          key={id}
          className={`
            ${sizeClasses[size].dots}
            bg-blue-600 dark:bg-blue-400
            rounded-full animate-bounce
          `}
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

function SkeletonLines({ lines = 3, size = 'md' }: { readonly lines?: number; readonly size?: 'sm' | 'md' | 'lg' }) {
  const heightClasses = { sm: 'h-3', md: 'h-4', lg: 'h-5' };
  const heightClass = heightClasses[size];

  // Use aria-hidden instead of role="presentation" for decorative elements
  return (
    <div className="w-full space-y-3" aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={`skeleton-line-${i}`}
          className={`
            ${heightClass}
            bg-gray-200 dark:bg-gray-700
            rounded animate-pulse
          `}
          style={{
            width: i === lines - 1 ? '60%' : '100%',
          }}
        />
      ))}
    </div>
  );
}

export function LoadingState({
  variant = 'spinner',
  message = '載入中...',
  size = 'md',
  fullPage = false,
  skeletonLines = 3,
  children,
}: LoadingStateProps) {
  const content = (
    <div
      className={`
        flex flex-col items-center justify-center gap-4
        ${fullPage ? 'min-h-screen' : 'py-12 px-4'}
      `}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {variant === 'spinner' && <Spinner size={size} />}
      {variant === 'dots' && <Dots size={size} />}
      {variant === 'skeleton' && (
        <div className="w-full max-w-md">
          <SkeletonLines lines={skeletonLines} size={size} />
        </div>
      )}

      {message && variant !== 'skeleton' && (
        <p className={`${sizeClasses[size].text} text-gray-600 dark:text-gray-400`}>
          {message}
        </p>
      )}

      {children}

      {/* Screen reader announcement */}
      <span className="sr-only">{message}</span>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}

/**
 * Skeleton component for custom layouts
 */
export function Skeleton({
  className = '',
  width,
  height,
}: {
  readonly className?: string;
  readonly width?: string | number;
  readonly height?: string | number;
}) {
  // Use only aria-hidden for decorative elements
  return (
    <div
      className={`bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

export default LoadingState;
