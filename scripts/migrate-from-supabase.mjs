#!/usr/bin/env node
// Supabase → MySQL дата шилжүүлэг.
// Ажиллуулах:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//   DB_HOST=localhost DB_USER=salon DB_PASSWORD=... DB_NAME=salon \
//   node scripts/migrate-from-supabase.mjs
// (эсвэл эдгээрийг .env.local-д хийгээд: node --env-file=.env.local scripts/migrate-from-supabase.mjs)
//
// Тэмдэглэл: users (нэвтрэх) хүснэгт ШИЛЖИХГҮЙ — Supabase нууц үгийн hash экспортлогддоггүй.
// Үйлчлүүлэгчид дахин бүртгүүлнэ; bookings.user_id = NULL болгоно (захиалга имэйлээр харагдсан хэвээр).

import { createClient } from '@supabase/supabase-js';
import mysql from 'mysql2/promise';

const SB_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SB_URL || !SB_KEY) {
  console.error('❌ SUPABASE_URL ба SUPABASE_SERVICE_ROLE_KEY env шаардлагатай.');
  process.exit(1);
}

const DB_NAME = process.env.DB_NAME || 'salon';
const sb = createClient(SB_URL, SB_KEY, { auth: { persistSession: false } });
const db = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: DB_NAME,
  charset: 'utf8mb4',
});

// Эх хүснэгт (parent) → хамаарал (child) дарааллаар
const ORDER = [
  'services', 'artists', 'packages', 'trainings', 'products', 'site_settings',
  'package_services', 'artist_packages', 'artist_services', 'artist_schedules',
  'bookings', 'product_orders',
];

const toMysqlDT = (v) => {
  if (v == null) return null;
  const d = new Date(v);
  return isNaN(d) ? null : d.toISOString().slice(0, 19).replace('T', ' ');
};

async function colMeta(table) {
  const [rows] = await db.query(
    'SELECT COLUMN_NAME, DATA_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?',
    [DB_NAME, table]
  );
  const m = {};
  rows.forEach((r) => { m[r.COLUMN_NAME] = r.DATA_TYPE; });
  return m;
}

async function fetchAll(table) {
  let out = [], from = 0;
  const size = 1000;
  for (;;) {
    const { data, error } = await sb.from(table).select('*').range(from, from + size - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    out = out.concat(data || []);
    if (!data || data.length < size) break;
    from += size;
  }
  return out;
}

function conv(meta, col, val) {
  if (val === undefined) val = null;
  const t = meta[col];
  if (val !== null) {
    if (t === 'datetime' || t === 'timestamp') return toMysqlDT(val);
    if (t === 'date') return String(val).slice(0, 10);
    if (typeof val === 'object') return JSON.stringify(val);   // jsonb → text
    if (typeof val === 'boolean') return val ? 1 : 0;
  }
  return val;
}

console.log(`→ Эх: ${SB_URL}\n→ Очих: MySQL ${DB_NAME}\n`);

// ── 1-р шат: БҮХ датаг эхлээд татна. Алдаа гарвал target DB-д ХҮРЭХГҮЙГЭЭР зогсоно. ──
const fetched = {};
for (const table of ORDER) {
  process.stdout.write(`  татаж байна: ${table} ... `);
  try {
    fetched[table] = await fetchAll(table);
    console.log(`${fetched[table].length} мөр`);
  } catch (e) {
    console.error(`\n❌ ${table} татахад алдаа: ${e.message}`);
    console.error('⛔ Target DB-д ЯМАР Ч ӨӨРЧЛӨЛТ ОРУУЛААГҮЙ. Засаад дахин ажиллуулна уу.');
    await db.end();
    process.exit(1);
  }
}

// ── 2-р шат: хуучин дата (seed-ийг ч) цэвэрлээд шинээр оруулна. ──
console.log('\nОруулж байна...');
await db.query('SET FOREIGN_KEY_CHECKS = 0');
for (const table of [...ORDER].reverse()) await db.query(`DELETE FROM \`${table}\``);

const totals = {};
for (const table of ORDER) {
  const meta = await colMeta(table);
  const rows = fetched[table];
  let n = 0;
  for (const row of rows) {
    if (table === 'bookings' || table === 'product_orders') row.user_id = null;
    const cols = Object.keys(row).filter((c) => c in meta);
    if (!cols.length) continue;
    const vals = cols.map((c) => conv(meta, c, row[c]));
    const ph = cols.map(() => '?').join(', ');
    try {
      await db.query(
        `INSERT INTO \`${table}\` (${cols.map((c) => '`' + c + '`').join(', ')}) VALUES (${ph})`,
        vals
      );
      n++;
    } catch (e) {
      console.warn(`  ⚠ ${table} мөр алдаа: ${e.message}`);
    }
  }
  totals[table] = `${n}/${rows.length}`;
  console.log(`✓ ${table}: ${n}/${rows.length}`);
}
await db.query('SET FOREIGN_KEY_CHECKS = 1');

console.log('\n✅ Дууслаа.', totals);
console.log('Анхаар: admin шинээр /-д бүртгүүлнэ (role auto-admin). Үйлчлүүлэгчид дахин бүртгүүлнэ.');
await db.end();
process.exit(0);
