'use client';

/**
 * ReportExportButton - Export dropdown (CSV / JSON / Print)
 */

import { useState, useRef, useEffect, useCallback } from 'react';

interface ReportExportButtonProps {
  readonly onExport: (format: 'csv' | 'json' | 'print') => void;
  readonly isExporting?: boolean;
}

export function ReportExportButton({
  onExport,
  isExporting = false,
}: ReportExportButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    },
    []
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        disabled={isExporting}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="匯出報表"
        className="px-3 py-1.5 text-sm rounded-lg border border-[#2a2a2a] text-[#a0a0a0] hover:bg-[#262626] transition-colors min-h-[36px] disabled:opacity-50"
      >
        {isExporting ? '匯出中...' : '匯出'}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-1 w-32 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-lg z-10 py-1"
          role="menu"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onExport('csv');
              setOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm text-[#fafafa] hover:bg-[#262626] min-h-[36px]"
          >
            CSV
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onExport('json');
              setOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm text-[#fafafa] hover:bg-[#262626] min-h-[36px]"
          >
            JSON
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onExport('print');
              setOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm text-[#fafafa] hover:bg-[#262626] min-h-[36px]"
          >
            列印
          </button>
        </div>
      )}
    </div>
  );
}
