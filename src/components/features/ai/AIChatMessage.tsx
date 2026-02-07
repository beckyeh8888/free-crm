'use client';

/**
 * AIChatMessage - Individual chat message bubble
 * WCAG 2.2 AAA Compliant
 */

import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface AIChatMessageProps {
  readonly role: 'user' | 'assistant' | 'system';
  readonly content: string;
}

export function AIChatMessage({ role, content }: AIChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = role === 'user';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}>
      <div
        className={`
          relative max-w-[85%] rounded-xl px-4 py-2.5 text-sm leading-relaxed
          ${isUser
            ? 'bg-accent-600 text-white'
            : 'bg-background-secondary text-text-primary border border-border'
          }
        `}
      >
        {/* Message content */}
        <div className="whitespace-pre-wrap break-words">
          {content}
        </div>

        {/* Copy button (assistant messages only) */}
        {!isUser && content && (
          <button
            type="button"
            onClick={handleCopy}
            className="
              absolute -right-2 -top-2
              w-7 h-7 flex items-center justify-center rounded-md
              bg-background-tertiary border border-border
              text-text-muted hover:text-text-primary
              opacity-0 group-hover:opacity-100
              transition-opacity
              focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 focus-visible:opacity-100
            "
            aria-label={copied ? '已複製' : '複製訊息'}
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
