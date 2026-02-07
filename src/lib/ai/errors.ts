/**
 * AI Error Handling
 *
 * Maps provider-specific errors to user-friendly messages in Traditional Chinese.
 *
 * ISO 27001 A.12.4.1 (Event Logging)
 */

// ============================================
// Custom Error Classes
// ============================================

export class AINotConfiguredError extends Error {
  constructor() {
    super('AI 尚未設定。請到設定頁面配置 AI 供應商和 API 金鑰。');
    this.name = 'AINotConfiguredError';
  }
}

export class AIProviderError extends Error {
  readonly statusCode: number;
  readonly providerMessage: string;

  constructor(statusCode: number, providerMessage: string) {
    const userMessage = mapProviderError(statusCode, providerMessage);
    super(userMessage);
    this.name = 'AIProviderError';
    this.statusCode = statusCode;
    this.providerMessage = providerMessage;
  }
}

export class AIRateLimitError extends Error {
  constructor() {
    super('AI 請求過於頻繁，請稍後再試。');
    this.name = 'AIRateLimitError';
  }
}

export class AIFeatureDisabledError extends Error {
  constructor(feature: string) {
    super(`AI 功能「${feature}」已停用。請聯繫管理員啟用此功能。`);
    this.name = 'AIFeatureDisabledError';
  }
}

// ============================================
// Error Mapping
// ============================================

function mapProviderError(statusCode: number, message: string): string {
  if (statusCode === 401 || statusCode === 403) {
    return 'API 金鑰無效或已過期。請到設定頁面檢查 AI 設定。';
  }
  if (statusCode === 429) {
    return 'AI 供應商速率限制已達上限。請稍後再試，或升級您的 API 方案。';
  }
  if (statusCode === 400 && message.includes('model')) {
    return '所選模型不可用。請到設定頁面更換模型。';
  }
  if (statusCode === 400) {
    return 'AI 請求格式錯誤。請重試或聯繫管理員。';
  }
  if (statusCode === 500 || statusCode === 502 || statusCode === 503) {
    return 'AI 供應商暫時無法使用。請稍後再試。';
  }
  return `AI 服務發生錯誤 (${statusCode})。請稍後再試。`;
}

/**
 * Handle any AI-related error and return a user-friendly response
 */
export function handleAIError(error: unknown): { code: string; message: string } {
  if (error instanceof AINotConfiguredError) {
    return { code: 'AI_NOT_CONFIGURED', message: error.message };
  }
  if (error instanceof AIProviderError) {
    return { code: 'AI_PROVIDER_ERROR', message: error.message };
  }
  if (error instanceof AIRateLimitError) {
    return { code: 'AI_RATE_LIMITED', message: error.message };
  }
  if (error instanceof AIFeatureDisabledError) {
    return { code: 'AI_FEATURE_DISABLED', message: error.message };
  }

  // Unknown errors
  const message = error instanceof Error ? error.message : String(error);

  // Check for common provider error patterns
  if (message.includes('API key') || message.includes('api_key') || message.includes('authentication')) {
    return { code: 'AI_PROVIDER_ERROR', message: 'API 金鑰無效或已過期。請到設定頁面檢查 AI 設定。' };
  }
  if (message.includes('rate limit') || message.includes('quota')) {
    return { code: 'AI_RATE_LIMITED', message: 'AI 供應商速率限制已達上限。請稍後再試。' };
  }
  if (message.includes('ECONNREFUSED') || message.includes('fetch failed')) {
    return { code: 'AI_CONNECTION_ERROR', message: 'AI 服務連線失敗。請檢查網路連線或 Ollama 是否已啟動。' };
  }

  return { code: 'AI_ERROR', message: 'AI 服務發生錯誤。請稍後再試。' };
}
