/**
 * AI Settings Hooks - TanStack Query hooks for AI configuration
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api';
import type { AIConfig } from '@/lib/ai/types';

// ============================================
// Types
// ============================================

interface AISettingsResponse {
  readonly success: boolean;
  readonly data: {
    readonly config: AIConfig | null;
    readonly maskedApiKey: string | null;
  };
}

interface TestConnectionResponse {
  readonly success: boolean;
  readonly data: {
    readonly success: boolean;
    readonly model: string;
    readonly provider: string;
    readonly latency: number;
    readonly response: string;
  };
}

// ============================================
// Hooks
// ============================================

/**
 * Get current AI configuration
 */
export function useAIConfig() {
  return useQuery({
    queryKey: ['ai-config'],
    queryFn: () => apiClient.get<AISettingsResponse>('/api/ai/settings'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Update AI configuration
 */
export function useUpdateAIConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      readonly provider: string;
      readonly apiKey: string;
      readonly model?: string;
      readonly ollamaEndpoint?: string;
      readonly features?: {
        readonly chat: boolean;
        readonly document_analysis: boolean;
        readonly email_draft: boolean;
        readonly insights: boolean;
      };
    }) => apiClient.put<AISettingsResponse>('/api/ai/settings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-config'] });
      queryClient.invalidateQueries({ queryKey: ['ai-status'] });
    },
  });
}

/**
 * Test AI connection with provided credentials
 */
export function useTestAIConnection() {
  return useMutation({
    mutationFn: (data: {
      readonly provider: string;
      readonly apiKey: string;
      readonly model?: string;
      readonly ollamaEndpoint?: string;
    }) => apiClient.post<TestConnectionResponse>('/api/ai/settings/test', data),
  });
}

/**
 * Lightweight check if AI is configured (for conditional UI rendering)
 */
export function useAIStatus() {
  const { data, isLoading } = useAIConfig();
  const config = data?.data?.config;

  return {
    isConfigured: !!config?.hasApiKey,
    isLoading,
    config,
  };
}
