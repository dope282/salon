// Байршуулсан зургийг serve хийнэ (Next.js нь runtime-д public/-д нэмсэн файлыг өгдөггүй тул).
import { readFile } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TYPES = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.avif': 'image/avif', '.bmp': 'image/bmp',
};

export async function GET(req, { params }) {
  const { name } = await params;
  const safe = path.basename(name || ''); // path traversal-аас хамгаална
  if (!safe) return new Response('Bad request', { status: 400 });
  try {
    const buf = await readFile(path.join(process.cwd(), 'uploads', safe));
    const ext = path.extname(safe).toLowerCase();
    return new Response(buf, {
      headers: {
        'Content-Type': TYPES[ext] || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
