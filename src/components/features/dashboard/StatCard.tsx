'use client';

/**
 * StatCard - Dashboard statistics card
 * Matches Pencil StatHero component design
 */

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  readonly label: string;
  readonly value: string | number;
  readonly icon: LucideIcon;
  readonly trend?: string;
  readonly href?: string;
}

export function StatCard({ label, value, icon: Icon, trend, href }: StatCardProps) {
  const content = (
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-text-secondary">{label}</p>
        <p className="mt-1 text-2xl font-bold text-text-primary">{value}</p>
        {trend && (
          <p className="mt-1 text-xs text-text-muted">{trend}</p>
        )}
      </div>
      <div
        className="w-10 h-10 rounded-lg bg-accent-600/15 flex items-center justify-center"
        aria-hidden="true"
      >
        <Icon className="w-5 h-5 text-accent-600" />
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block bg-background-tertiary border border-border rounded-xl p-5 hover:border-accent-600/50 transition-colors"
        aria-label={`${label}: ${value}`}
      >
        {content}
      </Link>
    );
  }

  return (
    <article className="bg-background-tertiary border border-border rounded-xl p-5">
      {content}
    </article>
  );
}
