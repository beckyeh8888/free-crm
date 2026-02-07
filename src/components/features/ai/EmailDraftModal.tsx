'use client';

/**
 * EmailDraftModal - AI-powered email draft generation
 * WCAG 2.2 AAA Compliant
 *
 * Modal for generating contextual email drafts with AI.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { X, Copy, RefreshCw, Loader2, Mail, Check } from 'lucide-react';
import { useEmailDraft } from '@/hooks/useAI';

interface EmailDraftModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly customerId?: string;
  readonly dealId?: string;
  readonly customerName?: string;
  readonly defaultPurpose?: 'follow_up' | 'outreach' | 'reply' | 'thank_you';
}

const PURPOSE_OPTIONS = [
  { value: 'follow_up', label: '跟進客戶' },
  { value: 'outreach', label: '首次開發' },
  { value: 'reply', label: '回覆客戶' },
  { value: 'thank_you', label: '感謝信' },
] as const;

const TONE_OPTIONS = [
  { value: 'formal', label: '正式' },
  { value: 'friendly', label: '親切' },
  { value: 'concise', label: '簡潔' },
] as const;

export function EmailDraftModal({
  isOpen,
  onClose,
  customerId,
  dealId,
  customerName,
  defaultPurpose = 'follow_up',
}: EmailDraftModalProps) {
  const [purpose, setPurpose] = useState<'follow_up' | 'outreach' | 'reply' | 'thank_you'>(defaultPurpose);
  const [tone, setTone] = useState<'formal' | 'friendly' | 'concise'>('formal');
  const [context, setContext] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [copied, setCopied] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const { mutate: generateDraft, isPending } = useEmailDraft();

  // Reset state when modal opens — legitimate reset pattern for modal visibility toggle
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isOpen) {
      setPurpose(defaultPurpose);
      setTone('formal');
      setContext('');
      setSubject('');
      setBody('');
      setCopied(false);
    }
  }, [isOpen, defaultPurpose]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleGenerate = useCallback(() => {
    generateDraft(
      { customerId, dealId, tone, purpose, context: context || undefined },
      {
        onSuccess: (result) => {
          const data = (result as { data?: { subject?: string; body?: string } })?.data;
          if (data) {
            setSubject(data.subject || '');
            setBody(data.body || '');
          }
        },
      }
    );
  }, [generateDraft, customerId, dealId, tone, purpose, context]);

  const handleCopy = useCallback(async () => {
    const fullEmail = `主旨：${subject}\n\n${body}`;
    await navigator.clipboard.writeText(fullEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [subject, body]);

  if (!isOpen) return null;

  const hasResult = subject || body;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <dialog
        ref={dialogRef}
        open
        className="relative w-full max-w-lg bg-background-tertiary border border-border rounded-xl shadow-xl p-0 overflow-hidden"
        aria-label="AI Email 草稿生成"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-accent-500" aria-hidden="true" />
            <h2 className="text-base font-semibold text-text-primary">
              AI Email 草稿
              {customerName && (
                <span className="text-sm font-normal text-text-muted ml-2">— {customerName}</span>
              )}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="
              w-8 h-8 flex items-center justify-center rounded-md
              text-text-muted hover:text-text-secondary hover:bg-background-hover
              transition-colors
              focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600
            "
            aria-label="關閉"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Purpose Selection */}
          <fieldset>
            <legend className="block text-xs font-medium text-text-secondary mb-1.5">
              用途
            </legend>
            <div className="flex flex-wrap gap-2">
              {PURPOSE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPurpose(opt.value)}
                  className={`
                    px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600
                    ${purpose === opt.value
                      ? 'bg-accent-600 text-white'
                      : 'bg-background-secondary text-text-secondary border border-border hover:bg-background-hover'
                    }
                  `}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Tone Selection */}
          <fieldset>
            <legend className="block text-xs font-medium text-text-secondary mb-1.5">
              語氣
            </legend>
            <div className="flex gap-2">
              {TONE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTone(opt.value)}
                  className={`
                    px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600
                    ${tone === opt.value
                      ? 'bg-accent-600 text-white'
                      : 'bg-background-secondary text-text-secondary border border-border hover:bg-background-hover'
                    }
                  `}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Additional Context */}
          <div>
            <label
              htmlFor="email-context"
              className="block text-xs font-medium text-text-secondary mb-1.5"
            >
              補充說明（選填）
            </label>
            <textarea
              id="email-context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="例如：上次會議討論了報價方案..."
              rows={2}
              maxLength={5000}
              className="
                w-full px-3 py-2 rounded-lg text-sm
                bg-background-secondary text-text-primary border border-border
                placeholder:text-text-muted resize-none
                focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600
              "
            />
          </div>

          {/* Generate Button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isPending}
            className="
              w-full px-4 py-2.5 rounded-lg text-sm font-medium min-h-[44px]
              bg-accent-600 text-white
              hover:bg-accent-500
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
              focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 focus-visible:ring-offset-2 focus-visible:ring-offset-background-tertiary
              flex items-center justify-center gap-2
            "
          >
            {isPending && (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                生成中...
              </>
            )}
            {!isPending && hasResult && (
              <>
                <RefreshCw className="w-4 h-4" />
                重新生成
              </>
            )}
            {!isPending && !hasResult && '生成 Email 草稿'}
          </button>

          {/* Generated Result */}
          {hasResult && (
            <div className="space-y-3 pt-2 border-t border-border">
              {/* Subject */}
              <div>
                <label
                  htmlFor="email-subject"
                  className="block text-xs font-medium text-text-secondary mb-1.5"
                >
                  主旨
                </label>
                <input
                  id="email-subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="
                    w-full px-3 py-2 rounded-lg text-sm
                    bg-background-secondary text-text-primary border border-border
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600
                  "
                />
              </div>

              {/* Body */}
              <div>
                <label
                  htmlFor="email-body"
                  className="block text-xs font-medium text-text-secondary mb-1.5"
                >
                  內容
                </label>
                <textarea
                  id="email-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={8}
                  className="
                    w-full px-3 py-2 rounded-lg text-sm
                    bg-background-secondary text-text-primary border border-border
                    resize-y
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600
                  "
                />
              </div>

              {/* Copy Button */}
              <button
                type="button"
                onClick={handleCopy}
                className="
                  w-full px-4 py-2.5 rounded-lg text-sm font-medium min-h-[44px]
                  bg-background-secondary text-text-primary border border-border
                  hover:bg-background-hover
                  transition-colors
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600
                  flex items-center justify-center gap-2
                "
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-success" />
                    已複製
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    複製全部
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </dialog>
    </div>
  );
}
