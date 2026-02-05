'use client';

/**
 * ReportTabNavigation - 5 tab switcher for report sections
 */

export type ReportTab = 'pipeline' | 'revenue' | 'customers' | 'tasks' | 'team';

interface Tab {
  readonly key: ReportTab;
  readonly label: string;
}

const TABS: readonly Tab[] = [
  { key: 'pipeline', label: '銷售管線' },
  { key: 'revenue', label: '營收分析' },
  { key: 'customers', label: '客戶分析' },
  { key: 'tasks', label: '任務活動' },
  { key: 'team', label: '團隊績效' },
];

interface ReportTabNavigationProps {
  readonly activeTab: ReportTab;
  readonly onChange: (tab: ReportTab) => void;
}

export function ReportTabNavigation({
  activeTab,
  onChange,
}: ReportTabNavigationProps) {
  return (
    <nav aria-label="報表類型">
      <div
        className="flex gap-1 overflow-x-auto scrollbar-hide border-b border-[#2a2a2a] pb-1"
        role="tablist"
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            aria-controls={`report-panel-${tab.key}`}
            id={`report-tab-${tab.key}`}
            onClick={() => onChange(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg min-h-[44px] whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'text-[#0070f0] border-b-2 border-[#0070f0] bg-[#0070f0]/10'
                : 'text-[#a0a0a0] hover:text-[#fafafa] hover:bg-[#262626]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
