// Server-side Supabase client using the publishable (anon) key.
// Works without SUPABASE_SERVICE_ROLE_KEY so the app can run locally
// with only publishable credentials. Relies on RLS policies for access control.
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const key =
  process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error(
    "[Supabase] Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY env vars."
  );
}

export const supabaseServer = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
