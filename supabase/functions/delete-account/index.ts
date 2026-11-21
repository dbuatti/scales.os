// Supabase Edge Function: self-serve Scales account deletion
//
// Deploy:
//   supabase functions deploy delete-account
//
// This Supabase project is SHARED with another app. We deliberately delete only
// Scales-owned rows and only this user's prefix in the Scales PDF bucket.
// auth.users and the other app's tables are never touched, so the shared login
// keeps working elsewhere.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4?target=deno';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Order matters: page mappings reference PDF documents.
const PRACTICE_TABLES = [
  'pdf_page_mappings',
  'pdf_documents',
  'practice_logs',
  'scale_permutations_mastery',
  'exercise_mastery',
  'user_progress',
] as const;

const PAGE_SIZE = 100;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const token = (req.headers.get('Authorization') ?? '')
    .replace(/^Bearer\s+/i, '')
    .trim();
  if (!token) return json({ error: 'Sign in to delete your Scales data.' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) {
    return json({ error: 'Server configuration error' }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // The user id always comes from the verified token, never from the request
  // body, so one account cannot delete another account's data.
  const { data, error: authError } = await supabase.auth.getUser(token);
  if (authError || !data?.user) {
    return json({ error: 'Your session has expired. Sign in again.' }, 401);
  }
  const userId = data.user.id;

  // 1. Files: collect this user's whole folder first, then remove in batches.
  //    Only the private 'practice-pdfs' bucket is in scope.
  const paths: string[] = [];
  let offset = 0;

  while (true) {
    const { data: objects, error: listError } = await supabase.storage
      .from('practice-pdfs')
      .list(userId, { limit: PAGE_SIZE, offset });

    if (listError) return json({ error: 'Could not find your method books.' }, 500);

    for (const object of objects ?? []) {
      if (object.name) paths.push(`${userId}/${object.name}`);
    }

    if (!objects || objects.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  for (let index = 0; index < paths.length; index += PAGE_SIZE) {
    const { error: removeError } = await supabase.storage
      .from('practice-pdfs')
      .remove(paths.slice(index, index + PAGE_SIZE));

    if (removeError) {
      return json({ error: 'Could not remove your method books.' }, 500);
    }
  }

  // 2. Rows: Scales-owned tables only. Never auth.users, public.profiles or
  //    anything else belonging to the other app on this shared project.
  for (const table of PRACTICE_TABLES) {
    const { error } = await supabase.from(table).delete().eq('user_id', userId);
    if (error) return json({ error: `Could not clear ${table}.` }, 500);
  }

  // Removing the entitlement row also drops Pro. usePlan() fails closed to free.
  const { error: profileError } = await supabase
    .from('scales_profiles')
    .delete()
    .eq('id', userId);
  if (profileError) {
    return json({ error: 'Could not remove your Scales profile.' }, 500);
  }

  return json({ ok: true });
});
