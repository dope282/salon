// JWT + cookie туслахууд (Supabase Auth-ийн session-г орлоно). ЗӨВХӨН серверт.
import jwt from 'jsonwebtoken';

const SECRET = process.env.AUTH_SECRET || 'dev-insecure-secret-change-me';
export const COOKIE_NAME = 'salon_session';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 хоног (секунд)

// Админ имэйлүүд (client талын supabase.js-тэй ижил env). Сервер талд role тогтооход.
export function adminEmails() {
  return (
    process.env.NEXT_PUBLIC_ADMIN_EMAILS ||
    process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
    'jaamaaj26@gmail.com,bdolmoosuren@gmail.com'
  )
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function roleForEmail(email) {
  return email && adminEmails().includes(String(email).toLowerCase()) ? 'admin' : 'customer';
}

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, phone: user.phone || null },
    SECRET,
    { expiresIn: '30d' }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

// NextRequest-ээс identity гаргана. { id, email, role, phone } | null
export function identityFromRequest(req) {
  const token = req.cookies?.get?.(COOKIE_NAME)?.value;
  if (!token) return null;
  const data = verifyToken(token);
  if (!data) return null;
  return { id: data.sub, email: data.email, role: data.role, phone: data.phone };
}

export function isAdmin(identity) {
  return !!identity && identity.role === 'admin';
}

// Set-Cookie утга
export function sessionCookieValue(token) {
  const secure = process.env.NODE_ENV === 'production' ? ' Secure;' : '';
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE};${secure}`;
}

export function clearCookieValue() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0;`;
}

// JWT-ээс client-д буцаах session объект (Supabase session.user-тэй ойролцоо хэлбэр)
export function sessionFromIdentity(identity) {
  if (!identity) return null;
  return {
    user: {
      id: identity.id,
      email: identity.email,
      role: identity.role,
      phone: identity.phone,
      user_metadata: { phone: identity.phone },
    },
  };
}
