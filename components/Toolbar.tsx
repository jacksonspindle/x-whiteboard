'use client';

import { ZoomIn, ZoomOut, Maximize, Home, Type, MousePointer2, Layers, Sparkles } from 'lucide-react';

interface ToolbarProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onFitContent: () => void;
  isTextMode?: boolean;
  onToggleTextMode?: () => void;
  selectedCount?: number;
  onStackSelected?: () => void;
  onAskAI?: () => void;
}

export default function Toolbar({
  scale,
  onZoomIn,
  onZoomOut,
  onResetView,
  onFitContent,
  isTextMode,
  onToggleTextMode,
  selectedCount = 0,
  onStackSelected,
  onAskAI,
}: ToolbarProps) {
  const zoomPercentage = Math.round(scale * 100);

  return (
    <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-xl border border-zinc-200 bg-white/90 p-2 shadow-lg backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/90">
      {/* Tool selection */}
      {onToggleTextMode && (
        <>
          <button
            onClick={onToggleTextMode}
            className={`rounded-lg p-2 transition-colors ${
              !isTextMode
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
            }`}
            title="Select mode (Shift+click to multi-select)"
          >
            <MousePointer2 className="h-5 w-5" />
          </button>

          <button
            onClick={onToggleTextMode}
            className={`rounded-lg p-2 transition-colors ${
              isTextMode
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
            }`}
            title="Add text (click on canvas)"
          >
            <Type className="h-5 w-5" />
          </button>

          <div className="mx-2 h-6 w-px bg-zinc-200 dark:bg-zinc-700" />
        </>
      )}

      {/* Selection actions */}
      {selectedCount >= 1 && (
        <>
          {/* Ask AI button */}
          {onAskAI && (
            <button
              onClick={onAskAI}
              className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-violet-700"
              title="Ask AI about selected items"
            >
              <Sparkles className="h-4 w-4" />
              <span>Ask AI</span>
            </button>
          )}

          {/* Stack button - shows when 2+ items selected */}
          {selectedCount >= 2 && onStackSelected && (
            <button
              onClick={onStackSelected}
              className="flex items-center gap-1.5 rounded-lg bg-blue-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-600"
              title="Stack selected items"
            >
              <Layers className="h-4 w-4" />
              <span>Stack {selectedCount}</span>
            </button>
          )}

          <div className="mx-2 h-6 w-px bg-zinc-200 dark:bg-zinc-700" />
        </>
      )}

      <button
        onClick={onZoomOut}
        className="rounded-lg p-2 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        title="Zoom out"
      >
        <ZoomOut className="h-5 w-5" />
      </button>

      <div className="w-16 text-center text-sm font-medium text-zinc-600 dark:text-zinc-400">
        {zoomPercentage}%
      </div>

      <button
        onClick={onZoomIn}
        className="rounded-lg p-2 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        title="Zoom in"
      >
        <ZoomIn className="h-5 w-5" />
      </button>

      <div className="mx-2 h-6 w-px bg-zinc-200 dark:bg-zinc-700" />

      <button
        onClick={onResetView}
        className="rounded-lg p-2 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        title="Reset view"
      >
        <Home className="h-5 w-5" />
      </button>

      <button
        onClick={onFitContent}
        className="rounded-lg p-2 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        title="Fit content"
      >
        <Maximize className="h-5 w-5" />
      </button>
    </div>
  );
}
