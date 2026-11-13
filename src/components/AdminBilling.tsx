import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { showError, showSuccess } from '@/utils/toast';
import { Crown, Mail, RefreshCw } from 'lucide-react';
import type { Plan } from '@/lib/plan';

interface ProfileRow {
  id: string;
  email: string | null;
  plan: Plan;
  created_at: string;
}

interface WaitlistRow {
  id: string;
  email: string;
  created_at: string;
}

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

const AdminBilling: React.FC = () => {
  const queryClient = useQueryClient();

  const profiles = useQuery({
    queryKey: ['admin', 'profiles'],
    queryFn: async (): Promise<ProfileRow[]> => {
      const { data, error } = await supabase
        .from('scales_profiles')
        .select('id, email, plan, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ProfileRow[];
    },
  });

  const waitlist = useQuery({
    queryKey: ['admin', 'waitlist'],
    queryFn: async (): Promise<WaitlistRow[]> => {
      const { data, error } = await supabase
        .from('pro_waitlist')
        .select('id, email, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as WaitlistRow[];
    },
  });

  const updatePlan = useMutation({
    mutationFn: async ({ id, plan }: { id: string; plan: Plan }) => {
      const { error } = await supabase.from('scales_profiles').update({ plan }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess('Plan updated.');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'profiles'] });
    },
    onError: () => showError('Could not update the plan.'),
  });

  const proCount = profiles.data?.filter((row) => row.plan === 'pro').length ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Accounts', value: profiles.data?.length ?? 0 },
          { label: 'Pro', value: proCount },
          { label: 'Waitlist', value: waitlist.data?.length ?? 0 },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border/60 bg-muted/25 p-3">
            <p className="tnum text-xl font-black leading-none">{stat.value}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <Crown className="size-3.5" />
            Accounts
          </h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[11px] font-bold text-muted-foreground hover:text-primary"
            onClick={() => {
              void profiles.refetch();
              void waitlist.refetch();
            }}
          >
            <RefreshCw className="mr-1.5 size-3" />
            Refresh
          </Button>
        </div>

        {profiles.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-11 w-full bg-card/50" />
            <Skeleton className="h-11 w-full bg-card/50" />
          </div>
        ) : profiles.error ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
            Could not load accounts. Make sure the entitlements migration has been applied.
          </p>
        ) : (
          <ul className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/60 bg-card/40">
            {profiles.data?.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{row.email ?? 'No email'}</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Joined {formatDate(row.created_at)}
                  </p>
                </div>
                <Select
                  value={row.plan}
                  onValueChange={(value) => updatePlan.mutate({ id: row.id, plan: value as Plan })}
                >
                  <SelectTrigger className="h-8 w-28 text-xs font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                  </SelectContent>
                </Select>
              </li>
            ))}
            {profiles.data?.length === 0 && (
              <li className="px-3 py-4 text-xs text-muted-foreground">No accounts yet.</li>
            )}
          </ul>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <Mail className="size-3.5" />
          Pro waitlist
        </h3>
        {waitlist.isLoading ? (
          <Skeleton className="h-10 w-full bg-card/50" />
        ) : waitlist.error ? (
          <p className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
            Waitlist unavailable until the migration is applied.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {waitlist.data?.map((row) => (
              <li key={row.id}>
                <Badge variant="secondary" className="font-medium">
                  {row.email}
                </Badge>
              </li>
            ))}
            {waitlist.data?.length === 0 && (
              <li className="text-xs text-muted-foreground">No requests yet.</li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AdminBilling;