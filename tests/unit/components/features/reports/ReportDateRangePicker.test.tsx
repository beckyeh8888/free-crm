/**
 * ReportDateRangePicker Component Unit Tests
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReportDateRangePicker } from '@/components/features/reports/ReportDateRangePicker';

describe('ReportDateRangePicker Component', () => {
  const mockOnChange = vi.fn();
  const defaultValue = {
    startDate: '2026-01-01T00:00:00.000Z',
    endDate: '2026-12-31T23:59:59.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all preset buttons', () => {
    render(<ReportDateRangePicker value={defaultValue} onChange={mockOnChange} />);

    expect(screen.getByText('今日')).toBeInTheDocument();
    expect(screen.getByText('本週')).toBeInTheDocument();
    expect(screen.getByText('本月')).toBeInTheDocument();
    expect(screen.getByText('本季')).toBeInTheDocument();
    expect(screen.getByText('今年')).toBeInTheDocument();
    expect(screen.getByText('自訂')).toBeInTheDocument();
  });

  it('calls onChange when a preset is clicked', () => {
    render(<ReportDateRangePicker value={defaultValue} onChange={mockOnChange} />);

    fireEvent.click(screen.getByText('本月'));

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: expect.any(String),
        endDate: expect.any(String),
      })
    );
  });

  it('highlights the active preset', () => {
    render(<ReportDateRangePicker value={defaultValue} onChange={mockOnChange} />);

    // Default active preset is '今年'
    const yearButton = screen.getByText('今年');
    expect(yearButton).toHaveAttribute('aria-pressed', 'true');
    expect(yearButton.className).toContain('bg-[#0070f0]');
  });

  it('shows custom date inputs when 自訂 is clicked', () => {
    render(<ReportDateRangePicker value={defaultValue} onChange={mockOnChange} />);

    fireEvent.click(screen.getByText('自訂'));

    expect(screen.getByLabelText('報表開始日期')).toBeInTheDocument();
    expect(screen.getByLabelText('報表結束日期')).toBeInTheDocument();
  });

  it('does not show custom date inputs by default', () => {
    render(<ReportDateRangePicker value={defaultValue} onChange={mockOnChange} />);

    expect(screen.queryByLabelText('報表開始日期')).not.toBeInTheDocument();
  });

  it('hides custom inputs when switching back to a preset', () => {
    render(<ReportDateRangePicker value={defaultValue} onChange={mockOnChange} />);

    // Open custom
    fireEvent.click(screen.getByText('自訂'));
    expect(screen.getByLabelText('報表開始日期')).toBeInTheDocument();

    // Switch to preset
    fireEvent.click(screen.getByText('本月'));
    expect(screen.queryByLabelText('報表開始日期')).not.toBeInTheDocument();
  });

  it('does not call onChange when 自訂 is clicked', () => {
    render(<ReportDateRangePicker value={defaultValue} onChange={mockOnChange} />);

    fireEvent.click(screen.getByText('自訂'));

    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('preset buttons have aria-pressed attribute', () => {
    render(<ReportDateRangePicker value={defaultValue} onChange={mockOnChange} />);

    const buttons = screen.getAllByRole('button');
    const todayButton = buttons.find((b) => b.textContent === '今日');
    expect(todayButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('has proper group aria-label', () => {
    render(<ReportDateRangePicker value={defaultValue} onChange={mockOnChange} />);

    expect(screen.getByRole('group')).toHaveAttribute('aria-label', '日期範圍預設');
  });

  it('has screen-reader labels for date inputs', () => {
    render(<ReportDateRangePicker value={defaultValue} onChange={mockOnChange} />);

    fireEvent.click(screen.getByText('自訂'));

    expect(screen.getByLabelText('開始日期')).toBeInTheDocument();
    expect(screen.getByLabelText('結束日期')).toBeInTheDocument();
  });

  it('preset buttons call onChange for non-custom presets', () => {
    render(<ReportDateRangePicker value={defaultValue} onChange={mockOnChange} />);

    fireEvent.click(screen.getByText('今日'));
    expect(mockOnChange).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('本週'));
    expect(mockOnChange).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByText('本季'));
    expect(mockOnChange).toHaveBeenCalledTimes(3);
  });

  it('calls onChange when custom start date is changed', () => {
    render(<ReportDateRangePicker value={defaultValue} onChange={mockOnChange} />);

    fireEvent.click(screen.getByText('自訂'));

    const startInput = screen.getByLabelText('報表開始日期');
    fireEvent.change(startInput, { target: { value: '2026-03-01' } });

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: expect.any(String),
        endDate: defaultValue.endDate,
      })
    );
  });

  it('calls onChange when custom end date is changed', () => {
    render(<ReportDateRangePicker value={defaultValue} onChange={mockOnChange} />);

    fireEvent.click(screen.getByText('自訂'));

    const endInput = screen.getByLabelText('報表結束日期');
    fireEvent.change(endInput, { target: { value: '2026-06-30' } });

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: defaultValue.startDate,
        endDate: expect.any(String),
      })
    );
  });

  it('custom date inputs show correct initial values', () => {
    render(<ReportDateRangePicker value={defaultValue} onChange={mockOnChange} />);

    fireEvent.click(screen.getByText('自訂'));

    const startInput: HTMLInputElement = screen.getByLabelText('報表開始日期');
    const endInput: HTMLInputElement = screen.getByLabelText('報表結束日期');

    expect(startInput.value).toBe('2026-01-01');
    expect(endInput.value).toBe('2026-12-31');
  });
});
