'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Post, TextNote as TextNoteType, Connection, PortDirection } from '@/lib/types';
import PostCard from './PostCard';
import TextNote from './TextNote';
import Toolbar from './Toolbar';
import ConnectionLayer from './ConnectionLayer';
import AskAIModal from './AskAIModal';

interface WhiteboardProps {
  posts: Post[];
  onUpdatePosition: (id: string, x: number, y: number) => void;
  onUpdateDimensions: (id: string, width: number, height: number) => void;
  onDeletePost: (id: string) => void;
  textNotes: TextNoteType[];
  onCreateTextNote: (x: number, y: number) => Promise<TextNoteType | null>;
  onUpdateTextNote: (id: string, updates: Partial<TextNoteType>) => void;
  onDeleteTextNote: (id: string) => void;
  connections: Connection[];
  onCreateConnection: (fromId: string, fromType: 'post' | 'textNote', toId: string, toType: 'post' | 'textNote') => Promise<Connection | null>;
  onDeleteConnection: (id: string) => void;
}

const MIN_SCALE = 0.1;
const MAX_SCALE = 3;
const ZOOM_SENSITIVITY = 0.001;

type DragType = 'post' | 'textNote';
type SelectedItem = { id: string; type: DragType };

export default function Whiteboard({
  posts,
  onUpdatePosition,
  onUpdateDimensions,
  onDeletePost,
  textNotes,
  onCreateTextNote,
  onUpdateTextNote,
  onDeleteTextNote,
  connections,
  onCreateConnection,
  onDeleteConnection,
}: WhiteboardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const elementRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Use refs for camera to avoid re-renders during pan/zoom
  const cameraRef = useRef({ x: 0, y: 0, scale: 1 });
  const [cameraState, setCameraState] = useState({ x: 0, y: 0, scale: 1 });

  const isPanningRef = useRef(false);
  const [cursorState, setCursorState] = useState<'grab' | 'grabbing' | 'crosshair'>('grab');
  const [isTextMode, setIsTextMode] = useState(false);

  // Selection state
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [isStacking, setIsStacking] = useState(false);

  // Drag state - all refs for performance
  const dragStateRef = useRef<{
    id: string;
    type: DragType;
    offsetX: number;
    offsetY: number;
    currentX: number;
    currentY: number;
    element: HTMLDivElement | null;
  } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Resize state
  const resizeStateRef = useRef<{
    id: string;
    type: DragType;
    startWidth: number;
    startHeight: number;
    startMouseX: number;
    startMouseY: number;
    element: HTMLDivElement | null;
  } | null>(null);
  const [resizingId, setResizingId] = useState<string | null>(null);

  // Connection state
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingFrom, setConnectingFrom] = useState<{ id: string; type: 'post' | 'textNote'; direction: PortDirection } | null>(null);
  const [connectionMousePos, setConnectionMousePos] = useState<{ x: number; y: number } | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);

  // Ask AI modal state
  const [showAskAIModal, setShowAskAIModal] = useState(false);

  // Stacking animation state
  const [stackingPositions, setStackingPositions] = useState<Map<string, { x: number; y: number; rotation: number; zIndex: number }>>(new Map());

  // Apply camera transform directly to DOM
  const applyTransform = useCallback(() => {
    if (canvasRef.current) {
      const { x, y, scale } = cameraRef.current;
      canvasRef.current.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    }
  }, []);

  // Apply element position directly to DOM
  const applyElementPosition = useCallback((element: HTMLDivElement, x: number, y: number) => {
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
  }, []);

  // Apply element size directly to DOM
  const applyElementSize = useCallback((element: HTMLDivElement, width: number, height: number) => {
    element.style.width = `${width}px`;
    element.style.height = `${height}px`;
  }, []);

  // Toggle text mode
  const handleToggleTextMode = useCallback(() => {
    setIsTextMode(prev => !prev);
    setCursorState(prev => prev === 'crosshair' ? 'grab' : 'crosshair');
    setSelectedItems([]); // Clear selection when changing modes
  }, []);

  // Check if an item is selected
  const isSelected = useCallback((id: string) => {
    return selectedItems.some(item => item.id === id);
  }, [selectedItems]);

  // Toggle selection of an item
  const toggleSelection = useCallback((id: string, type: DragType) => {
    setSelectedItems(prev => {
      const exists = prev.some(item => item.id === id);
      if (exists) {
        return prev.filter(item => item.id !== id);
      } else {
        return [...prev, { id, type }];
      }
    });
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedItems([]);
    setStackingPositions(new Map());
    setIsStacking(false);
  }, []);

  // Stack selected items with animation
  const handleStackSelected = useCallback(() => {
    if (selectedItems.length < 2) return;

    setIsStacking(true);

    // Find the center position of selected items
    let totalX = 0;
    let totalY = 0;
    let count = 0;

    selectedItems.forEach(item => {
      if (item.type === 'post') {
        const post = posts.find(p => p.id === item.id);
        if (post) {
          totalX += post.position_x;
          totalY += post.position_y;
          count++;
        }
      } else {
        const note = textNotes.find(n => n.id === item.id);
        if (note) {
          totalX += note.position_x;
          totalY += note.position_y;
          count++;
        }
      }
    });

    const centerX = totalX / count;
    const centerY = totalY / count;

    // Create stacking positions with slight offsets and rotations
    const newStackingPositions = new Map<string, { x: number; y: number; rotation: number; zIndex: number }>();

    selectedItems.forEach((item, index) => {
      // Each item gets a slight offset to create the stacked paper effect
      const offsetX = (index - selectedItems.length / 2) * 3 + (Math.random() - 0.5) * 4;
      const offsetY = (index - selectedItems.length / 2) * 2 + (Math.random() - 0.5) * 3;
      const rotation = (Math.random() - 0.5) * 6; // Random rotation between -3 and 3 degrees

      newStackingPositions.set(item.id, {
        x: centerX + offsetX,
        y: centerY + offsetY,
        rotation,
        zIndex: 100 + index,
      });
    });

    setStackingPositions(newStackingPositions);

    // After animation completes, save positions to database
    setTimeout(() => {
      selectedItems.forEach(item => {
        const stackPos = newStackingPositions.get(item.id);
        if (!stackPos) return;

        if (item.type === 'post') {
          onUpdatePosition(item.id, stackPos.x, stackPos.y);
        } else {
          onUpdateTextNote(item.id, {
            position_x: stackPos.x,
            position_y: stackPos.y,
          });
        }
      });

      // Clear stacking state after saving
      setTimeout(() => {
        setStackingPositions(new Map());
        setIsStacking(false);
        setSelectedItems([]);
      }, 100);
    }, 500); // Wait for animation to complete
  }, [selectedItems, posts, textNotes, onUpdatePosition, onUpdateTextNote]);

  // Handle canvas mouse down
  const handleCanvasMouseDown = useCallback(async (e: React.MouseEvent) => {
    if (e.button !== 0 && e.button !== 1) return;

    // If in text mode, create a new text note
    if (isTextMode && e.button === 0) {
      e.preventDefault();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const cam = cameraRef.current;
      const canvasX = (e.clientX - rect.left - cam.x) / cam.scale;
      const canvasY = (e.clientY - rect.top - cam.y) / cam.scale;

      await onCreateTextNote(canvasX, canvasY);
      return;
    }

    // Clear selection when clicking on empty canvas (unless shift is held)
    if (!e.shiftKey && selectedItems.length > 0) {
      clearSelection();
    }
    setSelectedConnectionId(null);

    // Otherwise start panning
    e.preventDefault();
    isPanningRef.current = true;
    setCursorState('grabbing');
  }, [isTextMode, onCreateTextNote, selectedItems.length, clearSelection]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanningRef.current) {
      cameraRef.current.x += e.movementX;
      cameraRef.current.y += e.movementY;
      applyTransform();
    }
  }, [applyTransform]);

  const handleCanvasMouseUp = useCallback(() => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      setCursorState(isTextMode ? 'crosshair' : 'grab');
      setCameraState({ ...cameraRef.current });
    }
  }, [isTextMode]);

  // Handle mouse wheel for zooming (attached imperatively for { passive: false })
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const cam = cameraRef.current;
      const newScale = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, cam.scale * (1 - e.deltaY * ZOOM_SENSITIVITY))
      );

      const scaleRatio = newScale / cam.scale;
      cam.x = mouseX - (mouseX - cam.x) * scaleRatio;
      cam.y = mouseY - (mouseY - cam.y) * scaleRatio;
      cam.scale = newScale;

      applyTransform();
      setCameraState({ ...cam });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [applyTransform]);

  // Handle element drag start
  const handleElementMouseDown = useCallback((
    e: React.MouseEvent,
    id: string,
    type: DragType,
    posX: number,
    posY: number
  ) => {
    if (e.button !== 0) return;

    // Check if clicking on a connection port
    const target = e.target as HTMLElement;
    const portDirection = target.dataset.connectionPort as PortDirection | undefined;
    if (portDirection) {
      e.stopPropagation();
      e.preventDefault();
      setIsConnecting(true);
      setConnectingFrom({ id, type, direction: portDirection });
      setSelectedConnectionId(null);

      // Set initial mouse position in canvas coords
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const cam = cameraRef.current;
        setConnectionMousePos({
          x: (e.clientX - rect.left - cam.x) / cam.scale,
          y: (e.clientY - rect.top - cam.y) / cam.scale,
        });
      }
      return;
    }

    // Handle shift+click for multi-select
    if (e.shiftKey) {
      e.stopPropagation();
      e.preventDefault();
      toggleSelection(id, type);
      return;
    }

    // Check if clicking on resize handle
    if (target.dataset.resizeHandle === 'true') {
      e.stopPropagation();
      e.preventDefault();

      const element = elementRefs.current.get(id);
      if (!element) return;

      const rect = element.getBoundingClientRect();
      resizeStateRef.current = {
        id,
        type,
        startWidth: rect.width / cameraRef.current.scale,
        startHeight: rect.height / cameraRef.current.scale,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        element,
      };

      setResizingId(id);
      return;
    }

    // Clear selection if clicking on unselected item without shift
    if (!isSelected(id)) {
      clearSelection();
    }

    e.stopPropagation();
    e.preventDefault();

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const element = elementRefs.current.get(id);
    if (!element) return;

    const cam = cameraRef.current;
    const mouseCanvasX = (e.clientX - rect.left - cam.x) / cam.scale;
    const mouseCanvasY = (e.clientY - rect.top - cam.y) / cam.scale;

    dragStateRef.current = {
      id,
      type,
      offsetX: mouseCanvasX - posX,
      offsetY: mouseCanvasY - posY,
      currentX: posX,
      currentY: posY,
      element,
    };

    element.style.zIndex = '1000';
    element.style.cursor = 'grabbing';

    setDraggingId(id);
    setCursorState('grabbing');
  }, [toggleSelection, isSelected, clearSelection]);

  // Ref to track connection state in the global handler without stale closures
  const isConnectingRef = useRef(false);
  const connectingFromRef = useRef<{ id: string; type: 'post' | 'textNote'; direction: PortDirection } | null>(null);

  useEffect(() => {
    isConnectingRef.current = isConnecting;
    connectingFromRef.current = connectingFrom;
  }, [isConnecting, connectingFrom]);

  // Global mouse move/up handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Handle connection drawing
      if (isConnectingRef.current) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const cam = cameraRef.current;
          setConnectionMousePos({
            x: (e.clientX - rect.left - cam.x) / cam.scale,
            y: (e.clientY - rect.top - cam.y) / cam.scale,
          });
        }
        return;
      }

      // Handle drag
      const drag = dragStateRef.current;
      if (drag && drag.element) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const cam = cameraRef.current;
        const mouseCanvasX = (e.clientX - rect.left - cam.x) / cam.scale;
        const mouseCanvasY = (e.clientY - rect.top - cam.y) / cam.scale;

        drag.currentX = mouseCanvasX - drag.offsetX;
        drag.currentY = mouseCanvasY - drag.offsetY;

        applyElementPosition(drag.element, drag.currentX, drag.currentY);
        return;
      }

      // Handle resize
      const resize = resizeStateRef.current;
      if (resize && resize.element) {
        const cam = cameraRef.current;
        const deltaX = (e.clientX - resize.startMouseX) / cam.scale;
        const deltaY = (e.clientY - resize.startMouseY) / cam.scale;

        const newWidth = Math.max(resize.type === 'post' ? 200 : 80, resize.startWidth + deltaX);
        const newHeight = Math.max(resize.type === 'post' ? 120 : 40, resize.startHeight + deltaY);

        applyElementSize(resize.element, newWidth, newHeight);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      // Handle connection end
      if (isConnectingRef.current && connectingFromRef.current) {
        // Walk up from the drop target to find an element with data-element-id
        let target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
        let targetId: string | undefined;
        let targetType: 'post' | 'textNote' | undefined;

        while (target && !targetId) {
          if (target.dataset?.elementId && target.dataset?.elementType) {
            targetId = target.dataset.elementId;
            targetType = target.dataset.elementType as 'post' | 'textNote';
          }
          target = target.parentElement;
        }

        if (targetId && targetType && targetId !== connectingFromRef.current.id) {
          onCreateConnection(
            connectingFromRef.current.id,
            connectingFromRef.current.type,
            targetId,
            targetType,
          );
        }

        setIsConnecting(false);
        setConnectingFrom(null);
        setConnectionMousePos(null);
        return;
      }

      // Handle drag end
      const drag = dragStateRef.current;
      if (drag && drag.element) {
        drag.element.style.zIndex = '1';
        drag.element.style.cursor = 'grab';

        if (drag.type === 'post') {
          onUpdatePosition(drag.id, drag.currentX, drag.currentY);
        } else {
          onUpdateTextNote(drag.id, {
            position_x: drag.currentX,
            position_y: drag.currentY,
          });
        }

        dragStateRef.current = null;
        setDraggingId(null);
        setCursorState(isTextMode ? 'crosshair' : 'grab');
      }

      // Handle resize end
      const resize = resizeStateRef.current;
      if (resize && resize.element) {
        const rect = resize.element.getBoundingClientRect();
        const cam = cameraRef.current;
        const newWidth = rect.width / cam.scale;
        const newHeight = rect.height / cam.scale;

        if (resize.type === 'post') {
          onUpdateDimensions(resize.id, newWidth, newHeight);
        } else {
          onUpdateTextNote(resize.id, {
            width: newWidth,
            height: newHeight,
          });
        }

        resizeStateRef.current = null;
        setResizingId(null);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [applyElementPosition, applyElementSize, onUpdatePosition, onUpdateDimensions, onUpdateTextNote, isTextMode, onCreateConnection]);

  // Keyboard handler for Escape to clear selection, Delete/Backspace for connections
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearSelection();
        setSelectedConnectionId(null);
        if (isConnecting) {
          setIsConnecting(false);
          setConnectingFrom(null);
          setConnectionMousePos(null);
        }
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedConnectionId) {
        onDeleteConnection(selectedConnectionId);
        setSelectedConnectionId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearSelection, selectedConnectionId, onDeleteConnection, isConnecting]);

  // Store ref for each element
  const setElementRef = useCallback((id: string, element: HTMLDivElement | null) => {
    if (element) {
      elementRefs.current.set(id, element);
    } else {
      elementRefs.current.delete(id);
    }
  }, []);

  // Toolbar actions
  const handleZoomIn = useCallback(() => {
    cameraRef.current.scale = Math.min(MAX_SCALE, cameraRef.current.scale * 1.25);
    applyTransform();
    setCameraState({ ...cameraRef.current });
  }, [applyTransform]);

  const handleZoomOut = useCallback(() => {
    cameraRef.current.scale = Math.max(MIN_SCALE, cameraRef.current.scale / 1.25);
    applyTransform();
    setCameraState({ ...cameraRef.current });
  }, [applyTransform]);

  const handleResetView = useCallback(() => {
    cameraRef.current = { x: 0, y: 0, scale: 1 };
    applyTransform();
    setCameraState({ ...cameraRef.current });
  }, [applyTransform]);

  const handleFitContent = useCallback(() => {
    const allItems = [
      ...posts.map(p => ({ x: p.position_x, y: p.position_y, w: p.width || 300, h: 200 })),
      ...textNotes.map(n => ({ x: n.position_x, y: n.position_y, w: n.width, h: n.height })),
    ];

    if (allItems.length === 0) {
      handleResetView();
      return;
    }

    const padding = 100;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    allItems.forEach((item) => {
      minX = Math.min(minX, item.x);
      minY = Math.min(minY, item.y);
      maxX = Math.max(maxX, item.x + item.w);
      maxY = Math.max(maxY, item.y + item.h);
    });

    const contentWidth = maxX - minX + padding * 2;
    const contentHeight = maxY - minY + padding * 2;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const scaleX = rect.width / contentWidth;
    const scaleY = rect.height / contentHeight;
    const scale = Math.min(scaleX, scaleY, 1);

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    cameraRef.current = {
      x: rect.width / 2 - centerX * scale,
      y: rect.height / 2 - centerY * scale,
      scale,
    };
    applyTransform();
    setCameraState({ ...cameraRef.current });
  }, [posts, textNotes, handleResetView, applyTransform]);

  // Ask AI handler
  const handleAskAI = useCallback(() => {
    if (selectedItems.length === 0) return;
    setShowAskAIModal(true);
  }, [selectedItems.length]);

  const handleAskAISubmit = useCallback(async (prompt: string) => {
    // Gather content from selected items
    const selectedPosts = selectedItems
      .map(item => {
        if (item.type === 'post') {
          const post = posts.find(p => p.id === item.id);
          if (post) return { author: post.author_handle || 'unknown', content: post.content || '' };
        } else {
          const note = textNotes.find(n => n.id === item.id);
          if (note) return { author: 'note', content: note.content || '' };
        }
        return null;
      })
      .filter((p): p is { author: string; content: string } => p !== null);

    if (selectedPosts.length === 0) return;

    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, posts: selectedPosts }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to get AI response');
    }

    const { response } = await res.json();

    // Calculate position near selected items (offset to the right)
    let avgX = 0, avgY = 0, count = 0;
    selectedItems.forEach(item => {
      if (item.type === 'post') {
        const post = posts.find(p => p.id === item.id);
        if (post) { avgX += post.position_x; avgY += post.position_y; count++; }
      } else {
        const note = textNotes.find(n => n.id === item.id);
        if (note) { avgX += note.position_x; avgY += note.position_y; count++; }
      }
    });

    if (count > 0) {
      avgX = avgX / count + 350;
      avgY = avgY / count;
    }

    // Create a text note with the AI response
    const newNote = await onCreateTextNote(avgX, avgY);
    if (newNote) {
      onUpdateTextNote(newNote.id, {
        content: response,
        width: 350,
        height: 250,
      });
    }

    setShowAskAIModal(false);
  }, [selectedItems, posts, textNotes, onCreateTextNote, onUpdateTextNote]);

  const hasContent = posts.length > 0 || textNotes.length > 0;

  // Get position for an element (either from stacking animation or original)
  const getElementPosition = (id: string, originalX: number, originalY: number) => {
    const stackPos = stackingPositions.get(id);
    if (stackPos) {
      return { x: stackPos.x, y: stackPos.y, rotation: stackPos.rotation, zIndex: stackPos.zIndex };
    }
    return { x: originalX, y: originalY, rotation: 0, zIndex: 1 };
  };

  return (
    <>
      <div
        ref={containerRef}
        className="h-full w-full overflow-hidden select-none whiteboard-surface"
        style={{ cursor: cursorState }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
      >
        <div
          ref={canvasRef}
          className="relative h-full w-full pointer-events-none"
          style={{
            transformOrigin: '0 0',
            willChange: 'transform',
          }}
        >
          {/* Render posts */}
          {posts.map((post) => {
            const pos = getElementPosition(post.id, post.position_x, post.position_y);
            const itemIsSelected = isSelected(post.id);
            const isAnimating = stackingPositions.has(post.id);

            return (
              <div
                key={post.id}
                ref={(el) => setElementRef(post.id, el)}
                className="absolute pointer-events-auto"
                data-element-id={post.id}
                data-element-type="post"
                style={{
                  left: pos.x,
                  top: pos.y,
                  width: post.width || 300,
                  cursor: 'grab',
                  zIndex: pos.zIndex,
                  willChange: draggingId === post.id || resizingId === post.id || isAnimating ? 'left, top, width, height, transform' : 'auto',
                  transition: isAnimating ? 'left 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), top 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
                  transform: pos.rotation !== 0 ? `rotate(${pos.rotation}deg)` : undefined,
                }}
                onMouseDown={(e) => handleElementMouseDown(e, post.id, 'post', post.position_x, post.position_y)}
              >
                <PostCard
                  post={post}
                  onDelete={onDeletePost}
                  isDragging={draggingId === post.id}
                  isResizing={resizingId === post.id}
                  isSelected={itemIsSelected}
                  width={post.width}
                  showPorts={isConnecting}
                />
              </div>
            );
          })}

          {/* Render text notes */}
          {textNotes.map((note) => {
            const pos = getElementPosition(note.id, note.position_x, note.position_y);
            const itemIsSelected = isSelected(note.id);
            const isAnimating = stackingPositions.has(note.id);

            return (
              <div
                key={note.id}
                ref={(el) => setElementRef(note.id, el)}
                className="absolute pointer-events-auto"
                data-element-id={note.id}
                data-element-type="textNote"
                style={{
                  left: pos.x,
                  top: pos.y,
                  width: note.width,
                  height: note.height,
                  cursor: 'grab',
                  zIndex: pos.zIndex,
                  willChange: draggingId === note.id || resizingId === note.id || isAnimating ? 'left, top, width, height, transform' : 'auto',
                  transition: isAnimating ? 'left 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), top 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
                  transform: pos.rotation !== 0 ? `rotate(${pos.rotation}deg)` : undefined,
                }}
                onMouseDown={(e) => handleElementMouseDown(e, note.id, 'textNote', note.position_x, note.position_y)}
              >
                <TextNote
                  note={note}
                  onUpdate={onUpdateTextNote}
                  onDelete={onDeleteTextNote}
                  isDragging={draggingId === note.id}
                  isResizing={resizingId === note.id}
                  isSelected={itemIsSelected}
                  scale={cameraState.scale}
                  showPorts={isConnecting}
                />
              </div>
            );
          })}

          {/* Connection arrows layer */}
          <ConnectionLayer
            connections={connections}
            posts={posts}
            textNotes={textNotes}
            elementRefs={elementRefs}
            onDeleteConnection={onDeleteConnection}
            isConnecting={isConnecting}
            connectingFrom={connectingFrom}
            mousePosition={connectionMousePos}
            selectedConnectionId={selectedConnectionId}
            onSelectConnection={setSelectedConnectionId}
          />
        </div>

        {!hasContent && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="text-lg font-medium text-zinc-500">
                No content yet
              </p>
              <p className="mt-1 text-sm text-zinc-400">
                Use the Chrome extension to add posts from X, or click the T button to add text
              </p>
            </div>
          </div>
        )}
      </div>

      <Toolbar
        scale={cameraState.scale}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
        onFitContent={handleFitContent}
        isTextMode={isTextMode}
        onToggleTextMode={handleToggleTextMode}
        selectedCount={selectedItems.length}
        onStackSelected={handleStackSelected}
        onAskAI={handleAskAI}
      />

      {showAskAIModal && (
        <AskAIModal
          selectedCount={selectedItems.length}
          onSubmit={handleAskAISubmit}
          onClose={() => setShowAskAIModal(false)}
        />
      )}
    </>
  );
}
