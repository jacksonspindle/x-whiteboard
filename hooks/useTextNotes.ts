'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TextNote } from '@/lib/types';
import { toast } from 'sonner';
import type { User } from '@supabase/supabase-js';

export function useTextNotes() {
  const [textNotes, setTextNotes] = useState<TextNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, [supabase]);

  const fetchTextNotes = useCallback(async () => {
    const { data, error } = await supabase
      .from('text_notes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching text notes:', error);
    } else {
      setTextNotes(data || []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchTextNotes();
  }, [fetchTextNotes]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`text-notes-user-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'text_notes',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          setTextNotes((prev) => {
            if (prev.some(n => n.id === (payload.new as TextNote).id)) {
              return prev;
            }
            return [payload.new as TextNote, ...prev];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'text_notes',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          setTextNotes((prev) => prev.filter((n) => n.id !== payload.old.id));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'text_notes',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          setTextNotes((prev) =>
            prev.map((n) => (n.id === payload.new.id ? (payload.new as TextNote) : n))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, user]);

  const createTextNote = useCallback(
    async (x: number, y: number) => {
      if (!user) {
        toast.error('You must be logged in to create text notes');
        return null;
      }

      const { data, error } = await supabase
        .from('text_notes')
        .insert({
          user_id: user.id,
          position_x: x,
          position_y: y,
          content: '',
          width: 200,
          height: 100,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating text note:', error);
        toast.error('Failed to create text note');
        return null;
      }
      return data as TextNote;
    },
    [supabase, user]
  );

  const updateTextNote = useCallback(
    async (id: string, updates: Partial<TextNote>) => {
      setTextNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, ...updates } : n))
      );

      const { error } = await supabase
        .from('text_notes')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error updating text note:', error);
        fetchTextNotes();
      }
    },
    [supabase, fetchTextNotes]
  );

  const deleteTextNote = useCallback(
    async (id: string) => {
      setTextNotes((prev) => prev.filter((n) => n.id !== id));

      const { error } = await supabase.from('text_notes').delete().eq('id', id);

      if (error) {
        console.error('Error deleting text note:', error);
        toast.error('Failed to delete text note');
        fetchTextNotes();
      }
    },
    [supabase, fetchTextNotes]
  );

  return {
    textNotes,
    loading,
    createTextNote,
    updateTextNote,
    deleteTextNote,
    refetch: fetchTextNotes,
  };
}
