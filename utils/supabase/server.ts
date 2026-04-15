import { createClient as supabaseCreateClient } from '@supabase/supabase-js';

// Service role client for all server-side operations.
// Auth is verified via Auth.js session before any user-specific queries.
export function createClient() {
  return supabaseCreateClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
