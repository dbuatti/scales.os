import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const useSupabaseSession = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const applySession = (nextSession: Session | null) => {
      if (!active) return;
      setSession(nextSession);
      setUserId(nextSession?.user?.id ?? null);
      setIsLoading(false);
    };

    const fetchSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        applySession(session);
      } catch (error) {
        console.error('Failed to load Supabase session', error);
        applySession(null);
      }
    };

    void fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return { session, userId, isLoading };
};
