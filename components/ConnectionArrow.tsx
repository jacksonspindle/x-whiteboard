'use client';

import { PortDirection } from '@/lib/types';

interface ConnectionArrowProps {
  from: { x: number; y: number; direction: PortDirection };
  to: { x: number; y: number; direction: PortDirection };
  isSelected?: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
}

function getControlPoint(point: { x: number; y: number; direction: PortDirection }, offset = 80) {
  switch (point.direction) {
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

// Cubic bezier point at parameter t
function bezierPoint(
  p0: number, p1: number, p2: number, p3: number, t: number
) {
  const mt = 1 - t;
  return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
}

export default function ConnectionArrow({
  from,
  to,
  isSelected,
  onSelect,
  onDelete,
}: ConnectionArrowProps) {
  const cp1 = getControlPoint(from);
  const cp2 = getControlPoint(to);

  const pathD = `M ${from.x} ${from.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${to.x} ${to.y}`;

  // Midpoint on the actual bezier curve at t=0.5
  const midX = bezierPoint(from.x, cp1.x, cp2.x, to.x, 0.5);
  const midY = bezierPoint(from.y, cp1.y, cp2.y, to.y, 0.5);

  return (
    <g>
      {/* Invisible wider path for easier click target */}
      <path
        d={pathD}
        fill="none"
        stroke="transparent"
        strokeWidth={16}
        style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onSelect?.();
        }}
      />
      {/* Visible path */}
      <path
        d={pathD}
        fill="none"
        stroke={isSelected ? '#3b82f6' : '#94a3b8'}
        strokeWidth={isSelected ? 2.5 : 2}
        markerEnd={isSelected ? 'url(#arrowhead-selected)' : 'url(#arrowhead)'}
        style={{ pointerEvents: 'none', transition: 'stroke 0.15s, stroke-width 0.15s' }}
      />
      {/* Delete button when selected */}
      {isSelected && onDelete && (
        <g
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onDelete();
          }}
          style={{ cursor: 'pointer', pointerEvents: 'auto' }}
        >
          <circle
            cx={midX}
            cy={midY}
            r={10}
            fill="#ef4444"
            stroke="white"
            strokeWidth={2}
          />
          <text
            x={midX}
            y={midY}
            textAnchor="middle"
            dominantBaseline="central"
            fill="white"
            fontSize={14}
            fontWeight="bold"
          >
            ×
          </text>
        </g>
      )}
    </g>
  );
}
