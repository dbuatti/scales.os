import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

// Supabase browser client. Credentials are injected through validated env vars
// (see src/lib/env.ts) instead of being hardcoded into the bundle source.
export const supabase = createClient(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_ANON_KEY,
);
