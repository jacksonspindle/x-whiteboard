'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Post } from '@/lib/types';
import PostCard from './PostCard';
import Toolbar from './Toolbar';

interface WhiteboardProps {
  posts: Post[];
  onUpdatePosition: (id: string, x: number, y: number) => void;
  onDeletePost: (id: string) => void;
}

const MIN_SCALE = 0.1;
const MAX_SCALE = 3;
const ZOOM_SENSITIVITY = 0.001;

export default function Whiteboard({
  posts,
  onUpdatePosition,
  onDeletePost,
}: WhiteboardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const postRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Use refs for camera to avoid re-renders during pan/zoom
  const cameraRef = useRef({ x: 0, y: 0, scale: 1 });
  const [cameraState, setCameraState] = useState({ x: 0, y: 0, scale: 1 });

  const isPanningRef = useRef(false);
  const [cursorState, setCursorState] = useState<'grab' | 'grabbing'>('grab');

  // Drag state - all refs for performance
  const dragStateRef = useRef<{
    postId: string;
    offsetX: number;
    offsetY: number;
    currentX: number;
    currentY: number;
    element: HTMLDivElement | null;
  } | null>(null);
  const [draggingPostId, setDraggingPostId] = useState<string | null>(null);

  // Apply camera transform directly to DOM
  const applyTransform = useCallback(() => {
    if (canvasRef.current) {
      const { x, y, scale } = cameraRef.current;
      canvasRef.current.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    }
  }, []);

  // Apply post position directly to DOM
  const applyPostPosition = useCallback((element: HTMLDivElement, x: number, y: number) => {
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
  }, []);

  // Handle canvas panning
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0 || e.button === 1) {
      e.preventDefault();
      isPanningRef.current = true;
      setCursorState('grabbing');
    }
  }, []);

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
      setCursorState('grab');
      setCameraState({ ...cameraRef.current });
    }
  }, []);

  // Handle mouse wheel for zooming
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

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
  }, [applyTransform]);

  // Handle post drag start
  const handlePostMouseDown = useCallback((e: React.MouseEvent, post: Post) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const element = postRefs.current.get(post.id);
    if (!element) return;

    const cam = cameraRef.current;
    const mouseCanvasX = (e.clientX - rect.left - cam.x) / cam.scale;
    const mouseCanvasY = (e.clientY - rect.top - cam.y) / cam.scale;

    dragStateRef.current = {
      postId: post.id,
      offsetX: mouseCanvasX - post.position_x,
      offsetY: mouseCanvasY - post.position_y,
      currentX: post.position_x,
      currentY: post.position_y,
      element,
    };

    // Apply dragging styles
    element.style.zIndex = '1000';
    element.style.cursor = 'grabbing';

    setDraggingPostId(post.id);
    setCursorState('grabbing');
  }, []);

  // Global mouse move/up handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const drag = dragStateRef.current;
      if (!drag || !drag.element) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const cam = cameraRef.current;
      const mouseCanvasX = (e.clientX - rect.left - cam.x) / cam.scale;
      const mouseCanvasY = (e.clientY - rect.top - cam.y) / cam.scale;

      drag.currentX = mouseCanvasX - drag.offsetX;
      drag.currentY = mouseCanvasY - drag.offsetY;

      // Apply position directly to DOM - no React re-render
      applyPostPosition(drag.element, drag.currentX, drag.currentY);
    };

    const handleMouseUp = () => {
      const drag = dragStateRef.current;
      if (drag && drag.element) {
        // Reset styles
        drag.element.style.zIndex = '1';
        drag.element.style.cursor = 'grab';

        // Save final position to database
        onUpdatePosition(drag.postId, drag.currentX, drag.currentY);

        dragStateRef.current = null;
        setDraggingPostId(null);
        setCursorState('grab');
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [applyPostPosition, onUpdatePosition]);

  // Store ref for each post
  const setPostRef = useCallback((id: string, element: HTMLDivElement | null) => {
    if (element) {
      postRefs.current.set(id, element);
    } else {
      postRefs.current.delete(id);
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
    if (posts.length === 0) {
      handleResetView();
      return;
    }

    const padding = 100;
    const postWidth = 300;
    const postHeight = 200;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    posts.forEach((post) => {
      minX = Math.min(minX, post.position_x);
      minY = Math.min(minY, post.position_y);
      maxX = Math.max(maxX, post.position_x + postWidth);
      maxY = Math.max(maxY, post.position_y + postHeight);
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
  }, [posts, handleResetView, applyTransform]);

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
        onWheel={handleWheel}
      >
        <div
          ref={canvasRef}
          className="relative h-full w-full pointer-events-none"
          style={{
            transformOrigin: '0 0',
            willChange: 'transform',
          }}
        >
          {posts.map((post) => (
            <div
              key={post.id}
              ref={(el) => setPostRef(post.id, el)}
              className="absolute pointer-events-auto"
              style={{
                left: post.position_x,
                top: post.position_y,
                cursor: 'grab',
                zIndex: 1,
                willChange: draggingPostId === post.id ? 'left, top' : 'auto',
              }}
              onMouseDown={(e) => handlePostMouseDown(e, post)}
            >
              <PostCard
                post={post}
                onDelete={onDeletePost}
                isDragging={draggingPostId === post.id}
              />
            </div>
          ))}
        </div>

        {posts.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="text-lg font-medium text-zinc-500">
                No posts yet
              </p>
              <p className="mt-1 text-sm text-zinc-400">
                Use the Chrome extension to add posts from X
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
      />
    </>
  );
}
