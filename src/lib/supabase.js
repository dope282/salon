// Supabase JS client-ийн DROP-IN орлуулалт.
// Компонентууд хуучин `supabase.from(...).select()...`, `supabase.auth.*`,
// `supabase.storage.*`-аа өөрчлөхгүйгээр ашиглана. Доороо шинэ Node API руу fetch хийнэ.

// ── Олон админ имэйл (өмнөхтэй ижил) ──
export const ADMIN_EMAILS = (
  process.env.NEXT_PUBLIC_ADMIN_EMAILS ||
  process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
  'jaamaaj26@gmail.com,bdolmoosuren@gmail.com'
).split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);

export const ADMIN_EMAIL = ADMIN_EMAILS[0];
export const isAdminEmail = (email) => !!email && ADMIN_EMAILS.includes(email.toLowerCase());

const jsonHeaders = { 'Content-Type': 'application/json' };
const SESSION_KEY = 'salon_session';

// ── DB query builder (thenable) ──
class QueryBuilder {
  constructor(table) {
    this._d = { table, op: 'select', select: '*', filters: [], order: [], single: null, returning: false };
  }
  select(cols = '*') {
    if (this._d.op === 'select') this._d.select = cols || '*';
    else { this._d.returning = true; this._d.select = cols || '*'; }
    return this;
  }
  insert(values) { this._d.op = 'insert'; this._d.values = values; return this; }
  update(values) { this._d.op = 'update'; this._d.values = values; return this; }
  upsert(values) { this._d.op = 'upsert'; this._d.values = values; return this; }
  delete() { this._d.op = 'delete'; return this; }

  eq(col, val)   { this._d.filters.push({ col, op: 'eq',   val }); return this; }
  neq(col, val)  { this._d.filters.push({ col, op: 'neq',  val }); return this; }
  gt(col, val)   { this._d.filters.push({ col, op: 'gt',   val }); return this; }
  gte(col, val)  { this._d.filters.push({ col, op: 'gte',  val }); return this; }
  lt(col, val)   { this._d.filters.push({ col, op: 'lt',   val }); return this; }
  lte(col, val)  { this._d.filters.push({ col, op: 'lte',  val }); return this; }
  like(col, val) { this._d.filters.push({ col, op: 'like', val }); return this; }
  ilike(col, val){ this._d.filters.push({ col, op: 'ilike',val }); return this; }
  in(col, arr)   { this._d.filters.push({ col, op: 'in',   val: arr }); return this; }
  is(col, val)   { this._d.filters.push({ col, op: 'is',   val }); return this; }

  order(col, opts) { this._d.order.push({ col, ascending: opts?.ascending !== false }); return this; }
  limit(n) { this._d.limit = n; return this; }
  single() { this._d.single = 'single'; return this; }
  maybeSingle() { this._d.single = 'maybe'; return this; }

  _run() {
    return fetch('/api/db', {
      method: 'POST', headers: jsonHeaders, credentials: 'same-origin',
      body: JSON.stringify(this._d),
    })
      .then((r) => r.json())
      .catch((e) => ({ data: null, error: { message: e.message || 'Сүлжээний алдаа' } }));
  }
  then(resolve, reject) { return this._run().then(resolve, reject); }
  catch(cb) { return this._run().catch(cb); }
  finally(cb) { return this._run().finally(cb); }
}

// ── Auth shim ──
let _session = null;
const _subs = new Set();
function _emit(event) { _subs.forEach((cb) => { try { cb(event, _session); } catch {} }); }
function _store(s) {
  _session = s || null;
  if (typeof localStorage !== 'undefined') {
    if (_session) localStorage.setItem(SESSION_KEY, JSON.stringify(_session));
    else localStorage.removeItem(SESSION_KEY);
  }
}
async function _post(path, body) {
  const r = await fetch(path, { method: 'POST', headers: jsonHeaders, credentials: 'same-origin', body: JSON.stringify(body || {}) });
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok, j };
}

const auth = {
  async getSession() {
    try {
      const r = await fetch('/api/auth/session', { credentials: 'same-origin' });
      const j = await r.json();
      _store(j.session || null);
    } catch {
      if (!_session && typeof localStorage !== 'undefined') {
        try { _session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch {}
      }
    }
    return { data: { session: _session } };
  },

  onAuthStateChange(callback) {
    _subs.add(callback);
    return { data: { subscription: { unsubscribe: () => _subs.delete(callback) } } };
  },

  async signInWithPassword({ email, password }) {
    const { ok, j } = await _post('/api/auth/login', { email, password });
    if (!ok) return { data: { session: null, user: null }, error: { message: j.error || 'Нэвтрэх алдаа' } };
    _store(j.session); _emit('SIGNED_IN');
    return { data: { session: j.session, user: j.user }, error: null };
  },

  async signUp({ email, password, options }) {
    const { ok, j } = await _post('/api/auth/signup', { email, password, phone: options?.data?.phone });
    if (!ok) return { data: { session: null, user: null }, error: { message: j.error || 'Бүртгэлийн алдаа' } };
    _store(j.session); _emit('SIGNED_IN');
    return { data: { session: j.session, user: j.user }, error: null };
  },

  async signOut() {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }); } catch {}
    _store(null); _emit('SIGNED_OUT');
    return { error: null };
  },

  async resetPasswordForEmail(email, opts) {
    const { ok, j } = await _post('/api/auth/reset-request', { email, redirectTo: opts?.redirectTo });
    if (!ok) return { data: null, error: { message: j.error || 'Алдаа' } };
    return { data: {}, error: null };
  },

  async updateUser({ password }) {
    const { ok, j } = await _post('/api/auth/update-password', { password });
    if (!ok) return { data: { user: null }, error: { message: j.error || 'Алдаа' } };
    if (j.session) { _store(j.session); _emit('USER_UPDATED'); }
    return { data: { user: j.session?.user || _session?.user || null }, error: null };
  },
};

// ── Storage shim ──
const storage = {
  from(bucket) {
    return {
      async upload(name, file) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('name', name);
        fd.append('bucket', bucket);
        const r = await fetch('/api/storage/upload', { method: 'POST', credentials: 'same-origin', body: fd });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) return { data: null, error: { message: j.error || 'Зураг байршуулах алдаа' } };
        return { data: { path: j.path }, error: null };
      },
      getPublicUrl(name) {
        return { data: { publicUrl: `/uploads/${name}` } };
      },
    };
  },
};

export const supabase = {
  from: (table) => new QueryBuilder(table),
  auth,
  storage,
};
