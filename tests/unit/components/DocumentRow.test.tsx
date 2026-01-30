/**
 * DocumentRow Component Unit Tests
 *
 * @vitest-environment jsdom
 */

import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DocumentRow } from '@/components/features/documents/DocumentRow';
import type { Document } from '@/hooks/useDocuments';

function createMockDocument(overrides: Partial<Document> = {}): Document {
  return {
    id: 'doc-1',
    name: 'Test Contract',
    type: 'contract',
    content: 'Contract content',
    filePath: null,
    fileSize: null,
    mimeType: null,
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-01-15T00:00:00Z',
    organizationId: 'org-1',
    customerId: null,
    customer: null,
    _count: { analyses: 0 },
    ...overrides,
  };
}

describe('DocumentRow Component', () => {
  describe('Rendering', () => {
    it('renders document name', () => {
      render(<DocumentRow document={createMockDocument()} />);

      expect(screen.getByText('Test Contract')).toBeInTheDocument();
    });

    it('renders type label in Chinese', () => {
      render(<DocumentRow document={createMockDocument({ type: 'contract' })} />);

      expect(screen.getByText(/合約/)).toBeInTheDocument();
    });

    it('renders email type label', () => {
      render(<DocumentRow document={createMockDocument({ type: 'email' })} />);

      expect(screen.getByText(/郵件/)).toBeInTheDocument();
    });

    it('renders meeting_notes type label', () => {
      render(<DocumentRow document={createMockDocument({ type: 'meeting_notes' })} />);

      expect(screen.getByText(/會議/)).toBeInTheDocument();
    });

    it('renders quotation type label', () => {
      render(<DocumentRow document={createMockDocument({ type: 'quotation' })} />);

      expect(screen.getByText(/報價/)).toBeInTheDocument();
    });

    it('renders as button element', () => {
      render(<DocumentRow document={createMockDocument()} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders date', () => {
      render(<DocumentRow document={createMockDocument({ createdAt: '2026-03-15T00:00:00Z' })} />);

      expect(screen.getByText(/3\/15/)).toBeInTheDocument();
    });

    it('renders customer name when available', () => {
      render(
        <DocumentRow
          document={createMockDocument({
            customer: { id: 'cust-1', name: 'Acme Corp' },
          })}
        />
      );

      expect(screen.getByText(/Acme Corp/)).toBeInTheDocument();
    });

    it('renders file size when available', () => {
      render(
        <DocumentRow
          document={createMockDocument({ fileSize: 51200 })}
        />
      );

      expect(screen.getByText(/50 KB/)).toBeInTheDocument();
    });
  });

  describe('Analysis indicator', () => {
    it('shows green dot when analyses exist', () => {
      render(
        <DocumentRow
          document={createMockDocument({ _count: { analyses: 1 } })}
        />
      );

      expect(screen.getByLabelText('AI 已分析')).toBeInTheDocument();
    });

    it('shows muted dot when no analyses', () => {
      render(
        <DocumentRow
          document={createMockDocument({ _count: { analyses: 0 } })}
        />
      );

      expect(screen.getByLabelText('未分析')).toBeInTheDocument();
    });
  });

  describe('Selection', () => {
    it('applies selected style when isSelected', () => {
      render(<DocumentRow document={createMockDocument()} isSelected />);

      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-background-hover');
      expect(button).toHaveAttribute('aria-current', 'true');
    });

    it('does not have aria-current when not selected', () => {
      render(<DocumentRow document={createMockDocument()} isSelected={false} />);

      const button = screen.getByRole('button');
      expect(button).not.toHaveAttribute('aria-current');
    });
  });

  describe('Events', () => {
    it('calls onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<DocumentRow document={createMockDocument()} onClick={handleClick} />);

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('meets minimum touch target size (56px)', () => {
      render(<DocumentRow document={createMockDocument()} />);

      const button = screen.getByRole('button');
      expect(button.className).toContain('min-h-[56px]');
    });

    it('has focus-visible ring styles', () => {
      render(<DocumentRow document={createMockDocument()} />);

      const button = screen.getByRole('button');
      expect(button.className).toContain('focus-visible:ring-2');
    });
  });
});
