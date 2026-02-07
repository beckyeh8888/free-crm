/**
 * AI Feature Hooks
 *
 * Hooks for AI Chat, Email Draft, and Insights features.
 */

'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api';

const chatTransport = new DefaultChatTransport({ api: '/api/ai/chat' });

// ============================================
// AI Chat Hook
// ============================================

/**
 * Extract text content from UIMessage parts array.
 */
export function getMessageText(parts: ReadonlyArray<{ readonly type: string; readonly text?: string }>): string {
  return parts
    .filter((p): p is { readonly type: 'text'; readonly text: string } => p.type === 'text' && typeof p.text === 'string')
    .map((p) => p.text)
    .join('');
}

/**
 * Chat with the CRM AI assistant using streaming responses.
 * Wraps Vercel AI SDK v6's useChat hook.
 */
export function useAIChat() {
  const chat = useChat({
    transport: chatTransport,
  });

  const isLoading = chat.status === 'submitted' || chat.status === 'streaming';

  return {
    messages: chat.messages,
    setMessages: chat.setMessages,
    sendMessage: chat.sendMessage,
    status: chat.status,
    error: chat.error,
    stop: chat.stop,
    isLoading,
  };
}

// ============================================
// Email Draft Hook
// ============================================

interface EmailDraftRequest {
  readonly customerId?: string;
  readonly dealId?: string;
  readonly tone: 'formal' | 'friendly' | 'concise';
  readonly purpose: 'follow_up' | 'outreach' | 'reply' | 'thank_you';
  readonly context?: string;
}

interface EmailDraftResponse {
  readonly success: boolean;
  readonly data: {
    readonly subject: string;
    readonly body: string;
    readonly tone: string;
  };
}

/**
 * Generate an AI-powered email draft.
 */
export function useEmailDraft() {
  return useMutation({
    mutationFn: (data: EmailDraftRequest) =>
      apiClient.post<EmailDraftResponse>('/api/ai/email-draft', data),
  });
}

// ============================================
// AI Insights Hook
// ============================================

interface InsightsResponse {
  readonly success: boolean;
  readonly data: {
    readonly atRiskDeals: readonly {
      readonly dealId: string;
      readonly title: string;
      readonly reason: string;
      readonly suggestedAction: string;
    }[];
    readonly keyInsights: readonly string[];
    readonly summary: string;
  };
}

/**
 * Get AI-powered sales insights. Cached for 1 hour.
 */
export function useAIInsights(enabled = true) {
  return useQuery({
    queryKey: ['ai-insights'],
    queryFn: () => apiClient.get<InsightsResponse>('/api/ai/insights'),
    staleTime: 60 * 60 * 1000, // 1 hour
    enabled,
  });
}
