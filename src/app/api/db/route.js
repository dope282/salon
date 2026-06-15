// Generic database query endpoint (Supabase PostgREST-ийг орлоно).
// Client дахь drop-in supabase.from(...) builder энд POST хийнэ.
import { NextResponse } from 'next/server';
import { runQuery } from '@/lib/queryEngine';
import { identityFromRequest } from '@/lib/authToken';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  const identity = identityFromRequest(req);
  let desc;
  try {
    desc = await req.json();
  } catch {
    return NextResponse.json({ data: null, error: { message: 'Буруу хүсэлт' } }, { status: 400 });
  }
  const result = await runQuery(desc, identity);
  return NextResponse.json(result);
}
