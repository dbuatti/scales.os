-- ============================================================================
-- 0006_default_repertoire.sql
-- Default repertoire books preloaded for new users.
--
-- Adds an is_default flag to pdf_documents so default books don't count
-- toward the free PDF limit. The enforce_pdf_limit() trigger is updated
-- to exclude is_default documents from the count.
-- Safe to run multiple times.
-- ============================================================================

alter table public.pdf_documents
  add column if not exists is_default boolean not null default false;

create index if not exists idx_pdf_documents_is_default
  on public.pdf_documents (is_default);

-- Update the PDF limit trigger to not count default books toward the free limit.
create or replace function public.enforce_pdf_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text;
begin
  select plan into v_plan from public.scales_profiles where id = new.user_id;

  if coalesce(v_plan, 'free') <> 'pro' then
    -- Only count non-default documents toward the free limit.
    if (
      select count(*)
      from public.pdf_documents
      where user_id = new.user_id
        and not is_default
    ) >= 2 then
      raise exception 'FREE_PDF_LIMIT' using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

-- Re-create the trigger with the updated function.
drop trigger if exists pdf_limit_guard on public.pdf_documents;
create trigger pdf_limit_guard
  before insert on public.pdf_documents
  for each row execute function public.enforce_pdf_limit();

-- ============================================================================
