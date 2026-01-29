'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Whiteboard from '@/components/Whiteboard';
import AuthButton from '@/components/AuthButton';
import { usePosts } from '@/hooks/usePosts';
import { Layers, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function WhiteboardPage() {
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { posts, loading, updatePosition, deletePost } = usePosts();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
      } else {
        setIsAuthenticated(true);
      }
      setAuthLoading(false);
    };

    checkAuth();
  }, [supabase.auth, router]);

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <Link href="/" className="flex items-center gap-2">
          <Layers className="h-6 w-6 text-blue-600" />
          <span className="text-lg font-bold">X Whiteboard</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-500">
            {posts.length} post{posts.length !== 1 ? 's' : ''}
          </span>
          <AuthButton />
        </div>
      </header>

      {/* Whiteboard */}
      <div className="flex-1">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <Whiteboard
            posts={posts}
            onUpdatePosition={updatePosition}
            onDeletePost={deletePost}
          />
        )}
      </div>
    </div>
  );
}
