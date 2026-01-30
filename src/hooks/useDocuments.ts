/**
 * Document hooks - TanStack Query hooks for document CRUD
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api';

export interface Document {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly content: string | null;
  readonly filePath: string | null;
  readonly fileSize: number | null;
  readonly mimeType: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly organizationId: string;
  readonly customerId: string | null;
  readonly customer?: {
    readonly id: string;
    readonly name: string;
  } | null;
  readonly _count?: {
    readonly analyses: number;
  };
}

export interface DocumentAnalysis {
  readonly id: string;
  readonly summary: string | null;
  readonly entities: unknown;
  readonly sentiment: string | null;
  readonly keyPoints: unknown;
  readonly actionItems: unknown;
  readonly confidence: number | null;
  readonly model: string | null;
  readonly createdAt: string;
  readonly documentId: string;
}

interface DocumentListResponse {
  readonly success: boolean;
  readonly data: readonly Document[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly totalPages: number;
  };
}

interface DocumentDetailResponse {
  readonly success: boolean;
  readonly data: Document & {
    readonly analyses: readonly DocumentAnalysis[];
  };
}

interface DocumentResponse {
  readonly success: boolean;
  readonly data: Document;
}

interface AnalysisResponse {
  readonly success: boolean;
  readonly data: DocumentAnalysis;
}

interface DownloadResponse {
  readonly success: boolean;
  readonly data: {
    readonly url: string;
    readonly fileName: string;
    readonly mimeType: string | null;
  };
}

interface DocumentParams {
  readonly page?: number;
  readonly limit?: number;
  readonly search?: string;
  readonly type?: string;
  readonly customerId?: string;
}

export function useDocuments(params: DocumentParams = {}) {
  const queryParams: Record<string, string> = {};
  if (params.page) queryParams.page = String(params.page);
  if (params.limit) queryParams.limit = String(params.limit);
  if (params.search) queryParams.search = params.search;
  if (params.type) queryParams.type = params.type;
  if (params.customerId) queryParams.customerId = params.customerId;

  return useQuery({
    queryKey: ['documents', params],
    queryFn: () => apiClient.get<DocumentListResponse>('/api/documents', queryParams),
  });
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: ['documents', id],
    queryFn: () => apiClient.get<DocumentDetailResponse>(`/api/documents/${id}`),
    enabled: !!id,
  });
}

export function useCreateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Document>) =>
      apiClient.post<DocumentResponse>('/api/documents', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error?.message || '上傳失敗');
      }
      return response.json() as Promise<DocumentResponse>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Document> & { readonly id: string }) =>
      apiClient.patch<DocumentResponse>(`/api/documents/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['documents', variables.id] });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<{ readonly success: boolean }>(`/api/documents/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useAnalyzeDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<{ readonly success: boolean; readonly data: { readonly status: string } }>(
        `/api/documents/${id}/analyze`
      ),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['documents', id] });
      queryClient.invalidateQueries({ queryKey: ['document-analysis', id] });
    },
  });
}

export function useDocumentAnalysis(id: string) {
  return useQuery({
    queryKey: ['document-analysis', id],
    queryFn: () => apiClient.get<AnalysisResponse>(`/api/documents/${id}/analyze`),
    enabled: !!id,
    retry: false,
  });
}

export function useDocumentDownload() {
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await apiClient.get<DownloadResponse>(`/api/documents/${id}/download`);
      // Open download URL in new tab
      if (result?.data?.url) {
        window.open(result.data.url, '_blank');
      }
      return result;
    },
  });
}
