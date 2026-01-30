'use client';

import { useState, useRef, useEffect } from 'react';
import { TextNote as TextNoteType } from '@/lib/types';
import { Trash2 } from 'lucide-react';

interface TextNoteProps {
  note: TextNoteType;
  onUpdate: (id: string, updates: Partial<TextNoteType>) => void;
  onDelete: (id: string) => void;
  isDragging?: boolean;
  isResizing?: boolean;
  isSelected?: boolean;
  scale: number;
  showPorts?: boolean;
}

export default function TextNote({
  note,
  onUpdate,
  onDelete,
  isDragging,
  isResizing,
  isSelected,
  scale,
  showPorts,
}: TextNoteProps) {
  const [isEditing, setIsEditing] = useState(note.content === '');
  const [localContent, setLocalContent] = useState(note.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setLocalContent(note.content);
  }, [note.content]);

  const handleBlur = () => {
    setIsEditing(false);
    if (localContent !== note.content) {
      onUpdate(note.id, { content: localContent });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
      setLocalContent(note.content);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(note.id);
  };

  return (
    <div
      className={`group relative transition-shadow ${
        isDragging || isResizing ? 'shadow-xl' : 'shadow-sm hover:shadow-md'
      }`}
      style={{
        width: isResizing ? '100%' : note.width,
        height: isResizing ? '100%' : note.height,
        minWidth: 80,
        minHeight: 40,
        outline: isSelected ? '3px solid #3b82f6' : 'none',
        outlineOffset: '2px',
        borderRadius: isSelected ? '10px' : undefined,
      }}
    >
      {/* Main text container */}
      <div
        className="h-full w-full rounded-lg border border-zinc-200 bg-white overflow-hidden"
        style={{
          boxShadow: isDragging
            ? '0 10px 40px rgba(0,0,0,0.15)'
            : '0 1px 3px rgba(0,0,0,0.08)',
        }}
        onDoubleClick={handleDoubleClick}
      >
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={localContent}
            onChange={(e) => setLocalContent(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="h-full w-full resize-none border-none bg-transparent p-3 outline-none"
            style={{
              fontSize: note.font_size,
              color: note.color,
            }}
            placeholder="Type here..."
          />
        ) : (
          <div
            className="h-full w-full p-3 whitespace-pre-wrap overflow-auto cursor-text"
            style={{
              fontSize: note.font_size,
              color: note.color,
            }}
          >
            {localContent || (
              <span className="text-zinc-400 italic">Double-click to edit</span>
            )}
          </div>
        )}
      </div>

      {/* Delete button */}
      <button
        onClick={handleDelete}
        className="absolute -top-2 -right-2 rounded-full bg-white p-1 opacity-0 shadow-md transition-opacity group-hover:opacity-100 hover:bg-red-50"
        style={{ color: '#888' }}
        title="Delete"
      >
        <Trash2 className="h-3.5 w-3.5 hover:text-red-600" />
      </button>

      {/* Resize handle */}
      <div
        className="absolute bottom-0 right-0 h-4 w-4 cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity"
        data-resize-handle="true"
        style={{
          background: 'linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.1) 50%)',
          borderRadius: '0 0 8px 0',
        }}
      />

      {/* Connection ports */}
      {(['top', 'right', 'bottom', 'left'] as const).map((direction) => {
        const portStyles: Record<string, React.CSSProperties> = {
          top: { top: -9, left: '50%', transform: 'translateX(-50%)' },
          right: { top: '50%', right: -9, transform: 'translateY(-50%)' },
          bottom: { bottom: -9, left: '50%', transform: 'translateX(-50%)' },
          left: { top: '50%', left: -9, transform: 'translateY(-50%)' },
        };
        return (
          <div
            key={direction}
            data-connection-port={direction}
            data-element-id={note.id}
            data-element-type="textNote"
            className={`absolute z-30 rounded-full transition-all duration-150 ${
              showPorts
                ? 'opacity-100 scale-100'
                : 'opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100'
            }`}
            style={{
              ...portStyles[direction],
              width: 18,
              height: 18,
              background: '#3b82f6',
              border: '2px solid white',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              cursor: 'crosshair',
            }}
          />
        );
      })}
    </div>
  );
}
