// Зураг байршуулах (Supabase Storage-ийг орлоно). Файлыг public/uploads-д хадгална.
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { identityFromRequest, isAdmin } from '@/lib/authToken';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  const identity = identityFromRequest(req);
  if (!isAdmin(identity)) return NextResponse.json({ error: 'Зөвхөн админ зураг байршуулна.' }, { status: 403 });

  const form = await req.formData();
  const file = form.get('file');
  const rawName = (form.get('name') || '').toString();
  if (!file || typeof file === 'string') return NextResponse.json({ error: 'Файл алга.' }, { status: 400 });

  const safe = (rawName.replace(/[^a-zA-Z0-9._-]/g, '_') || `img-${Date.now()}`).slice(0, 120);
  const dir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(dir, { recursive: true });
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, safe), buf);

  return NextResponse.json({ path: safe, publicUrl: `/uploads/${safe}` });
}
