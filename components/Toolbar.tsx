'use client';

import { ZoomIn, ZoomOut, Maximize, Home } from 'lucide-react';

interface ToolbarProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onFitContent: () => void;
}

export default function Toolbar({
  scale,
  onZoomIn,
  onZoomOut,
  onResetView,
  onFitContent,
}: ToolbarProps) {
  const zoomPercentage = Math.round(scale * 100);

  return (
    <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-xl border border-zinc-200 bg-white/90 p-2 shadow-lg backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/90">
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
