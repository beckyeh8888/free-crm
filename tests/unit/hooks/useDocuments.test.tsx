/**
 * useDocuments Hook Tests
 * Unit tests for document CRUD and analysis hooks
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  useDocuments,
  useDocument,
  useCreateDocument,
  useUploadDocument,
  useUpdateDocument,
  useDeleteDocument,
  useAnalyzeDocument,
  useDocumentAnalysis,
  useDocumentDownload,
} from '@/hooks/useDocuments';
import { apiClient } from '@/services/api';

// Mock api client
vi.mock('@/services/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock window.open
const mockWindowOpen = vi.fn();
Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
  writable: true,
});

// Mock fetch for upload
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockDocuments = [
  {
    id: 'doc-1',
    name: '合約文件.pdf',
    type: 'contract',
    content: null,
    filePath: '/uploads/doc-1.pdf',
    fileSize: 1024000,
    mimeType: 'application/pdf',
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-01-15T00:00:00Z',
    organizationId: 'org-1',
    customerId: 'cust-1',
    customer: { id: 'cust-1', name: '客戶一' },
    _count: { analyses: 1 },
  },
  {
    id: 'doc-2',
    name: '會議紀錄.docx',
    type: 'meeting_notes',
    content: '會議重點摘要...',
    filePath: null,
    fileSize: null,
    mimeType: null,
    createdAt: '2026-01-20T00:00:00Z',
    updatedAt: '2026-01-20T00:00:00Z',
    organizationId: 'org-1',
    customerId: null,
    _count: { analyses: 0 },
  },
];

const mockAnalysis = {
  id: 'analysis-1',
  summary: '這是一份服務合約，包含雙方權責與服務條款。',
  entities: ['客戶A公司', '服務提供者'],
  sentiment: 'neutral',
  keyPoints: ['服務期間一年', '月費NT$10,000'],
  actionItems: ['簽署合約', '設定付款方式'],
  confidence: 0.92,
  model: 'claude-3',
  createdAt: '2026-01-16T00:00:00Z',
  documentId: 'doc-1',
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
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

describe('useDocuments Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
    mockWindowOpen.mockClear();
  });

  describe('useDocuments', () => {
    it('fetches documents list', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockDocuments,
        pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
      });

      const { result } = renderHook(
        () => useDocuments(),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/documents', {});
      expect(result.current.data?.data).toHaveLength(2);
    });

    it('fetches documents with search filter', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: [mockDocuments[0]],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });

      const { result } = renderHook(
        () => useDocuments({ search: '合約' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/documents', {
        search: '合約',
      });
    });

    it('fetches documents with type filter', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: [mockDocuments[0]],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });

      const { result } = renderHook(
        () => useDocuments({ type: 'contract' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/documents', {
        type: 'contract',
      });
    });

    it('fetches documents by customer', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: [mockDocuments[0]],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });

      const { result } = renderHook(
        () => useDocuments({ customerId: 'cust-1' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/documents', {
        customerId: 'cust-1',
      });
    });

    it('fetches documents with pagination', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockDocuments,
        pagination: { page: 2, limit: 5, total: 10, totalPages: 2 },
      });

      const { result } = renderHook(
        () => useDocuments({ page: 2, limit: 5 }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/documents', {
        page: '2',
        limit: '5',
      });
    });
  });

  describe('useDocument', () => {
    it('fetches single document with analyses', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: { ...mockDocuments[0], analyses: [mockAnalysis] },
      });

      const { result } = renderHook(
        () => useDocument('doc-1'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/documents/doc-1');
      expect(result.current.data?.data.name).toBe('合約文件.pdf');
      expect(result.current.data?.data.analyses).toHaveLength(1);
    });

    it('does not fetch when id is empty', async () => {
      const { result } = renderHook(
        () => useDocument(''),
        { wrapper: createWrapper() }
      );

      expect(result.current.fetchStatus).toBe('idle');
      expect(apiClient.get).not.toHaveBeenCalled();
    });
  });

  describe('useCreateDocument', () => {
    it('creates a new document', async () => {
      const newDoc = {
        name: '新文件',
        type: 'report',
        content: '文件內容',
      };

      vi.mocked(apiClient.post).mockResolvedValue({
        success: true,
        data: { id: 'doc-new', ...newDoc },
      });

      const { result } = renderHook(
        () => useCreateDocument(),
        { wrapper: createWrapper() }
      );

      result.current.mutate(newDoc);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.post).toHaveBeenCalledWith('/api/documents', newDoc);
    });

    it('creates document with customer association', async () => {
      const newDoc = {
        name: '客戶文件',
        type: 'contract',
        customerId: 'cust-1',
      };

      vi.mocked(apiClient.post).mockResolvedValue({
        success: true,
        data: { id: 'doc-new', ...newDoc },
      });

      const { result } = renderHook(
        () => useCreateDocument(),
        { wrapper: createWrapper() }
      );

      result.current.mutate(newDoc);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.post).toHaveBeenCalledWith('/api/documents', newDoc);
    });
  });

  describe('useUploadDocument', () => {
    it('uploads a document file', async () => {
      const formData = new FormData();
      formData.append('file', new Blob(['test content'], { type: 'text/plain' }), 'test.txt');

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { id: 'doc-uploaded', name: 'test.txt' },
        }),
      });

      const { result } = renderHook(
        () => useUploadDocument(),
        { wrapper: createWrapper() }
      );

      result.current.mutate(formData);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockFetch).toHaveBeenCalledWith('/api/documents', {
        method: 'POST',
        body: formData,
      });
    });

    it('handles upload error', async () => {
      const formData = new FormData();

      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({
          error: { message: '檔案過大' },
        }),
      });

      const { result } = renderHook(
        () => useUploadDocument(),
        { wrapper: createWrapper() }
      );

      result.current.mutate(formData);

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe('檔案過大');
    });

    it('handles upload error without message', async () => {
      const formData = new FormData();

      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({}),
      });

      const { result } = renderHook(
        () => useUploadDocument(),
        { wrapper: createWrapper() }
      );

      result.current.mutate(formData);

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe('上傳失敗');
    });
  });

  describe('useUpdateDocument', () => {
    it('updates an existing document', async () => {
      const updateData = {
        id: 'doc-1',
        name: '更新的合約文件',
        type: 'contract',
      };

      vi.mocked(apiClient.patch).mockResolvedValue({
        success: true,
        data: { ...mockDocuments[0], ...updateData },
      });

      const { result } = renderHook(
        () => useUpdateDocument(),
        { wrapper: createWrapper() }
      );

      result.current.mutate(updateData);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.patch).toHaveBeenCalledWith('/api/documents/doc-1', {
        name: '更新的合約文件',
        type: 'contract',
      });
    });

    it('updates document content', async () => {
      const updateData = {
        id: 'doc-2',
        content: '更新的會議內容',
      };

      vi.mocked(apiClient.patch).mockResolvedValue({
        success: true,
        data: { ...mockDocuments[1], content: '更新的會議內容' },
      });

      const { result } = renderHook(
        () => useUpdateDocument(),
        { wrapper: createWrapper() }
      );

      result.current.mutate(updateData);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.patch).toHaveBeenCalledWith('/api/documents/doc-2', {
        content: '更新的會議內容',
      });
    });
  });

  describe('useDeleteDocument', () => {
    it('deletes a document', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(
        () => useDeleteDocument(),
        { wrapper: createWrapper() }
      );

      result.current.mutate('doc-1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.delete).toHaveBeenCalledWith('/api/documents/doc-1');
    });

    it('handles delete error', async () => {
      vi.mocked(apiClient.delete).mockRejectedValue(new Error('Delete failed'));

      const { result } = renderHook(
        () => useDeleteDocument(),
        { wrapper: createWrapper() }
      );

      result.current.mutate('doc-invalid');

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('useAnalyzeDocument', () => {
    it('triggers document analysis', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        success: true,
        data: { status: 'processing' },
      });

      const { result } = renderHook(
        () => useAnalyzeDocument(),
        { wrapper: createWrapper() }
      );

      result.current.mutate('doc-1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.post).toHaveBeenCalledWith('/api/documents/doc-1/analyze');
    });

    it('handles analysis error', async () => {
      vi.mocked(apiClient.post).mockRejectedValue(new Error('Analysis failed'));

      const { result } = renderHook(
        () => useAnalyzeDocument(),
        { wrapper: createWrapper() }
      );

      result.current.mutate('doc-invalid');

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('useDocumentAnalysis', () => {
    it('fetches document analysis', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockAnalysis,
      });

      const { result } = renderHook(
        () => useDocumentAnalysis('doc-1'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/documents/doc-1/analyze');
      expect(result.current.data?.data.summary).toContain('服務合約');
    });

    it('does not fetch when id is empty', async () => {
      const { result } = renderHook(
        () => useDocumentAnalysis(''),
        { wrapper: createWrapper() }
      );

      expect(result.current.fetchStatus).toBe('idle');
      expect(apiClient.get).not.toHaveBeenCalled();
    });

    it('handles no analysis available', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Not found'));

      const { result } = renderHook(
        () => useDocumentAnalysis('doc-2'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('useDocumentDownload', () => {
    it('downloads a document and opens URL', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: {
          url: 'https://storage.example.com/doc-1.pdf',
          fileName: '合約文件.pdf',
          mimeType: 'application/pdf',
        },
      });

      const { result } = renderHook(
        () => useDocumentDownload(),
        { wrapper: createWrapper() }
      );

      result.current.mutate('doc-1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith('/api/documents/doc-1/download');
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://storage.example.com/doc-1.pdf',
        '_blank'
      );
    });

    it('handles download without URL', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: {
          url: null,
          fileName: 'test.txt',
          mimeType: null,
        },
      });

      const { result } = renderHook(
        () => useDocumentDownload(),
        { wrapper: createWrapper() }
      );

      result.current.mutate('doc-2');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockWindowOpen).not.toHaveBeenCalled();
    });

    it('handles download error', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Download failed'));

      const { result } = renderHook(
        () => useDocumentDownload(),
        { wrapper: createWrapper() }
      );

      result.current.mutate('doc-invalid');

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });
});
