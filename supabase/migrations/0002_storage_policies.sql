-- Phase 1 security baseline: lock down the private practice-pdfs bucket.
-- Uploads are stored at "<user_id>/<document_id>.pdf"; access is scoped to that
-- path prefix so one user can never read or mutate another user's files.
-- Safe to run multiple times (idempotent) and additive.

insert into storage.buckets (id, name, public)
values ('practice-pdfs', 'practice-pdfs', false)
on conflict (id) do update set public = false;

drop policy if exists practice_pdfs_select on storage.objects;
create policy practice_pdfs_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'practice-pdfs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists practice_pdfs_insert on storage.objects;
create policy practice_pdfs_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'practice-pdfs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists practice_pdfs_update on storage.objects;
create policy practice_pdfs_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'practice-pdfs'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'practice-pdfs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists practice_pdfs_delete on storage.objects;
create policy practice_pdfs_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'practice-pdfs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
