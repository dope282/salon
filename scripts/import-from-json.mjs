#!/usr/bin/env node
// Supabase SQL Editor-аас экспортолсон JSON-г MySQL руу импортлоно.
// Ажиллуулах:
//   DB_HOST=127.0.0.1 DB_USER=root DB_PASSWORD= DB_NAME=salon \
//   node scripts/import-from-json.mjs supabase-export.json
//
// JSON хэлбэр: { "services":[...], "artists":[...], ... } эсвэл
//   [{ "data": { ... } }] / { "data": { ... } } (SQL editor-ийн гаралт) — бүгдийг задална.

import { readFile } from 'fs/promises';
import mysql from 'mysql2/promise';

const file = process.argv[2] || 'supabase-export.json';
const DB_NAME = process.env.DB_NAME || 'salon';

let data = JSON.parse(await readFile(file, 'utf8'));
if (Array.isArray(data)) data = data[0];
if (data && data.data && typeof data.data === 'object') data = data.data;

const db = await mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: DB_NAME,
  charset: 'utf8mb4',
});

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

function conv(meta, col, val) {
  if (val === undefined) val = null;
  const t = meta[col];
  if (val !== null) {
    if (t === 'datetime' || t === 'timestamp') return toMysqlDT(val);
    if (t === 'date') return String(val).slice(0, 10);
    if (typeof val === 'object') return JSON.stringify(val);
    if (typeof val === 'boolean') return val ? 1 : 0;
  }
  return val;
}

// Бүх хүснэгт JSON-д байгаа эсэхийг шалгах
const missing = ORDER.filter((t) => !(t in data));
if (missing.length) console.warn(`⚠ JSON-д дутуу хүснэгт (хоосон гэж үзнэ): ${missing.join(', ')}`);

console.log(`→ Импорт: ${file} → MySQL ${DB_NAME}\n`);
await db.query('SET FOREIGN_KEY_CHECKS = 0');
for (const table of [...ORDER].reverse()) await db.query(`DELETE FROM \`${table}\``);

const totals = {};
for (const table of ORDER) {
  const meta = await colMeta(table);
  const rows = Array.isArray(data[table]) ? data[table] : [];
  let n = 0;
  for (const row of rows) {
    if (table === 'bookings' || table === 'product_orders') row.user_id = null;
    const cols = Object.keys(row).filter((c) => c in meta);
    if (!cols.length) continue;
    const vals = cols.map((c) => conv(meta, c, row[c]));
    const ph = cols.map(() => '?').join(', ');
    try {
      await db.query(`INSERT INTO \`${table}\` (${cols.map((c) => '`' + c + '`').join(', ')}) VALUES (${ph})`, vals);
      n++;
    } catch (e) {
      console.warn(`  ⚠ ${table} мөр алдаа: ${e.message}`);
    }
  }
  totals[table] = `${n}/${rows.length}`;
  console.log(`✓ ${table}: ${n}/${rows.length}`);
}
await db.query('SET FOREIGN_KEY_CHECKS = 1');

console.log('\n✅ Импорт дууслаа.', totals);
await db.end();
process.exit(0);
