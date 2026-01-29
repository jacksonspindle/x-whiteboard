'use client';

import { Post, MediaItem } from '@/lib/types';
import { ExternalLink, Trash2 } from 'lucide-react';
import Image from 'next/image';

interface PostCardProps {
  post: Post;
  onDelete?: (id: string) => void;
  isDragging?: boolean;
}

export default function PostCard({ post, onDelete, isDragging }: PostCardProps) {
  const handleOpenTweet = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(post.tweet_url, '_blank');
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(post.id);
  };

  // Generate a consistent slight rotation based on post id
  const rotation = ((post.id.charCodeAt(0) % 5) - 2) * 0.5;

  return (
    <div
      className={`group relative flex w-[300px] flex-col bg-white transition-all duration-200 ${
        isDragging
          ? 'scale-105 rotate-0'
          : 'hover:scale-[1.02]'
      }`}
      style={{
        minHeight: '100px',
        transform: isDragging ? 'scale(1.05) rotate(0deg)' : `rotate(${rotation}deg)`,
        borderRadius: '2px',
        boxShadow: isDragging
          ? '0 20px 40px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05)'
          : '0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.02)',
      }}
    >
      {/* Pushpin */}
      <div
        className="absolute -top-2 left-1/2 -translate-x-1/2 z-10"
        style={{
          width: '24px',
          height: '24px',
        }}
      >
        {/* Pin head */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full"
          style={{
            width: '16px',
            height: '16px',
            background: 'linear-gradient(145deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.3)',
          }}
        />
        {/* Pin point shadow on paper */}
        <div
          className="absolute top-3 left-1/2 -translate-x-1/2 rounded-full bg-black/10"
          style={{
            width: '6px',
            height: '6px',
          }}
        />
      </div>

      {/* Paper texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Header */}
      <div className="flex items-start gap-3 p-4 pb-2 pt-5">
        {post.author_avatar && (
          <Image
            src={post.author_avatar}
            alt={post.author_name || 'Author'}
            width={40}
            height={40}
            className="rounded-full ring-2 ring-white shadow-sm"
            unoptimized
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="font-semibold text-zinc-900 truncate">
              {post.author_name || 'Unknown'}
            </span>
          </div>
          <span className="text-sm text-zinc-500">
            @{post.author_handle || 'unknown'}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={handleOpenTweet}
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
            title="Open on X"
          >
            <ExternalLink className="h-4 w-4" />
          </button>
          {onDelete && (
            <button
              onClick={handleDelete}
              className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {post.content && (
        <div className="px-4 pb-3">
          <p className="whitespace-pre-wrap text-sm text-zinc-800 leading-relaxed">
            {post.content}
          </p>
        </div>
      )}

      {/* Media */}
      {post.media && post.media.length > 0 && (
        <div className="px-4 pb-4">
          <div
            className={`grid gap-2 ${
              post.media.length === 1
                ? 'grid-cols-1'
                : post.media.length === 2
                ? 'grid-cols-2'
                : 'grid-cols-2'
            }`}
          >
            {post.media.slice(0, 4).map((media: MediaItem, index: number) => (
              <div
                key={index}
                className="relative aspect-video overflow-hidden rounded bg-zinc-100"
                style={{
                  boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)',
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
        className="mt-auto px-4 py-2 border-t"
        style={{
          borderColor: 'rgba(0,0,0,0.05)',
          background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.01))',
        }}
      >
        <span className="text-xs text-zinc-400">
          {new Date(post.created_at).toLocaleDateString()}
        </span>
      </div>

      {/* Bottom shadow to lift card off whiteboard */}
      <div
        className="absolute -bottom-1 left-2 right-2 h-2 -z-10"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.1) 0%, transparent 70%)',
        }}
      />
    </div>
  );
}
