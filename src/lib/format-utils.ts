/**
 * Format Utilities
 *
 * Date/time formatting helpers for UI display.
 */

/**
 * Format a date string as relative time in Traditional Chinese.
 * e.g., "剛剛", "3 分鐘前", "2 小時前", "3 天前"
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return '剛剛';
  if (diffMin < 60) return `${diffMin} 分鐘前`;
  if (diffHour < 24) return `${diffHour} 小時前`;
  if (diffDay < 7) return `${diffDay} 天前`;

  return date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
}
