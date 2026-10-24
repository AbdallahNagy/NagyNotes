import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null | undefined;

/**
 * The shared Supabase client, or `null` when `PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_ANON_KEY`
 * are not set. Readers never sign in, so no session is stored or refreshed.
 */
export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;

  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  client =
    url && anonKey
      ? createClient(url, anonKey, {
          auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        })
      : null;
  return client;
}

export const commentsConfigured = (): boolean => getSupabase() !== null;
