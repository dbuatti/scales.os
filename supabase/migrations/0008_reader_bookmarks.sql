-- ============================================================================
-- 0008_reader_bookmarks.sql
-- Clean up method-book bookmarks and make built-in PDF titles readable.
-- Safe to run multiple times.
-- ============================================================================

-- Friendly names for the bundled IMSLP editions.
update public.pdf_documents
set title = 'Hanon — The Virtuoso Pianist (Complete)'
where title ilike '%IMSLP91547%'
   or title ilike '%Hanon_Final%';

update public.pdf_documents
set title = 'Dohnányi — Essential Finger Exercises'
where title ilike '%IMSLP461147%'
   or title ilike '%Dohnanyi%SUVINI%';

-- Older bookmark suggestions could attach Hanon exercises to a Dohnányi PDF
-- (or vice versa). Recover the exercise number from the label where possible.
with mislabeled as (
  select
    m.id,
    (regexp_match(m.label, '(^|[^0-9])([1-9]|10)([^0-9]|$)'))[2]::int as exercise_number
  from public.pdf_page_mappings m
  join public.pdf_documents d on d.id = m.document_id
  where (d.title ilike '%dohnanyi%' or d.title ilike '%dohnányi%')
    and m.exercise_id like 'Hanon-%'
)
update public.pdf_page_mappings m
set exercise_id = case w.exercise_number
    when 1 then 'Dohnanyi-ExerciseI'
    when 2 then 'Dohnanyi-ExerciseII'
    when 3 then 'Dohnanyi-ExerciseIII'
    when 4 then 'Dohnanyi-ExerciseIV'
    when 5 then 'Dohnanyi-ExerciseV'
    when 6 then 'Dohnanyi-ExerciseVI'
    when 7 then 'Dohnanyi-ExerciseVII'
    when 8 then 'Dohnanyi-ExerciseVIII'
    when 9 then 'Dohnanyi-ExerciseIX'
    when 10 then 'Dohnanyi-ExerciseX'
  end,
  label = 'Dohnányi No. ' || w.exercise_number::text
from mislabeled w
where m.id = w.id
  and w.exercise_number between 1 and 10;

-- Make Hanon bookmark labels consistent: "Hanon No. N".
with hanon_labels as (
  select
    m.id,
    (regexp_match(m.label, '(^|[^0-9])([0-9]{1,2})([^0-9]|$)'))[2]::int as exercise_number
  from public.pdf_page_mappings m
  join public.pdf_documents d on d.id = m.document_id
  where d.title ilike '%hanon%'
    and m.exercise_id like 'Hanon-%'
)
update public.pdf_page_mappings m
set label = 'Hanon No. ' || h.exercise_number::text
from hanon_labels h
where m.id = h.id
  and h.exercise_number between 1 and 60;

-- Anything still cross-wired is safer removed than shown under the wrong book.
delete from public.pdf_page_mappings m
using public.pdf_documents d
where m.document_id = d.id
  and (
    ((d.title ilike '%dohnanyi%' or d.title ilike '%dohnányi%') and m.exercise_id like 'Hanon-%')
    or (d.title ilike '%hanon%' and m.exercise_id like 'Dohnanyi-%')
  );
