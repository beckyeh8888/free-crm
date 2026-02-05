/**
 * GanttFilters Component Tests
 * Unit tests for project/customer filter controls
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { vi } from 'vitest';
import { GanttFilters, type GanttFilterValues } from '@/components/features/gantt/GanttFilters';

// Mock hooks
vi.mock('@/hooks/useProjects', () => ({
  useProjects: () => ({
    data: {
      data: [
        { id: 'proj-1', name: 'Project Alpha' },
        { id: 'proj-2', name: 'Project Beta' },
      ],
    },
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useCustomers', () => ({
  useCustomers: () => ({
    data: {
      data: [
        { id: 'cust-1', name: 'Customer One' },
        { id: 'cust-2', name: 'Customer Two' },
      ],
    },
    isLoading: false,
  }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return function Wrapper({ children }: { readonly children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe('GanttFilters', () => {
  const defaultValues: GanttFilterValues = {
    projectId: '',
    customerId: '',
    assignedToId: '',
  };

  it('renders filter controls', () => {
    const onChange = vi.fn();
    render(
      <GanttFilters values={defaultValues} onChange={onChange} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('篩選')).toBeInTheDocument();
    expect(screen.getByLabelText('選擇專案')).toBeInTheDocument();
    expect(screen.getByLabelText('選擇客戶')).toBeInTheDocument();
  });

  it('displays project options', () => {
    const onChange = vi.fn();
    render(
      <GanttFilters values={defaultValues} onChange={onChange} />,
      { wrapper: createWrapper() }
    );

    const projectSelect = screen.getByLabelText('選擇專案');
    expect(projectSelect).toHaveTextContent('所有專案');
    expect(projectSelect).toHaveTextContent('Project Alpha');
    expect(projectSelect).toHaveTextContent('Project Beta');
  });

  it('displays customer options', () => {
    const onChange = vi.fn();
    render(
      <GanttFilters values={defaultValues} onChange={onChange} />,
      { wrapper: createWrapper() }
    );

    const customerSelect = screen.getByLabelText('選擇客戶');
    expect(customerSelect).toHaveTextContent('所有客戶');
    expect(customerSelect).toHaveTextContent('Customer One');
    expect(customerSelect).toHaveTextContent('Customer Two');
  });

  it('calls onChange when project is selected', () => {
    const onChange = vi.fn();
    render(
      <GanttFilters values={defaultValues} onChange={onChange} />,
      { wrapper: createWrapper() }
    );

    const projectSelect = screen.getByLabelText('選擇專案');
    fireEvent.change(projectSelect, { target: { value: 'proj-1' } });

    expect(onChange).toHaveBeenCalledWith({
      ...defaultValues,
      projectId: 'proj-1',
    });
  });

  it('calls onChange when customer is selected', () => {
    const onChange = vi.fn();
    render(
      <GanttFilters values={defaultValues} onChange={onChange} />,
      { wrapper: createWrapper() }
    );

    const customerSelect = screen.getByLabelText('選擇客戶');
    fireEvent.change(customerSelect, { target: { value: 'cust-2' } });

    expect(onChange).toHaveBeenCalledWith({
      ...defaultValues,
      customerId: 'cust-2',
    });
  });

  it('shows clear button when filters are active', () => {
    const onChange = vi.fn();
    const activeValues: GanttFilterValues = {
      projectId: 'proj-1',
      customerId: '',
      assignedToId: '',
    };

    render(
      <GanttFilters values={activeValues} onChange={onChange} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('清除篩選')).toBeInTheDocument();
  });

  it('hides clear button when no filters are active', () => {
    const onChange = vi.fn();
    render(
      <GanttFilters values={defaultValues} onChange={onChange} />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByText('清除篩選')).not.toBeInTheDocument();
  });

  it('clears all filters when clear button is clicked', () => {
    const onChange = vi.fn();
    const activeValues: GanttFilterValues = {
      projectId: 'proj-1',
      customerId: 'cust-2',
      assignedToId: 'user-1',
    };

    render(
      <GanttFilters values={activeValues} onChange={onChange} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByText('清除篩選'));

    expect(onChange).toHaveBeenCalledWith({
      projectId: '',
      customerId: '',
      assignedToId: '',
    });
  });

  it('shows selected values in dropdowns', () => {
    const onChange = vi.fn();
    const selectedValues: GanttFilterValues = {
      projectId: 'proj-2',
      customerId: 'cust-1',
      assignedToId: '',
    };

    render(
      <GanttFilters values={selectedValues} onChange={onChange} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByLabelText('選擇專案')).toHaveValue('proj-2');
    expect(screen.getByLabelText('選擇客戶')).toHaveValue('cust-1');
  });
});
