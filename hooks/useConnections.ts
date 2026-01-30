'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Connection } from '@/lib/types';
import { toast } from 'sonner';
import type { User } from '@supabase/supabase-js';

export function useConnections() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, [supabase]);

  const fetchConnections = useCallback(async () => {
    const { data, error } = await supabase
      .from('connections')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching connections:', error);
    } else {
      setConnections(data || []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`connections-user-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'connections',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          setConnections((prev) => {
            if (prev.some(c => c.id === (payload.new as Connection).id)) {
              return prev;
            }
            return [payload.new as Connection, ...prev];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'connections',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          setConnections((prev) => prev.filter((c) => c.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, user]);

  const createConnection = useCallback(
    async (fromId: string, fromType: 'post' | 'textNote', toId: string, toType: 'post' | 'textNote') => {
      if (!user) {
        toast.error('You must be logged in to create connections');
        return null;
      }

      // Don't allow self-connections
      if (fromId === toId) return null;

      // Don't allow duplicate connections
      const existing = connections.find(
        c => c.from_id === fromId && c.to_id === toId
      );
      if (existing) return null;

      const { data, error } = await supabase
        .from('connections')
        .insert({
          user_id: user.id,
          from_id: fromId,
          from_type: fromType,
          to_id: toId,
          to_type: toType,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating connection:', error);
        toast.error('Failed to create connection');
        return null;
      }

      return data as Connection;
    },
    [supabase, user, connections]
  );

  const deleteConnection = useCallback(
    async (id: string) => {
      setConnections((prev) => prev.filter((c) => c.id !== id));

      const { error } = await supabase.from('connections').delete().eq('id', id);

      if (error) {
        console.error('Error deleting connection:', error);
        toast.error('Failed to delete connection');
        fetchConnections();
      }
    },
    [supabase, fetchConnections]
  );

  return {
    connections,
    loading,
    createConnection,
    deleteConnection,
    refetch: fetchConnections,
  };
}
