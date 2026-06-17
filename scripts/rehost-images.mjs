#!/usr/bin/env node
// Supabase storage дахь зургуудыг татаж Datacom-ийн public/uploads-д хадгалж,
// DB дахь URL-уудыг /uploads/... болгож шинэчилнэ. (Supabase-ийг бүрмөсөн орхих боломжтой болгоно.)
//
// ⚠️ Supabase project ИДЭВХТЭЙ (egress нээлттэй) байх үед ажиллуулна.
// Апп фолдороос (public/uploads бичигдэхийн тулд):
//   DB_HOST=localhost DB_USER=hatantse_salonuser DB_PASSWORD='...' DB_NAME=hatantse_salon \
//   node scripts/rehost-images.mjs

import mysql from 'mysql2/promise';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const DB_NAME = process.env.DB_NAME || 'salon';
const db = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: DB_NAME,
  charset: 'utf8mb4',
});

const UP_DIR = path.join(process.cwd(), 'uploads');
await mkdir(UP_DIR, { recursive: true });

// Зураг агуулж болзошгүй хүснэгт ба багана
const TARGETS = [
  { table: 'services',      cols: ['image_url', 'images'], pk: 'id' },
  { table: 'packages',      cols: ['image_url', 'images'], pk: 'id' },
  { table: 'products',      cols: ['image_url', 'images'], pk: 'id' },
  { table: 'trainings',     cols: ['image_url', 'images'], pk: 'id' },
  { table: 'artists',       cols: ['image_url'],           pk: 'id' },
  { table: 'site_settings', cols: ['value'],               pk: 'key' },
];

const URL_RE = /https?:\/\/[^\s"']*supabase\.co\/storage\/[^\s"']+/g;
const cache = new Map();   // origUrl -> /uploads/name
const usedNames = new Set();
let downloaded = 0, failed = 0;

async function fetchOne(url) {
  if (cache.has(url)) return cache.get(url);
  let base = decodeURIComponent(url.split('/').pop().split('?')[0]).replace(/[^a-zA-Z0-9._-]/g, '_') || `img-${Date.now()}`;
  let name = base, i = 1;
  while (usedNames.has(name)) { const dot = base.lastIndexOf('.'); name = dot > 0 ? `${base.slice(0, dot)}-${i}${base.slice(dot)}` : `${base}-${i}`; i++; }
  try {
    const r = await fetch(url);
    if (!r.ok) { console.warn('  ✗', r.status, url.slice(0, 70)); failed++; cache.set(url, url); return url; }
    const buf = Buffer.from(await r.arrayBuffer());
    await writeFile(path.join(UP_DIR, name), buf);
    usedNames.add(name);
    const newUrl = `/api/uploads/${name}`;
    cache.set(url, newUrl); downloaded++;
    console.log('  ✓', name, `(${buf.length}B)`);
    return newUrl;
  } catch (e) {
    console.warn('  ✗', e.message, url.slice(0, 60)); failed++; cache.set(url, url); return url;
  }
}

async function rewrite(text) {
  const urls = [...new Set(text.match(URL_RE) || [])];
  let out = text;
  for (const u of urls) { const nu = await fetchOne(u); if (nu !== u) out = out.split(u).join(nu); }
  return out;
}

console.log(`→ public/uploads: ${UP_DIR}\n`);
for (const t of TARGETS) {
  const pkSql = '`' + t.pk + '`';
  const [rows] = await db.query(`SELECT ${pkSql} AS _pk, ${t.cols.map((c) => '`' + c + '`').join(', ')} FROM \`${t.table}\``);
  let updated = 0;
  for (const row of rows) {
    const sets = [], vals = [];
    for (const c of t.cols) {
      const v = row[c];
      if (typeof v === 'string' && v.includes('supabase.co/storage')) {
        const nv = await rewrite(v);
        if (nv !== v) { sets.push('`' + c + '`=?'); vals.push(nv); }
      }
    }
    if (sets.length) { vals.push(row._pk); await db.query(`UPDATE \`${t.table}\` SET ${sets.join(', ')} WHERE ${pkSql}=?`, vals); updated++; }
  }
  console.log(`✓ ${t.table}: ${updated} мөр шинэчлэв`);
}

console.log(`\n✅ Дууслаа. Татсан зураг: ${downloaded}, амжилтгүй: ${failed}`);
if (failed) console.log('⚠ Амжилтгүй болсон зургууд хуучин URL-аараа үлдсэн (Supabase идэвхтэй эсэхийг шалга).');
await db.end();
process.exit(0);
