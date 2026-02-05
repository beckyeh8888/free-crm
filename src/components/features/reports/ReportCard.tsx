'use client';

/**
 * ReportCard - Report section card wrapper
 */

interface ReportCardProps {
  readonly title: string;
  readonly children: React.ReactNode;
  readonly className?: string;
}

export function ReportCard({ title, children, className = '' }: ReportCardProps) {
  return (
    <section
      className={`bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 ${className}`}
    >
      <h3 className="text-sm font-semibold text-[#fafafa] mb-4">{title}</h3>
      {children}
    </section>
  );
}
