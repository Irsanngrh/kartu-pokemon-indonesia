import { createClient as supabaseCreateClient } from '@supabase/supabase-js';

// Anon key client for browser-side database reads.
export function createClient() {
  return supabaseCreateClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
