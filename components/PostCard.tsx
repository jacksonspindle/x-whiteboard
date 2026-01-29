'use client';

import { Post, MediaItem } from '@/lib/types';
import { ExternalLink, Trash2 } from 'lucide-react';
import Image from 'next/image';

interface PostCardProps {
  post: Post;
  onDelete?: (id: string) => void;
  isDragging?: boolean;
  isResizing?: boolean;
  isSelected?: boolean;
  width?: number;
}

export default function PostCard({ post, onDelete, isDragging, isResizing, isSelected, width }: PostCardProps) {
  const cardWidth = width || post.width || 300;
  const handleOpenTweet = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(post.tweet_url, '_blank');
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(post.id);
  };

  // Generate consistent variations based on post id
  const hash = post.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const rotation = ((hash % 7) - 3) * 0.6;
  const hueShift = (hash % 10) - 5;

  return (
    <div
      className={`group relative flex flex-col transition-all duration-200 ${
        isDragging ? 'scale-105' : isResizing ? '' : 'hover:scale-[1.02]'
      }`}
      style={{
        width: isResizing ? '100%' : cardWidth,
        minWidth: 200,
        minHeight: '120px',
        transform: isDragging ? 'scale(1.05) rotate(0deg)' : `rotate(${rotation}deg)`,
        outline: isSelected ? '3px solid #3b82f6' : 'none',
        outlineOffset: '2px',
        borderRadius: isSelected ? '4px' : undefined,
      }}
    >
      {/* Paper with notepad styling */}
      <div
        className="relative flex flex-col h-full"
        style={{
          background: `linear-gradient(180deg,
            hsl(${55 + hueShift}, 100%, 97%) 0%,
            hsl(${50 + hueShift}, 80%, 94%) 100%)`,
          borderRadius: '2px 2px 3px 3px',
          boxShadow: isDragging
            ? `
              0 25px 50px rgba(0,0,0,0.25),
              0 10px 20px rgba(0,0,0,0.15),
              inset 0 1px 0 rgba(255,255,255,0.6)
            `
            : `
              0 1px 1px rgba(0,0,0,0.05),
              0 2px 4px rgba(0,0,0,0.05),
              0 4px 8px rgba(0,0,0,0.05),
              0 8px 16px rgba(0,0,0,0.03),
              inset 0 1px 0 rgba(255,255,255,0.6)
            `,
        }}
      >
        {/* Red margin line */}
        <div
          className="absolute top-0 bottom-0 left-[32px] w-[1px] pointer-events-none"
          style={{
            background: 'rgba(220, 80, 80, 0.3)',
          }}
        />

        {/* Horizontal ruled lines */}
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{
            backgroundImage: `repeating-linear-gradient(
              to bottom,
              transparent,
              transparent 23px,
              rgba(180, 200, 220, 0.3) 23px,
              rgba(180, 200, 220, 0.3) 24px
            )`,
            backgroundPosition: '0 20px',
          }}
        />

        {/* Paper texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")
            `,
            opacity: 0.06,
            mixBlendMode: 'multiply',
          }}
        />

        {/* Organic crease SVG overlay */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 300 400"
          preserveAspectRatio="none"
        >
          {/* Main organic crease - curved path */}
          <path
            d={`M ${-10 + (hash % 20)} ${80 + (hash % 40)}
                Q ${60 + (hash % 30)} ${60 + (hash % 50)}, ${120 + (hash % 40)} ${100 + (hash % 30)}
                T ${220 + (hash % 40)} ${70 + (hash % 40)}
                Q ${280 + (hash % 20)} ${90 + (hash % 30)}, ${310} ${60 + (hash % 40)}`}
            stroke="rgba(0,0,0,0.025)"
            strokeWidth="2"
            fill="none"
          />
          <path
            d={`M ${-10 + (hash % 20)} ${81 + (hash % 40)}
                Q ${60 + (hash % 30)} ${61 + (hash % 50)}, ${120 + (hash % 40)} ${101 + (hash % 30)}
                T ${220 + (hash % 40)} ${71 + (hash % 40)}
                Q ${280 + (hash % 20)} ${91 + (hash % 30)}, ${310} ${61 + (hash % 40)}`}
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="1"
            fill="none"
          />

          {/* Secondary diagonal crease */}
          <path
            d={`M ${250 + (hash % 30)} ${-10}
                Q ${200 + (hash % 40)} ${80 + (hash % 30)}, ${180 + (hash % 50)} ${150 + (hash % 40)}
                T ${140 + (hash % 40)} ${280 + (hash % 30)}
                Q ${120 + (hash % 30)} ${350 + (hash % 30)}, ${100 + (hash % 40)} ${410}`}
            stroke="rgba(0,0,0,0.02)"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d={`M ${251 + (hash % 30)} ${-10}
                Q ${201 + (hash % 40)} ${80 + (hash % 30)}, ${181 + (hash % 50)} ${150 + (hash % 40)}
                T ${141 + (hash % 40)} ${280 + (hash % 30)}
                Q ${121 + (hash % 30)} ${350 + (hash % 30)}, ${101 + (hash % 40)} ${410}`}
            stroke="rgba(255,255,255,0.03)"
            strokeWidth="1"
            fill="none"
          />

          {/* Small wrinkle near corner */}
          <path
            d={`M ${220 + (hash % 40)} ${250 + (hash % 50)}
                Q ${240 + (hash % 20)} ${270 + (hash % 30)}, ${260 + (hash % 20)} ${260 + (hash % 40)}
                T ${290 + (hash % 10)} ${300 + (hash % 30)}`}
            stroke="rgba(0,0,0,0.018)"
            strokeWidth="1"
            fill="none"
          />

          {/* Subtle horizontal wave */}
          <path
            d={`M ${-10} ${200 + (hash % 60)}
                Q ${50 + (hash % 30)} ${190 + (hash % 40)}, ${100 + (hash % 40)} ${205 + (hash % 30)}
                T ${200 + (hash % 30)} ${195 + (hash % 35)}
                Q ${260 + (hash % 20)} ${210 + (hash % 25)}, ${310} ${200 + (hash % 30)}`}
            stroke="rgba(0,0,0,0.015)"
            strokeWidth="1"
            fill="none"
          />
        </svg>

        {/* Corner wrinkle cluster */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: `${5 + (hash % 15)}%`,
            right: `${3 + (hash % 8)}%`,
            width: '50px',
            height: '50px',
            background: `
              radial-gradient(
                ellipse 70% 50% at ${40 + (hash % 20)}% ${40 + (hash % 20)}%,
                rgba(0,0,0,0.02) 0%,
                transparent 50%
              ),
              radial-gradient(
                ellipse 50% 70% at ${60 + (hash % 20)}% ${55 + (hash % 15)}%,
                rgba(255,255,255,0.02) 0%,
                transparent 40%
              )
            `,
            transform: `rotate(${hash % 30 - 15}deg)`,
          }}
        />

        {/* Edge shadow for depth */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow: `
              inset ${2 + (hash % 3)}px 0 ${3 + (hash % 2)}px -2px rgba(0,0,0,0.02),
              inset -${1 + (hash % 2)}px 0 ${2 + (hash % 2)}px -1px rgba(0,0,0,0.015),
              inset 0 ${2 + (hash % 2)}px ${3 + (hash % 2)}px -2px rgba(0,0,0,0.015)
            `,
          }}
        />

        {/* Top edge worn effect */}
        <div
          className="absolute top-0 left-0 right-0 h-[3px] pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.03), transparent)',
          }}
        />

        {/* Pushpin */}
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 z-10"
          style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.3))' }}
        >
          {/* Pin body */}
          <div
            className="relative"
            style={{
              width: '20px',
              height: '20px',
            }}
          >
            {/* Pin head - glossy sphere */}
            <div
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: `
                  radial-gradient(circle at 35% 35%,
                    #ff6b6b 0%,
                    #ee5a5a 30%,
                    #dc4444 60%,
                    #c53030 100%)
                `,
                boxShadow: `
                  inset -2px -2px 4px rgba(0,0,0,0.3),
                  inset 2px 2px 4px rgba(255,255,255,0.3),
                  0 1px 2px rgba(0,0,0,0.2)
                `,
              }}
            />
            {/* Pin highlight */}
            <div
              className="absolute"
              style={{
                top: '3px',
                left: '5px',
                width: '6px',
                height: '4px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.5)',
                transform: 'rotate(-30deg)',
              }}
            />
          </div>
          {/* Pin shadow on paper */}
          <div
            className="absolute top-[16px] left-1/2 -translate-x-1/2"
            style={{
              width: '8px',
              height: '4px',
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.15)',
              filter: 'blur(1px)',
            }}
          />
        </div>

        {/* Hole punch holes on left */}
        <div className="absolute left-[10px] top-[30px] flex flex-col gap-[48px] pointer-events-none">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'linear-gradient(145deg, #e8e8e8 0%, #d0d0d0 100%)',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2), inset 0 -1px 1px rgba(255,255,255,0.3)',
              }}
            />
          ))}
        </div>

        {/* Header */}
        <div className="flex items-start gap-3 p-4 pb-2 pt-6 pl-[44px]">
          {post.author_avatar && (
            <Image
              src={post.author_avatar}
              alt={post.author_name || 'Author'}
              width={36}
              height={36}
              className="rounded-full"
              style={{
                boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
              }}
              unoptimized
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span
                className="font-semibold truncate"
                style={{
                  color: '#1a1a1a',
                  fontSize: '14px',
                }}
              >
                {post.author_name || 'Unknown'}
              </span>
            </div>
            <span
              style={{
                color: '#666',
                fontSize: '13px',
              }}
            >
              @{post.author_handle || 'unknown'}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={handleOpenTweet}
              className="rounded p-1.5 transition-colors hover:bg-black/5"
              style={{ color: '#888' }}
              title="Open on X"
            >
              <ExternalLink className="h-4 w-4" />
            </button>
            {onDelete && (
              <button
                onClick={handleDelete}
                className="rounded p-1.5 transition-colors hover:bg-red-500/10 hover:text-red-600"
                style={{ color: '#888' }}
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {post.content && (
          <div className="px-4 pb-3 pl-[44px]">
            <p
              className="whitespace-pre-wrap leading-relaxed"
              style={{
                color: '#2a2a2a',
                fontSize: '14px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              {post.content}
            </p>
          </div>
        )}

        {/* Media */}
        {post.media && post.media.length > 0 && (
          <div className="px-4 pb-4 pl-[44px]">
            <div
              className={`grid gap-2 ${
                post.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
              }`}
            >
              {post.media.slice(0, 4).map((media: MediaItem, index: number) => (
                <div
                  key={index}
                  className="relative aspect-video overflow-hidden rounded"
                  style={{
                    boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)',
                  }}
                >
                  {media.type === 'image' ? (
                    <Image
                      src={media.url}
                      alt="Media"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <video
                      src={media.url}
                      poster={media.thumbnail}
                      className="h-full w-full object-cover"
                      controls
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          className="mt-auto px-4 py-2 pl-[44px]"
          style={{
            borderTop: '1px solid rgba(0,0,0,0.05)',
          }}
        >
          <span style={{ fontSize: '11px', color: '#999' }}>
            {new Date(post.created_at).toLocaleDateString()}
          </span>
        </div>

        {/* Bottom edge curl/lift effect */}
        <div
          className="absolute -bottom-1 left-3 right-3 h-3 -z-10"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.12) 0%, transparent 70%)',
            filter: 'blur(2px)',
          }}
        />

        {/* Corner curl */}
        <div
          className="absolute bottom-0 right-0 pointer-events-none overflow-hidden"
          style={{
            width: '20px',
            height: '20px',
          }}
        >
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '28px',
              height: '28px',
              background: `linear-gradient(
                135deg,
                transparent 50%,
                rgba(0,0,0,0.03) 50%,
                rgba(0,0,0,0.05) 60%,
                hsl(${50 + hueShift}, 60%, 90%) 60%
              )`,
              borderRadius: '0 0 2px 0',
            }}
          />
        </div>
      </div>

      {/* Resize handle */}
      <div
        className="absolute bottom-0 right-0 h-6 w-6 cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity z-20"
        data-resize-handle="true"
        style={{
          background: 'linear-gradient(135deg, transparent 40%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.25) 100%)',
          borderRadius: '0 0 3px 0',
        }}
      />
    </div>
  );
}
