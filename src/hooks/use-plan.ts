import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/use-supabase-session';
import { isProPlan, type Plan } from '@/lib/plan';

interface UsePlanResult {
  plan: Plan;
  isPro: boolean;
  isLoading: boolean;
  refresh: () => Promise<unknown>;
}

/**
 * Reads the signed-in user's plan from public.scales_profiles.
 * Fails closed to 'free' if the table is missing or the request errors, so a
 * billing migration can never lock people out of the practice loop.
 */
export const usePlan = (): UsePlanResult => {
  const { userId, isLoading: isSessionLoading } = useSupabaseSession();

  const query = useQuery({
    queryKey: ['plan', userId],
    enabled: Boolean(userId),
    staleTime: 60_000,
    queryFn: async (): Promise<Plan> => {
      const { data, error } = await supabase
        .from('scales_profiles')
        .select('plan')
        .eq('id', userId)
        .maybeSingle();

      if (error) return 'free';
      return data?.plan === 'pro' ? 'pro' : 'free';
    },
  });

  const plan: Plan = query.data ?? 'free';

  return {
    plan,
    isPro: isProPlan(plan),
    isLoading: isSessionLoading || (Boolean(userId) && query.isLoading),
    refresh: query.refetch,
  };
};