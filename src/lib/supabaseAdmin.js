// Серверт ашиглах Supabase client (service role — RLS алгасна). ЗӨВХӨН серверт.
import { createClient } from '@supabase/supabase-js';

// Build үед env байхгүй байж болзошгүй тул placeholder-аар хамгаална (runtime дээр бодит утга орно)
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_service_key';

export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
