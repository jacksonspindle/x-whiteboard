'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Connection, PortDirection, Post, TextNote } from '@/lib/types';
import ConnectionArrow from './ConnectionArrow';

interface ElementRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ConnectionLayerProps {
  connections: Connection[];
  posts: Post[];
  textNotes: TextNote[];
  elementRefs: React.RefObject<Map<string, HTMLDivElement>>;
  onDeleteConnection: (id: string) => void;
  // Connection drawing state
  isConnecting: boolean;
  connectingFrom: { id: string; type: 'post' | 'textNote'; direction: PortDirection } | null;
  mousePosition: { x: number; y: number } | null;
  selectedConnectionId: string | null;
  onSelectConnection: (id: string | null) => void;
}

type PortPair = {
  from: { x: number; y: number; direction: PortDirection };
  to: { x: number; y: number; direction: PortDirection };
};

function getPortPosition(rect: ElementRect, direction: PortDirection): { x: number; y: number } {
  switch (direction) {
    case 'top':
      return { x: rect.x + rect.width / 2, y: rect.y };
    case 'right':
      return { x: rect.x + rect.width, y: rect.y + rect.height / 2 };
    case 'bottom':
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height };
    case 'left':
      return { x: rect.x, y: rect.y + rect.height / 2 };
  }
}

function getElementRect(
  id: string,
  type: 'post' | 'textNote',
  posts: Post[],
  textNotes: TextNote[],
  elementRefs: Map<string, HTMLDivElement>,
): ElementRect | null {
  // Try to get live position from the DOM element ref (for drag performance)
  const el = elementRefs.get(id);
  if (el) {
    const x = parseFloat(el.style.left) || 0;
    const y = parseFloat(el.style.top) || 0;
    const width = parseFloat(el.style.width) || (type === 'post' ? 300 : 200);
    const height = el.offsetHeight || (type === 'post' ? 200 : 100);
    return { x, y, width, height };
  }

  // Fallback to data
  if (type === 'post') {
    const post = posts.find(p => p.id === id);
    if (post) return { x: post.position_x, y: post.position_y, width: post.width || 300, height: post.height || 200 };
  } else {
    const note = textNotes.find(n => n.id === id);
    if (note) return { x: note.position_x, y: note.position_y, width: note.width, height: note.height };
  }
  return null;
}

function findBestPortPair(fromRect: ElementRect, toRect: ElementRect): PortPair {
  const directions: PortDirection[] = ['top', 'right', 'bottom', 'left'];
  let bestDist = Infinity;
  let bestPair: PortPair = {
    from: { ...getPortPosition(fromRect, 'right'), direction: 'right' },
    to: { ...getPortPosition(toRect, 'left'), direction: 'left' },
  };

  for (const fromDir of directions) {
    for (const toDir of directions) {
      const fromPos = getPortPosition(fromRect, fromDir);
      const toPos = getPortPosition(toRect, toDir);
      const dist = Math.hypot(toPos.x - fromPos.x, toPos.y - fromPos.y);
      if (dist < bestDist) {
        bestDist = dist;
        bestPair = {
          from: { ...fromPos, direction: fromDir },
          to: { ...toPos, direction: toDir },
        };
      }
    }
  }
  return bestPair;
}

export default function ConnectionLayer({
  connections,
  posts,
  textNotes,
  elementRefs,
  onDeleteConnection,
  isConnecting,
  connectingFrom,
  mousePosition,
  selectedConnectionId,
  onSelectConnection,
}: ConnectionLayerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRefsMap = useRef<Map<string, SVGGElement>>(new Map());
  const [, forceRender] = useState(0);
  const rafRef = useRef<number>(0);

  // Force re-render periodically during drag to update arrow positions
  const scheduleUpdate = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      forceRender(n => n + 1);
    });
  }, []);

  // Listen for mouse move events to update arrows during element drag
  useEffect(() => {
    const handleMouseMove = () => {
      if (connections.length > 0) {
        scheduleUpdate();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [connections.length, scheduleUpdate]);

  const refs = elementRefs.current;

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 w-full h-full overflow-visible"
      style={{ pointerEvents: 'none' }}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="8"
          refX="9"
          refY="4"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <polygon
            points="0 0, 10 4, 0 8"
            fill="#94a3b8"
          />
        </marker>
        <marker
          id="arrowhead-selected"
          markerWidth="10"
          markerHeight="8"
          refX="9"
          refY="4"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <polygon
            points="0 0, 10 4, 0 8"
            fill="#3b82f6"
          />
        </marker>
        <marker
          id="arrowhead-temp"
          markerWidth="10"
          markerHeight="8"
          refX="9"
          refY="4"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <polygon
            points="0 0, 10 4, 0 8"
            fill="#3b82f6"
            opacity="0.6"
          />
        </marker>
      </defs>

      {/* Render existing connections */}
      {connections.map((conn) => {
        if (!refs) return null;
        const fromRect = getElementRect(conn.from_id, conn.from_type as 'post' | 'textNote', posts, textNotes, refs);
        const toRect = getElementRect(conn.to_id, conn.to_type as 'post' | 'textNote', posts, textNotes, refs);
        if (!fromRect || !toRect) return null;

        const pair = findBestPortPair(fromRect, toRect);
        const isSelected = selectedConnectionId === conn.id;

        return (
          <g key={conn.id} ref={(el) => { if (el) pathRefsMap.current.set(conn.id, el); else pathRefsMap.current.delete(conn.id); }}>
            <ConnectionArrow
              from={pair.from}
              to={pair.to}
              isSelected={isSelected}
              onSelect={() => onSelectConnection(isSelected ? null : conn.id)}
              onDelete={() => onDeleteConnection(conn.id)}
            />
          </g>
        );
      })}

      {/* Render temporary connection being drawn */}
      {isConnecting && connectingFrom && mousePosition && refs && (() => {
        const fromRect = getElementRect(connectingFrom.id, connectingFrom.type, posts, textNotes, refs);
        if (!fromRect) return null;

        const fromPos = getPortPosition(fromRect, connectingFrom.direction);
        const cp1 = getControlPointForTemp(fromPos, connectingFrom.direction);

        // Infer a direction for the mouse end based on relative position
        const dx = mousePosition.x - fromPos.x;
        const dy = mousePosition.y - fromPos.y;
        let toDir: PortDirection;
        if (Math.abs(dx) > Math.abs(dy)) {
          toDir = dx > 0 ? 'left' : 'right';
        } else {
          toDir = dy > 0 ? 'top' : 'bottom';
        }
        const cp2 = getControlPointForTemp(mousePosition, toDir);

        const pathD = `M ${fromPos.x} ${fromPos.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${mousePosition.x} ${mousePosition.y}`;

        return (
          <path
            d={pathD}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={2}
            strokeDasharray="6 4"
            opacity={0.6}
            markerEnd="url(#arrowhead-temp)"
            style={{ pointerEvents: 'none' }}
          />
        );
      })()}
    </svg>
  );
}

function getControlPointForTemp(point: { x: number; y: number }, direction: PortDirection, offset = 80) {
  switch (direction) {
    case 'right':
      return { x: point.x + offset, y: point.y };
    case 'left':
      return { x: point.x - offset, y: point.y };
    case 'top':
      return { x: point.x, y: point.y - offset };
    case 'bottom':
      return { x: point.x, y: point.y + offset };
  }
}
