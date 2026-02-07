'use client';

/**
 * AIChatPanel - AI Chat sidebar panel
 * WCAG 2.2 AAA Compliant
 *
 * Right-side slide-in panel for conversational AI assistant.
 * Uses Vercel AI SDK v6 useChat with parts-based UIMessage.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, Sparkles, Loader2, Trash2 } from 'lucide-react';
import { useAIChat, getMessageText } from '@/hooks/useAI';
import { AIChatMessage } from './AIChatMessage';

interface AIChatPanelProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

const SUGGESTED_QUESTIONS = [
  '本月即將到期的商機有哪些？',
  '哪些客戶最近沒有互動？',
  '目前商機管道的整體狀況如何？',
  '有哪些逾期的任務？',
];

export function AIChatPanel({ isOpen, onClose }: AIChatPanelProps) {
  const { messages, sendMessage, isLoading, setMessages } = useAIChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

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

  const handleSend = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setInput('');
    sendMessage({ text: trimmed });
  }, [sendMessage]);

  const handleSuggestedQuestion = useCallback((question: string) => {
    handleSend(question);
  }, [handleSend]);

  const handleClearChat = useCallback(() => {
    setMessages([]);
  }, [setMessages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSend(input);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-label="AI 助手"
        aria-modal="true"
        className={`
          fixed right-0 top-0 h-full w-full sm:w-96
          bg-background-tertiary border-l border-border
          shadow-2xl z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent-500" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-text-primary">AI 助手</h2>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={handleClearChat}
                className="
                  w-8 h-8 flex items-center justify-center rounded-md
                  text-text-muted hover:text-text-secondary hover:bg-background-hover
                  transition-colors
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600
                "
                aria-label="清除對話"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="
                w-8 h-8 flex items-center justify-center rounded-md
                text-text-muted hover:text-text-secondary hover:bg-background-hover
                transition-colors
                focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600
              "
              aria-label="關閉 AI 助手"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" role="log" aria-label="對話訊息">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <Sparkles className="w-8 h-8 text-text-muted mx-auto mb-3" aria-hidden="true" />
              <p className="text-sm text-text-muted mb-4">有什麼我可以幫你的嗎？</p>

              {/* Suggested questions */}
              <div className="space-y-2">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleSuggestedQuestion(q)}
                    className="
                      w-full text-left px-3 py-2 rounded-lg text-xs
                      bg-background-secondary text-text-secondary
                      hover:bg-background-hover hover:text-text-primary
                      border border-border
                      transition-colors
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600
                    "
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <AIChatMessage
              key={message.id}
              role={message.role as 'user' | 'assistant'}
              content={getMessageText(message.parts)}
            />
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-background-secondary rounded-xl px-4 py-2.5 border border-border">
                <Loader2 className="w-4 h-4 animate-spin text-accent-500" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={handleFormSubmit}
          className="flex-shrink-0 px-4 py-3 border-t border-border"
        >
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="詢問 AI 助手..."
              rows={1}
              className="
                flex-1 resize-none h-10 max-h-24 px-3 py-2 rounded-lg text-sm
                bg-background-secondary text-text-primary border border-border
                placeholder:text-text-muted
                focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 focus-visible:ring-offset-2 focus-visible:ring-offset-background-tertiary
              "
              aria-label="輸入訊息"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="
                w-10 h-10 flex items-center justify-center rounded-lg
                bg-accent-600 text-white
                hover:bg-accent-500
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors
                focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 focus-visible:ring-offset-2 focus-visible:ring-offset-background-tertiary
              "
              aria-label="送出訊息"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
