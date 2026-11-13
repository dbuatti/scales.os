import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/use-supabase-session';
import { isAdmin } from '@/lib/admin';

/**
 * Admin check backed by public.is_admin() (server-side truth).
 * Falls back to the build-time VITE_ADMIN_EMAIL list if the RPC is not deployed.
 */
export const useIsAdmin = () => {
  const { userId, session } = useSupabaseSession();

  const query = useQuery({
    queryKey: ['is-admin', userId],
    enabled: Boolean(userId),
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<boolean> => {
      if (isAdmin(session?.user?.email)) return true;

      const { data, error } = await supabase.rpc('is_admin');
      if (error) return false;
      return Boolean(data);
    },
  });

  return {
    isAdmin: Boolean(query.data),
    isLoading: query.isLoading,
  };
};