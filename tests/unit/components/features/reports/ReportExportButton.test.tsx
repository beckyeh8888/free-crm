/**
 * ReportExportButton Component Unit Tests
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReportExportButton } from '@/components/features/reports/ReportExportButton';

describe('ReportExportButton Component', () => {
  const mockOnExport = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders export button', () => {
    render(<ReportExportButton onExport={mockOnExport} />);

    expect(screen.getByRole('button', { name: '匯出報表' })).toBeInTheDocument();
    expect(screen.getByText('匯出')).toBeInTheDocument();
  });

  it('shows dropdown when clicked', () => {
    render(<ReportExportButton onExport={mockOnExport} />);

    fireEvent.click(screen.getByText('匯出'));

    expect(screen.getByText('CSV')).toBeInTheDocument();
    expect(screen.getByText('JSON')).toBeInTheDocument();
    expect(screen.getByText('列印')).toBeInTheDocument();
  });

  it('calls onExport with csv when CSV clicked', () => {
    render(<ReportExportButton onExport={mockOnExport} />);

    fireEvent.click(screen.getByText('匯出'));
    fireEvent.click(screen.getByText('CSV'));

    expect(mockOnExport).toHaveBeenCalledWith('csv');
  });

  it('calls onExport with json when JSON clicked', () => {
    render(<ReportExportButton onExport={mockOnExport} />);

    fireEvent.click(screen.getByText('匯出'));
    fireEvent.click(screen.getByText('JSON'));

    expect(mockOnExport).toHaveBeenCalledWith('json');
  });

  it('calls onExport with print when 列印 clicked', () => {
    render(<ReportExportButton onExport={mockOnExport} />);

    fireEvent.click(screen.getByText('匯出'));
    fireEvent.click(screen.getByText('列印'));

    expect(mockOnExport).toHaveBeenCalledWith('print');
  });

  it('closes dropdown after selecting an option', () => {
    render(<ReportExportButton onExport={mockOnExport} />);

    fireEvent.click(screen.getByText('匯出'));
    fireEvent.click(screen.getByText('CSV'));

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('toggles dropdown on button click', () => {
    render(<ReportExportButton onExport={mockOnExport} />);

    const button = screen.getByText('匯出');

    // Open
    fireEvent.click(button);
    expect(screen.getByRole('menu')).toBeInTheDocument();

    // Close
    fireEvent.click(button);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('shows exporting text when isExporting is true', () => {
    render(<ReportExportButton onExport={mockOnExport} isExporting />);

    expect(screen.getByText('匯出中...')).toBeInTheDocument();
  });

  it('disables button when isExporting', () => {
    render(<ReportExportButton onExport={mockOnExport} isExporting />);

    expect(screen.getByRole('button', { name: '匯出報表' })).toBeDisabled();
  });

  it('has aria-expanded attribute', () => {
    render(<ReportExportButton onExport={mockOnExport} />);

    const button = screen.getByRole('button', { name: '匯出報表' });
    expect(button).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('has aria-haspopup attribute', () => {
    render(<ReportExportButton onExport={mockOnExport} />);

    expect(screen.getByRole('button', { name: '匯出報表' })).toHaveAttribute('aria-haspopup', 'true');
  });

  it('dropdown items have menuitem role', () => {
    render(<ReportExportButton onExport={mockOnExport} />);

    fireEvent.click(screen.getByText('匯出'));

    const items = screen.getAllByRole('menuitem');
    expect(items).toHaveLength(3);
  });

  it('closes dropdown on Escape key', () => {
    render(<ReportExportButton onExport={mockOnExport} />);

    const button = screen.getByRole('button', { name: '匯出報表' });

    fireEvent.click(button);
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.keyDown(button, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes dropdown on outside click', () => {
    render(
      <div>
        <span data-testid="outside">Outside</span>
        <ReportExportButton onExport={mockOnExport} />
      </div>
    );

    fireEvent.click(screen.getByText('匯出'));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('meets minimum touch target size', () => {
    render(<ReportExportButton onExport={mockOnExport} />);

    const button = screen.getByRole('button', { name: '匯出報表' });
    expect(button.className).toContain('min-h-[36px]');
  });
});
