-- Phase 1 security baseline: row level security for all user-owned tables.
-- Safe to run multiple times (idempotent) and additive (never drops data).
-- Apply in the Supabase dashboard: SQL Editor -> paste -> Run.

do $$
declare
  target_table text;
  user_tables text[] := array[
    'pdf_documents',
    'pdf_page_mappings',
    'user_progress',
    'scale_permutations_mastery',
    'exercise_mastery',
    'practice_logs'
  ];
begin
  foreach target_table in array user_tables loop
    -- Skip tables that do not exist yet so the migration stays additive.
    if to_regclass(format('public.%I', target_table)) is null then
      raise notice 'skipping %, table does not exist', target_table;
      continue;
    end if;

    execute format(
      'alter table public.%I enable row level security',
      target_table
    );

    -- Re-create a single owner policy so users can only touch their own rows.
    execute format(
      'drop policy if exists scales_owner_all on public.%I',
      target_table
    );
    execute format(
      'create policy scales_owner_all on public.%I '
      || 'for all to authenticated '
      || 'using (user_id = auth.uid()) '
      || 'with check (user_id = auth.uid())',
      target_table
    );
  end loop;
end $$;
