import { z } from 'zod';

// ASCII-only guard: Supabase credentials are sent in HTTP headers, which must
// be Latin-1/ASCII. A stray non-ASCII character (e.g. a smart quote or newline
// pasted into Vercel) would otherwise surface as an opaque browser `fetch`
// error at runtime ("String contains non ISO-8859-1 code point").
//
// Values are trimmed first so a leading/trailing space or newline from
// copy-pasting into Vercel does not take the whole app down.
const ascii = /^[\x20-\x7e]*$/;

const envSchema = z.object({
  VITE_SUPABASE_URL: z
    .string({ required_error: 'VITE_SUPABASE_URL is required' })
    .trim()
    .url('VITE_SUPABASE_URL must be a valid URL')
    .regex(ascii, 'VITE_SUPABASE_URL must contain only ASCII characters'),
  VITE_SUPABASE_ANON_KEY: z
    .string({ required_error: 'VITE_SUPABASE_ANON_KEY is required' })
    .trim()
    .min(1, 'VITE_SUPABASE_ANON_KEY is required')
    .regex(ascii, 'VITE_SUPABASE_ANON_KEY must contain only ASCII characters'),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse({
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
});

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || 'env'}: ${issue.message}`)
    .join('\n');
  throw new Error(
    `Missing or invalid environment configuration:\n${details}\n\n` +
      'Fix it in Vercel → Settings → Environment Variables (and in your local ' +
      '.env). Make sure each value is plain ASCII with no hidden/Unicode ' +
      'characters or stray line breaks — re-paste directly from Supabase → ' +
      'Project Settings → API.',
  );
}

export const env: Env = parsed.data;
