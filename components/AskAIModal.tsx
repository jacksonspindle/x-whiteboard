'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Sparkles, X, Loader2, Send } from 'lucide-react';

interface AskAIModalProps {
  selectedCount: number;
  onSubmit: (prompt: string) => Promise<void>;
  onClose: () => void;
}

export default function AskAIModal({ selectedCount, onSubmit, onClose }: AskAIModalProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Focus textarea on mount
  useEffect(() => {
    const timeout = setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
    return () => clearTimeout(timeout);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isLoading]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === backdropRef.current && !isLoading) {
      onClose();
    }
  }, [onClose, isLoading]);

  const handleSubmit = useCallback(async () => {
    if (!prompt.trim() || isLoading) return;
    setError(null);
    setIsLoading(true);
    try {
      await onSubmit(prompt.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsLoading(false);
    }
  }, [prompt, isLoading, onSubmit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0)',
        animation: 'askai-backdrop-in 0.2s ease-out forwards',
      }}
    >
      <style>{`
        @keyframes askai-backdrop-in {
          from { background-color: rgba(0, 0, 0, 0); }
          to { background-color: rgba(0, 0, 0, 0.4); }
        }
        @keyframes askai-card-in {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes askai-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      <div
        className="w-full max-w-lg mx-4 rounded-2xl bg-white shadow-2xl overflow-hidden"
        style={{
          animation: 'askai-card-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-100">
              <Sparkles className="h-4.5 w-4.5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900">Ask AI</h2>
              <p className="text-xs text-zinc-500">
                {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Input */}
        <div className="px-6 pb-4">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What would you like to know about these posts?"
            disabled={isLoading}
            rows={3}
            className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition-all duration-150 focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100 disabled:opacity-60"
          />

          {error && (
            <p className="mt-2 text-sm text-red-500">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 pb-5">
          <span className="text-xs text-zinc-400">
            {isLoading ? '' : '⌘ + Enter to submit'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!prompt.trim() || isLoading}
              className="relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-all duration-150 disabled:opacity-50"
              style={{
                background: isLoading
                  ? 'linear-gradient(90deg, #7c3aed, #a855f7, #7c3aed)'
                  : '#7c3aed',
                backgroundSize: isLoading ? '200% 100%' : undefined,
                animation: isLoading ? 'askai-shimmer 1.5s ease-in-out infinite' : undefined,
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Thinking...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Ask</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
