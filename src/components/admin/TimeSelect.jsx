'use client';

// 24 цагийн форматтай цагийн сонголтууд (AM/PM гарахгүй) — 07:00–22:00, 30 мин алхамтай
const TIMES = (() => {
  const arr = [];
  for (let h = 7; h <= 22; h++) {
    for (const m of [0, 30]) {
      arr.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return arr;
})();

export default function TimeSelect({ value, onChange, style }) {
  // Хэрэв одоогийн утга жагсаалтад байхгүй бол нэмж оруулна (хуучин өгөгдөл хадгалагдана)
  const opts = !value || TIMES.includes(value) ? TIMES : [value, ...TIMES];
  return (
    <select value={value || ''} onChange={e => onChange(e.target.value)} style={style}>
      {opts.map(t => <option key={t} value={t}>{t}</option>)}
    </select>
  );
}
