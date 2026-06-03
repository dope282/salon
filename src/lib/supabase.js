import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_anon_key';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Олон админ имэйл (env-ээр нэмж болно: NEXT_PUBLIC_ADMIN_EMAILS=a@x.com,b@y.com)
export const ADMIN_EMAILS = (
  process.env.NEXT_PUBLIC_ADMIN_EMAILS ||
  process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
  'jaamaaj26@gmail.com,bdolmoosuren@gmail.com'
).split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

export const ADMIN_EMAIL = ADMIN_EMAILS[0];
export const isAdminEmail = (email) => !!email && ADMIN_EMAILS.includes(email.toLowerCase());
