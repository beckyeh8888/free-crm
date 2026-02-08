'use client';

/**
 * AISettingsSection - AI provider configuration for BYOK model
 * WCAG 2.2 AAA Compliant
 *
 * Allows organization admins to configure their own LLM API keys.
 * Fetches available models dynamically from provider APIs.
 */

import { useState, useEffect, useCallback } from 'react';
import { Sparkles, Check, AlertCircle, Loader2, Eye, EyeOff, RefreshCw, Database } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/services/api';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import {
  useAIConfig,
  useUpdateAIConfig,
  useTestAIConnection,
  useAIModels,
} from '@/hooks/useAISettings';
import { AI_PROVIDERS, DEFAULT_MODELS, AI_FEATURES, EMBEDDING_CAPABLE_PROVIDERS, DEFAULT_EMBEDDING_MODELS } from '@/lib/ai/types';
import type { AIProvider, AIFeature } from '@/lib/ai/types';

interface DynamicModel {
  readonly id: string;
  readonly name: string;
}

export function AISettingsSection() {
  const { data, isLoading } = useAIConfig();
  const updateMutation = useUpdateAIConfig();
  const testMutation = useTestAIConnection();
  const modelsMutation = useAIModels();
  const reindexMutation = useMutation({
    mutationFn: () => apiClient.post<{ readonly success: boolean; readonly data: { readonly reindexed: number; readonly message: string } }>('/api/documents/reindex', {}),
  });

  // Form state
  const [provider, setProvider] = useState<AIProvider>('openai');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [ollamaEndpoint, setOllamaEndpoint] = useState('http://localhost:11434');
  const [showKey, setShowKey] = useState(false);
  const [features, setFeatures] = useState<Record<AIFeature, boolean>>({
    chat: true,
    document_analysis: true,
    email_draft: true,
    insights: true,
    rag: false,
  });

  // Embedding state
  const [embeddingProvider, setEmbeddingProvider] = useState<AIProvider | ''>('');
  const [embeddingModel, setEmbeddingModel] = useState('');

  // Dynamic models
  const [dynamicModels, setDynamicModels] = useState<DynamicModel[]>([]);

  // Sync from API response — setState in effect is legitimate for initial data hydration
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (data?.data?.config) {
      const config = data.data.config;
      setProvider(config.provider);
      setModel(config.model);
      const defaultFeatures = { chat: true, document_analysis: true, email_draft: true, insights: true, rag: false };
      setFeatures({ ...defaultFeatures, ...config.features });
      if (config.ollamaEndpoint) {
        setOllamaEndpoint(config.ollamaEndpoint);
      }
      if (config.embeddingProvider) {
        setEmbeddingProvider(config.embeddingProvider);
      }
      if (config.embeddingModel) {
        setEmbeddingModel(config.embeddingModel);
      }
    }
  }, [data]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleFetchModels = useCallback(() => {
    const key = apiKey || '__USE_STORED__';
    const hasKey = apiKey || data?.data?.config?.hasApiKey;
    if (!hasKey) return;

    modelsMutation.mutate(
      {
        provider,
        apiKey: key,
        ollamaEndpoint: provider === 'ollama' ? ollamaEndpoint : undefined,
      },
      {
        onSuccess: (response) => {
          const models = response?.data?.models;
          if (models && Array.isArray(models)) {
            setDynamicModels(models as DynamicModel[]);
          }
        },
      }
    );
  }, [apiKey, provider, ollamaEndpoint, data?.data?.config?.hasApiKey, modelsMutation]);

  const handleSave = () => {
    if (!apiKey && !data?.data?.config?.hasApiKey) return;

    updateMutation.mutate({
      provider,
      apiKey: apiKey || '__KEEP_EXISTING__',
      model: model || undefined,
      ollamaEndpoint: provider === 'ollama' ? ollamaEndpoint : undefined,
      features,
      embeddingProvider: embeddingProvider || undefined,
      embeddingModel: embeddingModel || undefined,
    });
  };

  const handleTestConnection = () => {
    if (!apiKey && !data?.data?.config?.hasApiKey) return;

    testMutation.mutate({
      provider,
      apiKey: apiKey || '__USE_STORED__',
      model: model || undefined,
      ollamaEndpoint: provider === 'ollama' ? ollamaEndpoint : undefined,
    });
  };

  const toggleFeature = (feature: AIFeature) => {
    setFeatures((prev) => ({ ...prev, [feature]: !prev[feature] }));
  };

  // Use dynamic models if available, otherwise fall back to defaults
  const fallbackModels = DEFAULT_MODELS[provider] || [];
  const hasExistingKey = !!data?.data?.config?.hasApiKey;
  const maskedKey = data?.data?.maskedApiKey;
  const canFetchModels = apiKey || hasExistingKey;

  if (isLoading) {
    return (
      <section className="bg-background-tertiary border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-accent-500" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-text-primary">AI 設定</h2>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-background-secondary rounded" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="bg-background-tertiary border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-accent-500" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-text-primary">AI 設定</h2>
      </div>

      <p className="text-xs text-text-muted mb-4">
        設定您的 AI 供應商和 API 金鑰以啟用 AI 功能。您的 API 金鑰會加密儲存。
      </p>

      <div className="space-y-4">
        {/* Provider Selection */}
        <div>
          <label htmlFor="ai-provider" className="block text-xs font-medium text-text-secondary mb-1.5">
            AI 供應商
          </label>
          <select
            id="ai-provider"
            value={provider}
            onChange={(e) => {
              const newProvider = e.target.value as AIProvider;
              setProvider(newProvider);
              setModel('');
              setDynamicModels([]);
            }}
            className="
              w-full h-10 px-3 rounded-lg text-sm
              bg-background-secondary text-text-primary border border-border
              focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 focus-visible:ring-offset-2 focus-visible:ring-offset-background-tertiary
            "
          >
            {AI_PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        {/* API Key */}
        <div>
          <label htmlFor="ai-api-key" className="block text-xs font-medium text-text-secondary mb-1.5">
            API 金鑰
            {hasExistingKey && (
              <span className="ml-2 text-text-muted">（目前：{maskedKey}）</span>
            )}
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                id="ai-api-key"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={hasExistingKey ? '輸入新金鑰以更換（留空保留現有）' : '輸入您的 API 金鑰'}
                className="
                  w-full h-10 pl-3 pr-10 rounded-lg text-sm
                  bg-background-secondary text-text-primary border border-border
                  placeholder:text-text-muted
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 focus-visible:ring-offset-2 focus-visible:ring-offset-background-tertiary
                "
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="
                  absolute right-2 top-1/2 -translate-y-1/2
                  w-8 h-8 flex items-center justify-center rounded
                  text-text-muted hover:text-text-secondary
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600
                "
                aria-label={showKey ? '隱藏金鑰' : '顯示金鑰'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testMutation.isPending || (!apiKey && !hasExistingKey)}
              className="
                h-10 px-4 rounded-lg text-xs font-medium whitespace-nowrap
                bg-background-secondary text-text-secondary border border-border
                hover:bg-background-hover hover:text-text-primary
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors min-w-[100px]
                focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 focus-visible:ring-offset-2 focus-visible:ring-offset-background-tertiary
              "
              aria-label="測試 AI 連線"
            >
              {testMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              ) : '測試連線'}
            </button>
          </div>

          {/* Test result */}
          {testMutation.isSuccess && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-green-400">
              <Check className="w-3.5 h-3.5" aria-hidden="true" />
              連線成功（{testMutation.data?.data?.latency}ms）
            </div>
          )}
          {testMutation.isError && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-error">
              <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
              {(testMutation.error as Error)?.message || '連線失敗'}
            </div>
          )}
        </div>

        {/* Ollama Endpoint (before model selection so models can use the endpoint) */}
        {provider === 'ollama' && (
          <div>
            <label htmlFor="ai-ollama-endpoint" className="block text-xs font-medium text-text-secondary mb-1.5">
              Ollama 端點 URL
            </label>
            <input
              id="ai-ollama-endpoint"
              type="url"
              value={ollamaEndpoint}
              onChange={(e) => setOllamaEndpoint(e.target.value)}
              placeholder="http://localhost:11434"
              className="
                w-full h-10 px-3 rounded-lg text-sm
                bg-background-secondary text-text-primary border border-border
                placeholder:text-text-muted
                focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 focus-visible:ring-offset-2 focus-visible:ring-offset-background-tertiary
              "
            />
          </div>
        )}

        {/* Model Selection */}
        <div>
          <label htmlFor="ai-model" className="block text-xs font-medium text-text-secondary mb-1.5">
            模型
          </label>
          <div className="flex gap-2">
            <select
              id="ai-model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="
                flex-1 h-10 px-3 rounded-lg text-sm
                bg-background-secondary text-text-primary border border-border
                focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 focus-visible:ring-offset-2 focus-visible:ring-offset-background-tertiary
              "
            >
              <option value="">預設模型</option>

              {/* Dynamic models from API */}
              {dynamicModels.length > 0 && (
                <optgroup label="從 API 取得的模型">
                  {dynamicModels.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </optgroup>
              )}

              {/* Fallback default models */}
              {dynamicModels.length === 0 && fallbackModels.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleFetchModels}
              disabled={modelsMutation.isPending || !canFetchModels}
              className="
                h-10 px-3 rounded-lg text-xs font-medium whitespace-nowrap
                bg-background-secondary text-text-secondary border border-border
                hover:bg-background-hover hover:text-text-primary
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors
                focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 focus-visible:ring-offset-2 focus-visible:ring-offset-background-tertiary
              "
              aria-label="從 API 取得可用模型列表"
            >
              {modelsMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Models fetch result */}
          {dynamicModels.length > 0 && (
            <p className="mt-1.5 text-xs text-text-muted">
              已取得 {dynamicModels.length} 個可用模型
            </p>
          )}
          {modelsMutation.isError && (
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-error">
              <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
              {(modelsMutation.error as Error)?.message || '取得模型列表失敗'}
            </div>
          )}
        </div>

        {/* Feature Toggles */}
        <div>
          <h3 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">
            功能開關
          </h3>
          <div className="space-y-0 divide-y divide-border-subtle">
            {AI_FEATURES.map((feature) => (
              <div key={feature.value} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm text-text-primary">{feature.label}</p>
                  <p className="text-xs text-text-muted">{feature.description}</p>
                </div>
                <ToggleSwitch
                  enabled={features[feature.value]}
                  onToggle={() => toggleFeature(feature.value)}
                  aria-label={`${feature.label}開關`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Embedding Configuration */}
        {features.rag && (
          <div className="border-t border-border-subtle pt-4">
            <h3 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-3">
              Embedding 設定（RAG 向量索引）
            </h3>
            <p className="text-xs text-text-muted mb-3">
              設定 Embedding 供應商以啟用語意搜尋和 RAG 文件檢索。留空則使用主 AI 供應商（Anthropic 不支援 Embedding）。
            </p>
            <div className="space-y-3">
              {/* Embedding Provider */}
              <div>
                <label htmlFor="embedding-provider" className="block text-xs font-medium text-text-secondary mb-1.5">
                  Embedding 供應商
                </label>
                <select
                  id="embedding-provider"
                  value={embeddingProvider}
                  onChange={(e) => {
                    const val = e.target.value as AIProvider | '';
                    setEmbeddingProvider(val);
                    setEmbeddingModel('');
                  }}
                  className="
                    w-full h-10 px-3 rounded-lg text-sm
                    bg-background-secondary text-text-primary border border-border
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 focus-visible:ring-offset-2 focus-visible:ring-offset-background-tertiary
                  "
                >
                  <option value="">跟隨主供應商</option>
                  {AI_PROVIDERS.filter((p) => EMBEDDING_CAPABLE_PROVIDERS.has(p.value)).map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              {/* Embedding Model */}
              <div>
                <label htmlFor="embedding-model" className="block text-xs font-medium text-text-secondary mb-1.5">
                  Embedding 模型
                </label>
                <select
                  id="embedding-model"
                  value={embeddingModel}
                  onChange={(e) => setEmbeddingModel(e.target.value)}
                  className="
                    w-full h-10 px-3 rounded-lg text-sm
                    bg-background-secondary text-text-primary border border-border
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 focus-visible:ring-offset-2 focus-visible:ring-offset-background-tertiary
                  "
                >
                  <option value="">預設模型</option>
                  {(() => {
                    const effectiveProvider = embeddingProvider || provider;
                    const models = DEFAULT_EMBEDDING_MODELS[effectiveProvider] || [];
                    return models.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ));
                  })()}
                </select>
              </div>

              {/* Warning for Anthropic */}
              {!embeddingProvider && !EMBEDDING_CAPABLE_PROVIDERS.has(provider) && (
                <div className="flex items-center gap-1.5 text-xs text-amber-400">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{provider === 'anthropic' ? 'Anthropic' : provider} 不支援 Embedding。請選擇獨立的 Embedding 供應商（OpenAI / Google / Ollama）。</span>
                </div>
              )}

              {/* Embedding Stats */}
              <EmbeddingStatsBar stats={data?.data?.embeddingStats} />

              {/* Re-index button */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => reindexMutation.mutate()}
                  disabled={reindexMutation.isPending}
                  className="
                    h-9 px-4 rounded-lg text-xs font-medium
                    bg-background-secondary text-text-secondary border border-border
                    hover:bg-background-hover hover:text-text-primary
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-colors inline-flex items-center gap-1.5
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 focus-visible:ring-offset-2 focus-visible:ring-offset-background-tertiary
                  "
                  aria-label="重新索引所有文件"
                >
                  {reindexMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Database className="w-3.5 h-3.5" />
                  )}
                  重新索引所有文件
                </button>
                {reindexMutation.isSuccess && (
                  <span className="text-xs text-green-400">
                    {(reindexMutation.data as { data?: { message?: string } })?.data?.message ?? '已排隊'}
                  </span>
                )}
                {reindexMutation.isError && (
                  <span className="text-xs text-error">
                    {(reindexMutation.error as Error)?.message ?? '重新索引失敗'}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={updateMutation.isPending || (!apiKey && !hasExistingKey)}
            className="
              h-10 px-6 rounded-lg text-sm font-medium
              bg-accent-600 text-white
              hover:bg-accent-500
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
              focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 focus-visible:ring-offset-2 focus-visible:ring-offset-background-tertiary
            "
            aria-label="儲存 AI 設定"
          >
            {updateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
            ) : '儲存設定'}
          </button>

          {updateMutation.isSuccess && (
            <span className="ml-3 text-xs text-green-400">已儲存</span>
          )}
          {updateMutation.isError && (
            <span className="ml-3 text-xs text-error">儲存失敗</span>
          )}
        </div>
      </div>
    </section>
  );
}

// ============================================
// Embedding Stats Sub-component
// ============================================

interface EmbeddingStats {
  readonly totalDocs: number;
  readonly embeddedDocs: number;
  readonly totalChunks: number;
  readonly embeddedChunks: number;
}

function EmbeddingStatsBar({ stats }: { readonly stats?: EmbeddingStats | unknown }) {
  if (!stats || typeof stats !== 'object') return null;

  const s = stats as EmbeddingStats;
  if (s.totalDocs === 0 && s.totalChunks === 0) return null;

  const pct = s.totalDocs > 0 ? Math.round((s.embeddedDocs / s.totalDocs) * 100) : 0;

  return (
    <div className="bg-background-secondary rounded-lg p-3">
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-muted">索引狀態</span>
        <span className="text-text-secondary font-medium">
          {s.embeddedDocs} / {s.totalDocs} 文件已索引
        </span>
      </div>
      <div className="mt-1.5 h-1.5 bg-background rounded-full overflow-hidden">
        <div
          className="h-full bg-accent-600 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-text-muted">
        {s.embeddedChunks} / {s.totalChunks} 區塊已嵌入
      </p>
    </div>
  );
}
