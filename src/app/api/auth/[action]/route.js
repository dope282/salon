// Auth API (Supabase Auth/GoTrue-г орлоно): signup/login/logout/session/reset-request/reset-confirm.
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { randomUUID, randomBytes } from 'crypto';
import { query } from '@/lib/db';
import {
  signToken, sessionCookieValue, clearCookieValue,
  identityFromRequest, sessionFromIdentity, roleForEmail,
} from '@/lib/authToken';
import { sendResetEmail } from '@/lib/mailer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const json = (obj, init) => NextResponse.json(obj, init);
const withCookie = (obj, cookie) => {
  const res = NextResponse.json(obj);
  res.headers.set('Set-Cookie', cookie);
  return res;
};

export async function GET(req, { params }) {
  const { action } = await params;
  if (action === 'session') {
    const identity = identityFromRequest(req);
    return json({ session: sessionFromIdentity(identity) });
  }
  return json({ error: 'unknown action' }, { status: 404 });
}

export async function POST(req, { params }) {
  const { action } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    switch (action) {
      case 'signup':        return await signup(body);
      case 'login':         return await login(body);
      case 'logout':        return withCookie({ ok: true }, clearCookieValue());
      case 'reset-request': return await resetRequest(body);
      case 'reset-confirm': return await resetConfirm(body);
      case 'update-password': return await updatePassword(req, body);
      default:              return json({ error: 'unknown action' }, { status: 404 });
    }
  } catch (e) {
    return json({ error: e.message || 'Алдаа' }, { status: 400 });
  }
}

async function signup({ email, password, phone }) {
  email = String(email || '').trim().toLowerCase();
  if (!email || !password) throw new Error('Имэйл болон нууц үг шаардлагатай.');
  const existing = await query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
  if (existing.length) throw new Error('User already registered');
  const id = randomUUID();
  const role = roleForEmail(email);
  const hash = bcrypt.hashSync(String(password), 10);
  await query('INSERT INTO users (id, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)',
    [id, email, hash, phone || null, role]);
  const identity = { id, email, role, phone: phone || null };
  const session = sessionFromIdentity(identity);
  return withCookie({ user: session.user, session }, sessionCookieValue(signToken(identity)));
}

async function login({ email, password }) {
  email = String(email || '').trim().toLowerCase();
  const rows = await query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
  const u = rows[0];
  if (!u || !bcrypt.compareSync(String(password || ''), u.password_hash)) {
    throw new Error('Invalid login credentials');
  }
  const role = roleForEmail(email); // админ жагсаалт өөрчлөгдсөн байж болзошгүй
  if (role !== u.role) await query('UPDATE users SET role = ? WHERE id = ?', [role, u.id]);
  const identity = { id: u.id, email: u.email, role, phone: u.phone };
  const session = sessionFromIdentity(identity);
  return withCookie({ user: session.user, session }, sessionCookieValue(signToken(identity)));
}

async function resetRequest({ email, redirectTo }) {
  email = String(email || '').trim().toLowerCase();
  const rows = await query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
  if (rows.length) {
    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 цаг
    await query('INSERT INTO password_resets (token, user_id, expires_at) VALUES (?, ?, ?)',
      [token, rows[0].id, expires.toISOString().slice(0, 19).replace('T', ' ')]);
    const base = redirectTo || `${process.env.NEXT_PUBLIC_SITE_URL || ''}/reset-password`;
    const link = `${base}${base.includes('?') ? '&' : '?'}token=${token}`;
    try { await sendResetEmail(email, link); } catch (e) { console.error('[reset email]', e.message); }
  }
  // Имэйл байгаа эсэхийг илчлэхгүй
  return json({ ok: true });
}

async function resetConfirm({ token, password }) {
  if (!token || !password) throw new Error('Token болон шинэ нууц үг шаардлагатай.');
  const rows = await query('SELECT * FROM password_resets WHERE token = ? LIMIT 1', [token]);
  const pr = rows[0];
  if (!pr || new Date(pr.expires_at) < new Date()) throw new Error('Холбоос хүчингүй эсвэл хугацаа дууссан.');
  const hash = bcrypt.hashSync(String(password), 10);
  await query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, pr.user_id]);
  await query('DELETE FROM password_resets WHERE token = ?', [token]);
  const urows = await query('SELECT * FROM users WHERE id = ? LIMIT 1', [pr.user_id]);
  const u = urows[0];
  const identity = { id: u.id, email: u.email, role: roleForEmail(u.email), phone: u.phone };
  return withCookie({ ok: true, session: sessionFromIdentity(identity) }, sessionCookieValue(signToken(identity)));
}

async function updatePassword(req, { password }) {
  const identity = identityFromRequest(req);
  if (!identity) throw new Error('Нэвтрээгүй байна.');
  if (!password) throw new Error('Шинэ нууц үг шаардлагатай.');
  const hash = bcrypt.hashSync(String(password), 10);
  await query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, identity.id]);
  return json({ ok: true, session: sessionFromIdentity(identity) });
}
