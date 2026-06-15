// Supabase PostgREST query-г орлох сервер талын SQL engine.
// Client-ээс ирсэн query-descriptor-г whitelist + параметртэй SQL болгож,
// JWT identity дээр үндэслэн эрхийг (RLS-ийн оронд) шалгана. ЗӨВХӨН серверт.
import { randomUUID } from 'crypto';
import { query } from './db';

// ── Хүснэгтийн тодорхойлолт (баганын whitelist) ──
const SCHEMA = {
  services: {
    pk: 'id', pkType: 'int',
    cols: ['id','name_mn','description_mn','price_from','duration_min','emoji','image_url','images','deposit','active','created_at'],
    json: ['images'], bool: ['active'],
    read: 'public', insert: 'admin', update: 'admin', delete: 'admin',
  },
  artists: {
    pk: 'id', pkType: 'int',
    cols: ['id','name','specialty_mn','rating','review_count','avatar_emoji','image_url','email','deposit','pay_qpay','pay_cash','active','created_at'],
    json: [], bool: ['pay_qpay','pay_cash','active'],
    read: 'public', insert: 'admin', update: 'admin', delete: 'admin',
  },
  bookings: {
    pk: 'id', pkType: 'uuid',
    cols: ['id','customer_name','customer_phone','customer_email','service_name','artist_name','booking_date','booking_time','payment_method','status','total_price','duration_min','notes','user_id','qpay_invoice_id','paid','paid_at','deposit_amount','created_at'],
    json: [], bool: ['paid'], dt: ['paid_at', 'created_at'],
    read: 'bookingRead', insert: 'public', update: 'adminOrArtistBooking', delete: 'bookingDelete',
  },
  products: {
    pk: 'id', pkType: 'uuid',
    cols: ['id','name','description','price','image_url','images','category','in_stock','active','sort_order','deposit','created_at'],
    json: ['images'], bool: ['in_stock','active'],
    read: 'publicActive', insert: 'admin', update: 'admin', delete: 'admin',
  },
  site_settings: {
    pk: 'key', pkType: 'str',
    cols: ['key','value','updated_at'],
    json: [], bool: [], dt: ['updated_at'],
    read: 'public', insert: 'admin', update: 'admin', delete: 'admin', upsert: 'admin',
  },
  packages: {
    pk: 'id', pkType: 'int',
    cols: ['id','name','description','price','original_price','emoji','image_url','images','duration_min','deposit','active','sort_order','created_at'],
    json: ['images'], bool: ['active'],
    read: 'publicActive', insert: 'admin', update: 'admin', delete: 'admin',
  },
  package_services: {
    pk: null, composite: ['package_id','service_id'],
    cols: ['package_id','service_id'],
    json: [], bool: [],
    embeds: { services: { table: 'services', localKey: 'service_id', fk: 'id' } },
    read: 'public', insert: 'admin', update: 'admin', delete: 'admin',
  },
  artist_packages: {
    pk: null, composite: ['artist_id','package_id'],
    cols: ['artist_id','package_id'],
    json: [], bool: [],
    read: 'public', insert: 'admin', update: 'admin', delete: 'admin',
  },
  artist_schedules: {
    pk: 'id', pkType: 'int',
    cols: ['id','artist_id','day_of_week','start_time','end_time','is_active'],
    json: [], bool: ['is_active'],
    read: 'public', insert: 'adminOrArtistSchedule', update: 'adminOrArtistSchedule', delete: 'adminOrArtistSchedule',
  },
  artist_services: {
    pk: null, composite: ['artist_id','service_id'],
    cols: ['artist_id','service_id'],
    json: [], bool: [],
    read: 'public', insert: 'admin', update: 'admin', delete: 'admin',
  },
  trainings: {
    pk: 'id', pkType: 'int',
    cols: ['id','title','description','image_url','images','price','duration','level','schedule','deposit','active','sort_order','created_at'],
    json: ['images'], bool: ['active'],
    read: 'publicActive', insert: 'admin', update: 'admin', delete: 'admin',
  },
  product_orders: {
    pk: 'id', pkType: 'uuid',
    cols: ['id','item_type','product_id','product_name','quantity','price','customer_phone','customer_email','qpay_invoice_id','paid','paid_at','status','user_id','created_at'],
    json: [], bool: ['paid'], dt: ['paid_at', 'created_at'],
    read: 'ownerRead', insert: 'public', update: 'admin', delete: 'admin',
  },
};

// Booking-ийн "сул цаг" тооцоход анон уншиж болох баганууд
const SLOT_COLS = ['id','artist_name','booking_date','booking_time','duration_min','status'];

export function adminIdentity() {
  return { id: null, email: null, role: 'admin', phone: null };
}
const isAdmin = (id) => !!id && id.role === 'admin';
const q = (c) => '`' + c + '`';
const conv = (v) => (v === true ? 1 : v === false ? 0 : v);
const err = (message) => ({ data: null, error: { message } });

// ISO огноо ('2026-06-14T..Z') → MySQL DATETIME ('2026-06-14 ..')
const toMysqlDT = (v) => {
  if (v == null) return v;
  if (v instanceof Date) return v.toISOString().slice(0, 19).replace('T', ' ');
  if (typeof v === 'string' && /\d{4}-\d\d-\d\dT/.test(v)) {
    const d = new Date(v);
    return isNaN(d) ? v : d.toISOString().slice(0, 19).replace('T', ' ');
  }
  return v;
};

function assertCol(meta, c) {
  if (!meta.cols.includes(c)) throw new Error(`Зөвшөөрөгдөөгүй багана: ${c}`);
}

async function resolveArtist(identity) {
  if (!identity?.email) return null;
  const rows = await query('SELECT id, name FROM artists WHERE email = ? LIMIT 1', [identity.email]);
  return rows[0] || null;
}

// ── Column конверс: унших үед JSON parse + boolean болгох ──
function decodeRow(meta, row) {
  for (const c of meta.json) {
    if (c in row) {
      if (row[c] == null) row[c] = [];
      else if (typeof row[c] === 'string') { try { row[c] = JSON.parse(row[c]); } catch { row[c] = []; } }
    }
  }
  for (const c of meta.bool) {
    if (c in row && row[c] != null) row[c] = !!row[c];
  }
  return row;
}
// ── Бичих утгыг бэлдэх: JSON stringify + boolean→0/1 ──
function encodeValue(meta, col, val) {
  if (meta.json.includes(col)) return val == null ? null : (typeof val === 'string' ? val : JSON.stringify(val));
  if (meta.dt?.includes(col) && val != null) return toMysqlDT(val);
  return conv(val);
}

// ── WHERE үүсгэгч ──
function buildWhere(meta, filters, extra) {
  const clauses = [];
  const params = [];
  for (const f of filters || []) {
    assertCol(meta, f.col);
    const col = q(f.col);
    switch (f.op) {
      case 'eq':   clauses.push(`${col} = ?`);  params.push(conv(f.val)); break;
      case 'neq':  clauses.push(`${col} <> ?`); params.push(conv(f.val)); break;
      case 'gt':   clauses.push(`${col} > ?`);  params.push(conv(f.val)); break;
      case 'gte':  clauses.push(`${col} >= ?`); params.push(conv(f.val)); break;
      case 'lt':   clauses.push(`${col} < ?`);  params.push(conv(f.val)); break;
      case 'lte':  clauses.push(`${col} <= ?`); params.push(conv(f.val)); break;
      case 'like': clauses.push(`${col} LIKE ?`);  params.push(f.val); break;
      case 'ilike':clauses.push(`${col} LIKE ?`);  params.push(f.val); break;
      case 'in':   clauses.push(`${col} IN (?)`);  params.push((f.val || []).map(conv)); break;
      case 'is':
        if (f.val === null) clauses.push(`${col} IS NULL`);
        else { clauses.push(`${col} = ?`); params.push(conv(f.val)); }
        break;
      default: throw new Error(`Зөвшөөрөгдөөгүй оператор: ${f.op}`);
    }
  }
  for (const e of extra || []) { clauses.push(e.sql); params.push(...e.params); }
  return { sql: clauses.length ? ' WHERE ' + clauses.join(' AND ') : '', params };
}

// ── Унших эрхийн политик → нэмэлт WHERE / хоосон үр дүн ──
async function readPolicy(meta, table, plainCols, identity) {
  if (isAdmin(identity)) return { extra: [] };
  switch (meta.read) {
    case 'public':
      return { extra: [] };
    case 'publicActive':
      return { extra: [{ sql: '`active` = ?', params: [1] }] };
    case 'bookingRead': {
      const slotOnly = plainCols.every((c) => SLOT_COLS.includes(c));
      if (slotOnly) return { extra: [] }; // сул цаг тооцох — бүх мөр, зөвхөн slot багана
      const ors = [];
      const params = [];
      if (identity?.id) { ors.push('(user_id = ? OR customer_email = ?)'); params.push(identity.id, identity.email); }
      const artist = await resolveArtist(identity);
      if (artist) { ors.push('artist_name = ?'); params.push(artist.name); }
      if (!ors.length) return { empty: true };
      return { extra: [{ sql: '(' + ors.join(' OR ') + ')', params }] };
    }
    case 'ownerRead': {
      if (identity?.id) return { extra: [{ sql: '(user_id = ? OR customer_email = ?)', params: [identity.id, identity.email] }] };
      return { empty: true };
    }
    default:
      return { empty: true };
  }
}

// ── Бичих эрхийн политик (insert/update/delete) ──
// буцаана: { ok, forcedRow?, extraWhere? } эсвэл { forbidden: true }
async function writePolicy(meta, mode, identity) {
  const policy = meta[mode] || meta.update;
  if (policy === 'admin') {
    return isAdmin(identity) ? { ok: true } : { forbidden: true };
  }
  if (policy === 'public') {
    return { ok: true };
  }
  if (policy === 'adminOrArtistBooking') {
    if (isAdmin(identity)) return { ok: true };
    const artist = await resolveArtist(identity);
    if (!artist) return { forbidden: true };
    return { ok: true, extraWhere: [{ sql: 'artist_name = ?', params: [artist.name] }] };
  }
  if (policy === 'adminOrArtistSchedule') {
    if (isAdmin(identity)) return { ok: true };
    const artist = await resolveArtist(identity);
    if (!artist) return { forbidden: true };
    return { ok: true, forcedRow: { artist_id: artist.id }, extraWhere: [{ sql: 'artist_id = ?', params: [artist.id] }] };
  }
  return { forbidden: true };
}

// ── SELECT ──
async function doSelect(meta, table, desc, identity) {
  // columns parse: top-level таслалаар, хаалт доторхыг алгасна
  const raw = (desc.select || '*').trim();
  let plainCols = [];
  const embeds = [];
  if (raw === '*') {
    plainCols = meta.cols.slice();
  } else {
    let depth = 0, cur = '';
    const parts = [];
    for (const ch of raw) {
      if (ch === '(') depth++;
      if (ch === ')') depth--;
      if (ch === ',' && depth === 0) { parts.push(cur); cur = ''; } else cur += ch;
    }
    if (cur.trim()) parts.push(cur);
    for (const p of parts.map((s) => s.trim())) {
      const m = p.match(/^(\w+)\s*\((.*)\)$/);
      if (m) embeds.push({ name: m[1], cols: m[2].split(',').map((s) => s.trim()) });
      else plainCols.push(p);
    }
    plainCols.forEach((c) => assertCol(meta, c));
  }

  const pol = await readPolicy(meta, table, plainCols, identity);
  if (pol.empty) return { data: desc.single ? null : [], error: null };

  const colSql = plainCols.map(q).join(', ');
  const where = buildWhere(meta, desc.filters, pol.extra);
  let sql = `SELECT ${colSql} FROM ${q(table)}${where.sql}`;
  if (desc.order?.length) {
    desc.order.forEach((o) => assertCol(meta, o.col));
    sql += ' ORDER BY ' + desc.order.map((o) => `${q(o.col)} ${o.ascending === false ? 'DESC' : 'ASC'}`).join(', ');
  }
  if (Number.isInteger(desc.limit)) sql += ` LIMIT ${desc.limit}`;

  let rows = await query(sql, where.params);
  rows = rows.map((r) => decodeRow(meta, r));

  // embeds (зөвхөн package_services → services)
  for (const emb of embeds) {
    const def = meta.embeds?.[emb.name];
    if (!def) continue;
    const ids = [...new Set(rows.map((r) => r[def.localKey]).filter((v) => v != null))];
    let map = {};
    if (ids.length) {
      const sub = await query(`SELECT ${[def.fk, ...emb.cols].map(q).join(', ')} FROM ${q(def.table)} WHERE ${q(def.fk)} IN (?)`, [ids]);
      sub.forEach((s) => { map[s[def.fk]] = s; });
    }
    rows.forEach((r) => {
      const s = map[r[def.localKey]];
      r[emb.name] = s ? Object.fromEntries(emb.cols.map((c) => [c, s[c]])) : null;
    });
  }

  if (desc.single === 'single') {
    if (rows.length === 0) return { data: null, error: { message: 'No rows found' } };
    return { data: rows[0], error: null };
  }
  if (desc.single === 'maybe') return { data: rows[0] || null, error: null };
  return { data: rows, error: null };
}

// ── INSERT ──
async function doInsert(meta, table, desc, identity) {
  const pol = await writePolicy(meta, 'insert', identity);
  if (pol.forbidden) return err('Энэ үйлдлийг хийх эрхгүй.');

  let rows = Array.isArray(desc.values) ? desc.values : [desc.values];
  rows = rows.map((row) => {
    const out = { ...row, ...(pol.forcedRow || {}) };
    if (meta.pkType === 'uuid' && !out[meta.pk]) out[meta.pk] = randomUUID();
    return out;
  });

  // баганы нэгдсэн жагсаалт (бүх мөрийн түлхүүрүүд)
  const colSet = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  colSet.forEach((c) => assertCol(meta, c));
  const placeholders = rows.map(() => `(${colSet.map(() => '?').join(', ')})`).join(', ');
  const params = rows.flatMap((r) => colSet.map((c) => encodeValue(meta, c, r[c] ?? null)));
  const res = await query(`INSERT INTO ${q(table)} (${colSet.map(q).join(', ')}) VALUES ${placeholders}`, params);

  if (!desc.returning) return { data: null, error: null };

  // оруулсан мөрийг буцаах
  let inserted = [];
  if (meta.pkType === 'int' && rows.length === 1) {
    inserted = await query(`SELECT * FROM ${q(table)} WHERE ${q(meta.pk)} = ?`, [res.insertId]);
  } else if (meta.pkType === 'uuid') {
    const ids = rows.map((r) => r[meta.pk]);
    inserted = await query(`SELECT * FROM ${q(table)} WHERE ${q(meta.pk)} IN (?)`, [ids]);
  } else {
    inserted = rows; // composite — оруулсан утгыг буцаана
  }
  inserted = inserted.map((r) => decodeRow(meta, r));
  if (desc.single) return { data: inserted[0] || null, error: null };
  return { data: inserted, error: null };
}

// ── UPDATE ──
async function doUpdate(meta, table, desc, identity) {
  const pol = await writePolicy(meta, 'update', identity);
  if (pol.forbidden) return err('Энэ үйлдлийг хийх эрхгүй.');
  if (!desc.filters?.length) return err('UPDATE-д шүүлтүүр шаардлагатай.');

  const vals = desc.values || {};
  const setCols = Object.keys(vals);
  setCols.forEach((c) => assertCol(meta, c));
  const setSql = setCols.map((c) => `${q(c)} = ?`).join(', ');
  const setParams = setCols.map((c) => encodeValue(meta, c, vals[c] ?? null));

  const where = buildWhere(meta, desc.filters, pol.extraWhere);
  await query(`UPDATE ${q(table)} SET ${setSql}${where.sql}`, [...setParams, ...where.params]);
  return { data: null, error: null };
}

// ── DELETE ──
async function doDelete(meta, table, desc, identity) {
  if (!desc.filters?.length) return err('DELETE-д шүүлтүүр шаардлагатай.');
  let extraWhere = [];
  if (meta.delete === 'bookingDelete') {
    if (!isAdmin(identity)) extraWhere = [{ sql: 'paid = ?', params: [0] }]; // зөвхөн төлөгдөөгүй hold
  } else {
    const pol = await writePolicy(meta, 'delete', identity);
    if (pol.forbidden) return err('Энэ үйлдлийг хийх эрхгүй.');
    extraWhere = pol.extraWhere || [];
  }
  const where = buildWhere(meta, desc.filters, extraWhere);
  await query(`DELETE FROM ${q(table)}${where.sql}`, where.params);
  return { data: null, error: null };
}

// ── UPSERT (site_settings) ──
async function doUpsert(meta, table, desc, identity) {
  const pol = await writePolicy(meta, 'upsert', identity);
  if (pol.forbidden) return err('Энэ үйлдлийг хийх эрхгүй.');
  let rows = Array.isArray(desc.values) ? desc.values : [desc.values];
  const colSet = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  colSet.forEach((c) => assertCol(meta, c));
  const placeholders = rows.map(() => `(${colSet.map(() => '?').join(', ')})`).join(', ');
  const params = rows.flatMap((r) => colSet.map((c) => encodeValue(meta, c, r[c] ?? null)));
  const updateSql = colSet.filter((c) => c !== meta.pk).map((c) => `${q(c)} = VALUES(${q(c)})`).join(', ');
  await query(
    `INSERT INTO ${q(table)} (${colSet.map(q).join(', ')}) VALUES ${placeholders} ON DUPLICATE KEY UPDATE ${updateSql || `${q(meta.pk)} = ${q(meta.pk)}`}`,
    params
  );
  return { data: null, error: null };
}

// ── Үндсэн dispatcher ──
export async function runQuery(desc, identity) {
  try {
    const table = desc.table;
    const meta = SCHEMA[table];
    if (!meta) return err(`Тодорхойгүй хүснэгт: ${table}`);
    switch (desc.op) {
      case 'select': return await doSelect(meta, table, desc, identity);
      case 'insert': return await doInsert(meta, table, desc, identity);
      case 'update': return await doUpdate(meta, table, desc, identity);
      case 'delete': return await doDelete(meta, table, desc, identity);
      case 'upsert': return await doUpsert(meta, table, desc, identity);
      default: return err(`Тодорхойгүй үйлдэл: ${desc.op}`);
    }
  } catch (e) {
    return err(e.message || 'Query алдаа');
  }
}
