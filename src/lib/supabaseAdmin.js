// Серверт ашиглах Supabase client (service role — RLS алгасна). ЗӨВХӨН серверт.
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = createClient(url, serviceKey || 'placeholder', {
  auth: { persistSession: false, autoRefreshToken: false },
});
