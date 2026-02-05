'use client';

/**
 * GanttFilters - Filter controls for project/customer/assignee
 * Sprint 5: Calendar & Gantt Chart
 */

import { Filter } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useCustomers } from '@/hooks/useCustomers';

export interface GanttFilterValues {
  readonly projectId: string;
  readonly customerId: string;
  readonly assignedToId: string;
}

interface GanttFiltersProps {
  readonly values: GanttFilterValues;
  readonly onChange: (values: GanttFilterValues) => void;
}

export function GanttFilters({ values, onChange }: GanttFiltersProps) {
  const { data: projectsData } = useProjects({ limit: 100 });
  const { data: customersData } = useCustomers({ limit: 100 });

  const projects = projectsData?.data || [];
  const customers = customersData?.data || [];

  const handleChange = (field: keyof GanttFilterValues, value: string) => {
    onChange({ ...values, [field]: value });
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2 text-text-muted">
        <Filter className="w-4 h-4" />
        <span className="text-sm">篩選</span>
      </div>

      {/* Project Filter */}
      <select
        value={values.projectId}
        onChange={(e) => handleChange('projectId', e.target.value)}
        className="form-input py-1.5 px-3 text-sm min-w-[140px]"
        aria-label="選擇專案"
      >
        <option value="">所有專案</option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>

      {/* Customer Filter */}
      <select
        value={values.customerId}
        onChange={(e) => handleChange('customerId', e.target.value)}
        className="form-input py-1.5 px-3 text-sm min-w-[140px]"
        aria-label="選擇客戶"
      >
        <option value="">所有客戶</option>
        {customers.map((customer) => (
          <option key={customer.id} value={customer.id}>
            {customer.name}
          </option>
        ))}
      </select>

      {/* Clear Filters */}
      {(values.projectId || values.customerId || values.assignedToId) && (
        <button
          type="button"
          onClick={() =>
            onChange({ projectId: '', customerId: '', assignedToId: '' })
          }
          className="text-sm text-text-muted hover:text-accent-600 transition-colors"
        >
          清除篩選
        </button>
      )}
    </div>
  );
}
