/**
 * AI Integration Type Definitions
 *
 * BYOK (Bring Your Own Key) model — organizations configure their own LLM API keys.
 *
 * ISO 42001 AI Management System
 */

// ============================================
// Provider & Feature Types
// ============================================

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'ollama';

export type AIFeature = 'chat' | 'document_analysis' | 'email_draft' | 'insights';

export const AI_PROVIDERS: readonly { readonly value: AIProvider; readonly label: string }[] = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'google', label: 'Google Gemini' },
  { value: 'ollama', label: 'Ollama (本地)' },
] as const;

export const AI_FEATURES: readonly { readonly value: AIFeature; readonly label: string; readonly description: string }[] = [
  { value: 'chat', label: 'AI 對話助手', description: '在 CRM 內與 AI 對話，查詢資料、取得建議' },
  { value: 'document_analysis', label: '文件智能分析', description: '自動分析合約、會議紀錄、報價單等文件' },
  { value: 'email_draft', label: 'Email 草稿生成', description: '根據客戶/商機上下文自動產生 Email 草稿' },
  { value: 'insights', label: '銷售洞察', description: '分析商機管道，識別風險商機並建議行動' },
] as const;

// ============================================
// Default Models per Provider
// ============================================

export const DEFAULT_MODELS: Record<AIProvider, readonly { readonly value: string; readonly label: string }[]> = {
  openai: [
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  ],
  anthropic: [
    { value: 'claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5' },
    { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
  ],
  google: [
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  ],
  ollama: [
    { value: 'llama3.2', label: 'Llama 3.2' },
    { value: 'qwen2.5', label: 'Qwen 2.5' },
    { value: 'mistral', label: 'Mistral' },
  ],
};

// ============================================
// Configuration Interface
// ============================================

export interface AIConfig {
  readonly provider: AIProvider;
  readonly model: string;
  readonly features: Record<AIFeature, boolean>;
  readonly ollamaEndpoint?: string;
  readonly hasApiKey: boolean; // never expose the actual key to client
}

// SystemSetting keys used for AI configuration
export const AI_SETTING_KEYS = {
  PROVIDER: 'ai_provider',
  API_KEY: 'ai_api_key',
  MODEL: 'ai_model',
  OLLAMA_ENDPOINT: 'ai_ollama_endpoint',
  FEATURES: 'ai_features',
} as const;
