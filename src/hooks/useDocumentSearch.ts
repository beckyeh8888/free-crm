/**
 * Document Semantic Search Hook
 *
 * TanStack Query mutation hook for vector-based document search.
 *
 * ISO 42001 AI Management System
 */

import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/services/api';

// ============================================
// Types
// ============================================

export interface SearchResult {
  readonly documentId: string;
  readonly documentName: string;
  readonly content: string;
  readonly score: number;
}

interface SearchResponse {
  readonly success: boolean;
  readonly data: {
    readonly query: string;
    readonly results: readonly SearchResult[];
    readonly totalResults: number;
  };
}

interface SearchParams {
  readonly query: string;
  readonly customerId?: string;
  readonly topK?: number;
}

// ============================================
// Hook
// ============================================

export function useDocumentSearch() {
  return useMutation({
    mutationFn: async (params: SearchParams): Promise<SearchResponse> => {
      const response = await apiClient.post('/api/documents/search', params);
      return response as SearchResponse;
    },
  });
}
