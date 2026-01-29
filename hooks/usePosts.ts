'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Post } from '@/lib/types';
import { toast } from 'sonner';
import type { User } from '@supabase/supabase-js';

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      console.log('Current user:', user?.id);
    });
  }, [supabase]);

  const fetchPosts = useCallback(async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts');
    } else {
      console.log('Fetched posts:', data?.length);
      setPosts(data || []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Set up realtime subscription after we have the user
  useEffect(() => {
    if (!user) return;

    console.log('Setting up realtime subscription for user:', user.id);

    // Subscribe to realtime changes for this user's posts
    const channel = supabase
      .channel(`posts-user-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Realtime INSERT received:', payload);
          setPosts((prev) => {
            // Avoid duplicates
            if (prev.some(p => p.id === (payload.new as Post).id)) {
              return prev;
            }
            return [payload.new as Post, ...prev];
          });
          toast.success('New post added!');
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'posts',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Realtime DELETE received:', payload);
          setPosts((prev) => prev.filter((p) => p.id !== payload.old.id));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'posts',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Realtime UPDATE received:', payload);
          setPosts((prev) =>
            prev.map((p) => (p.id === payload.new.id ? (payload.new as Post) : p))
          );
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [supabase, user]);

  const updatePosition = useCallback(
    async (id: string, x: number, y: number) => {
      // Optimistic update
      setPosts((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, position_x: x, position_y: y } : p
        )
      );

      const { error } = await supabase
        .from('posts')
        .update({ position_x: x, position_y: y })
        .eq('id', id);

      if (error) {
        console.error('Error updating position:', error);
        fetchPosts();
      }
    },
    [supabase, fetchPosts]
  );

  const deletePost = useCallback(
    async (id: string) => {
      // Optimistic update
      setPosts((prev) => prev.filter((p) => p.id !== id));

      const { error } = await supabase.from('posts').delete().eq('id', id);

      if (error) {
        console.error('Error deleting post:', error);
        toast.error('Failed to delete post');
        fetchPosts();
      } else {
        toast.success('Post deleted');
      }
    },
    [supabase, fetchPosts]
  );

  return {
    posts,
    loading,
    updatePosition,
    deletePost,
    refetch: fetchPosts,
  };
}
