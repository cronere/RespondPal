import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client using the service role key.
// Only import this in API routes / server code — never in client components.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
