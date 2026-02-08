/**
 * DocumentPreview Component Unit Tests
 *
 * @vitest-environment jsdom
 */

import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DocumentPreview } from '@/components/features/documents/DocumentPreview';
import type { Document, DocumentAnalysis } from '@/hooks/useDocuments';

function createMockDocument(
  overrides: Partial<Document & { analyses?: DocumentAnalysis[] }> = {}
): Document & { analyses?: DocumentAnalysis[] } {
  return {
    id: 'doc-1',
    name: 'Test Contract',
    type: 'contract',
    content: 'This is a test contract content.',
    filePath: null,
    fileSize: null,
    mimeType: null,
    extractionStatus: null,
    extractedAt: null,
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-01-15T00:00:00Z',
    organizationId: 'org-1',
    customerId: null,
    customer: null,
    _count: { analyses: 0 },
    analyses: [],
    ...overrides,
  };
}

describe('DocumentPreview Component', () => {
  const defaultProps = {
    onAnalyze: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onDownload: vi.fn(),
  };

  describe('Header', () => {
    it('renders document name', () => {
      render(<DocumentPreview document={createMockDocument()} {...defaultProps} />);

      expect(screen.getByText('Test Contract')).toBeInTheDocument();
    });

    it('renders type label in Chinese', () => {
      render(<DocumentPreview document={createMockDocument({ type: 'contract' })} {...defaultProps} />);

      expect(screen.getByText(/合約/)).toBeInTheDocument();
    });

    it('renders customer name when available', () => {
      render(
        <DocumentPreview
          document={createMockDocument({
            customer: { id: 'cust-1', name: 'Acme Corp' },
          })}
          {...defaultProps}
        />
      );

      expect(screen.getByText(/Acme Corp/)).toBeInTheDocument();
    });

    it('renders formatted date', () => {
      render(
        <DocumentPreview
          document={createMockDocument({ createdAt: '2026-01-15T00:00:00Z' })}
          {...defaultProps}
        />
      );

      expect(screen.getByText(/2026/)).toBeInTheDocument();
    });

    it('renders file size when available', () => {
      render(
        <DocumentPreview
          document={createMockDocument({ fileSize: 1048576 })}
          {...defaultProps}
        />
      );

      expect(screen.getByText(/1\.0 MB/)).toBeInTheDocument();
    });
  });

  describe('Action buttons', () => {
    it('renders edit button', () => {
      render(<DocumentPreview document={createMockDocument()} {...defaultProps} />);

      expect(screen.getByRole('button', { name: '編輯' })).toBeInTheDocument();
    });

    it('renders AI analyze button', () => {
      render(<DocumentPreview document={createMockDocument()} {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'AI 分析' })).toBeInTheDocument();
    });

    it('renders delete button', () => {
      render(<DocumentPreview document={createMockDocument()} {...defaultProps} />);

      expect(screen.getByRole('button', { name: '刪除' })).toBeInTheDocument();
    });

    it('renders download button when file exists', () => {
      render(
        <DocumentPreview
          document={createMockDocument({ filePath: 'documents/org-1/uuid/file.pdf' })}
          {...defaultProps}
        />
      );

      expect(screen.getByRole('button', { name: '下載檔案' })).toBeInTheDocument();
    });

    it('does not render download button when no file', () => {
      render(
        <DocumentPreview
          document={createMockDocument({ filePath: null })}
          {...defaultProps}
        />
      );

      expect(screen.queryByRole('button', { name: '下載檔案' })).not.toBeInTheDocument();
    });

    it('calls onEdit when edit clicked', () => {
      const onEdit = vi.fn();
      render(<DocumentPreview document={createMockDocument()} {...defaultProps} onEdit={onEdit} />);

      fireEvent.click(screen.getByRole('button', { name: '編輯' }));
      expect(onEdit).toHaveBeenCalledTimes(1);
    });

    it('calls onAnalyze when analyze clicked', () => {
      const onAnalyze = vi.fn();
      render(<DocumentPreview document={createMockDocument()} {...defaultProps} onAnalyze={onAnalyze} />);

      fireEvent.click(screen.getByRole('button', { name: 'AI 分析' }));
      expect(onAnalyze).toHaveBeenCalledTimes(1);
    });

    it('calls onDelete when delete clicked', () => {
      const onDelete = vi.fn();
      render(<DocumentPreview document={createMockDocument()} {...defaultProps} onDelete={onDelete} />);

      fireEvent.click(screen.getByRole('button', { name: '刪除' }));
      expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it('calls onDownload when download clicked', () => {
      const onDownload = vi.fn();
      render(
        <DocumentPreview
          document={createMockDocument({ filePath: 'documents/org-1/uuid/file.pdf' })}
          {...defaultProps}
          onDownload={onDownload}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: '下載檔案' }));
      expect(onDownload).toHaveBeenCalledTimes(1);
    });
  });

  describe('Content preview', () => {
    it('shows text content when available', () => {
      render(
        <DocumentPreview
          document={createMockDocument({ content: 'Hello World' })}
          {...defaultProps}
        />
      );

      expect(screen.getByText('Hello World')).toBeInTheDocument();
      expect(screen.getByText('內容')).toBeInTheDocument();
    });

    it('shows file info when file exists but no content', () => {
      render(
        <DocumentPreview
          document={createMockDocument({
            content: null,
            filePath: 'documents/org-1/uuid/file.pdf',
            mimeType: 'application/pdf',
            fileSize: 51200,
          })}
          {...defaultProps}
        />
      );

      expect(screen.getByText('檔案資訊')).toBeInTheDocument();
      expect(screen.getByText(/application\/pdf/)).toBeInTheDocument();
    });

    it('shows empty message when no content and no file', () => {
      render(
        <DocumentPreview
          document={createMockDocument({ content: null, filePath: null })}
          {...defaultProps}
        />
      );

      expect(screen.getByText('無文件內容')).toBeInTheDocument();
    });
  });

  describe('AI Analysis section', () => {
    it('shows empty analysis panel when no analyses', () => {
      render(
        <DocumentPreview
          document={createMockDocument({ analyses: [] })}
          {...defaultProps}
        />
      );

      expect(screen.getByText('尚未進行 AI 分析')).toBeInTheDocument();
    });

    it('shows analysis results when available', () => {
      const analysis: DocumentAnalysis = {
        id: 'a-1',
        summary: 'Test summary',
        sentiment: 'positive',
        keyPoints: JSON.stringify(['Point 1']),
        actionItems: JSON.stringify([]),
        entities: JSON.stringify({}),
        confidence: 0.9,
        model: 'gpt-4',
        createdAt: '2026-01-15T00:00:00Z',
        documentId: 'doc-1',
      };

      render(
        <DocumentPreview
          document={createMockDocument({ analyses: [analysis] })}
          {...defaultProps}
        />
      );

      expect(screen.getByText('Test summary')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('action buttons meet minimum touch target (44px)', () => {
      render(<DocumentPreview document={createMockDocument()} {...defaultProps} />);

      const editBtn = screen.getByRole('button', { name: '編輯' });
      expect(editBtn.className).toContain('min-h-[44px]');
      expect(editBtn.className).toContain('min-w-[44px]');
    });

    it('action buttons have title attributes', () => {
      render(<DocumentPreview document={createMockDocument()} {...defaultProps} />);

      const editBtn = screen.getByRole('button', { name: '編輯' });
      expect(editBtn).toHaveAttribute('title', '編輯');
    });
  });
});
