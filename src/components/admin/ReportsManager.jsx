'use client';
import { useState, useMemo } from 'react';

const STATUS = {
  pending:   { label: 'Хүлээгдэж буй', color: '#F59E0B' },
  confirmed: { label: 'Баталгаажсан',  color: '#3B82F6' },
  completed: { label: 'Дууссан',        color: '#22C55E' },
  cancelled: { label: 'Цуцлагдсан',     color: '#EF4444' },
};

export default function ReportsManager({ bookings }) {
  const [range, setRange] = useState(30); // 7 | 30 | 9999 (бүх)

  const data = useMemo(() => {
    const now = new Date();
    const from = new Date(); from.setDate(now.getDate() - range + 1); from.setHours(0,0,0,0);
    const inRange = bookings.filter(b => {
      if (range >= 9999) return true;
      const d = new Date(b.created_at || b.booking_date);
      return d >= from;
    });
    const active = inRange.filter(b => b.status !== 'cancelled');

    const revenue = active.reduce((s, b) => s + (b.total_price || 0), 0);
    const completed = inRange.filter(b => b.status === 'completed').length;
    const avg = active.length ? Math.round(revenue / active.length) : 0;

    // Өдрөөр (сүүлийн N хоног, дээд тал нь 30 баганаар)
    const days = Math.min(range, 30);
    const daily = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(now.getDate() - i);
      const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const sum = active.filter(b => (b.booking_date) === ds).reduce((s, b) => s + (b.total_price || 0), 0);
      daily.push({ ds, label: `${d.getMonth()+1}/${d.getDate()}`, sum });
    }
    const maxDaily = Math.max(1, ...daily.map(d => d.sum));

    // Статусаар
    const statusCounts = Object.keys(STATUS).map(k => ({ k, n: inRange.filter(b => b.status === k).length }));

    // Топ артист (орлогоор)
    const artMap = {};
    active.forEach(b => { const a = b.artist_name || '—'; if (!artMap[a]) artMap[a] = { count: 0, sum: 0 }; artMap[a].count++; artMap[a].sum += (b.total_price || 0); });
    const topArtists = Object.entries(artMap).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.sum - a.sum).slice(0, 5);

    // Топ үйлчилгээ (давтамжаар)
    const svcMap = {};
    active.forEach(b => (b.service_name || '').split(',').map(s => s.trim()).filter(Boolean).forEach(s => { svcMap[s] = (svcMap[s] || 0) + 1; }));
    const topSvcs = Object.entries(svcMap).map(([name, n]) => ({ name, n })).sort((a, b) => b.n - a.n).slice(0, 5);

    return { count: inRange.length, revenue, completed, avg, daily, maxDaily, statusCounts, topArtists, topSvcs };
  }, [bookings, range]);

  const stats = [
    { lbl: 'Захиалга',     val: data.count,                          ico: '📅', cls: 'pink' },
    { lbl: 'Орлого',       val: '₮' + data.revenue.toLocaleString(), ico: '💰', cls: 'gold' },
    { lbl: 'Дууссан',      val: data.completed,                      ico: '✅', cls: 'green' },
    { lbl: 'Дундаж дүн',   val: '₮' + data.avg.toLocaleString(),     ico: '📊', cls: 'blue' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Range toggle */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[[7, 'Сүүлийн 7 хоног'], [30, 'Сүүлийн 30 хоног'], [9999, 'Бүх хугацаа']].map(([r, lbl]) => (
          <button key={r} onClick={() => setRange(r)}
            style={{ padding: '8px 16px', borderRadius: 50, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1.5px solid',
              borderColor: range === r ? 'var(--pink)' : 'var(--gray-200)',
              background: range === r ? 'var(--pink-light)' : '#fff',
              color: range === r ? 'var(--pink-dark)' : 'var(--gray-500)' }}>
            {lbl}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {stats.map((s, i) => (
          <div key={i} className="stat-card">
            <div><div className="sc-lbl">{s.lbl}</div><div className="sc-val">{s.val}</div></div>
            <div className={`sc-ico ${s.cls}`}>{s.ico}</div>
          </div>
        ))}
      </div>

      {/* Daily revenue chart */}
      <div className="card">
        <div className="card-header"><div className="card-title">Өдрийн орлого</div></div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 160, overflowX: 'auto', paddingTop: 10 }}>
          {data.daily.map((d, i) => (
            <div key={i} style={{ flex: '1 0 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 18 }}>
              <div style={{ fontSize: 8, color: 'var(--gray-500)', whiteSpace: 'nowrap' }}>{d.sum > 0 ? `${Math.round(d.sum/1000)}k` : ''}</div>
              <div title={`₮${d.sum.toLocaleString()}`}
                style={{ width: '100%', maxWidth: 28, height: `${Math.max(2, (d.sum / data.maxDaily) * 110)}px`, background: 'linear-gradient(to top,var(--pink),var(--pink-light))', borderRadius: '4px 4px 0 0' }} />
              <div style={{ fontSize: 8, color: 'var(--gray-500)', whiteSpace: 'nowrap' }}>{d.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="two-col">
        {/* Status breakdown */}
        <div className="card">
          <div className="card-header"><div className="card-title">Захиалгын төлөв</div></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.statusCounts.map(({ k, n }) => {
              const cfg = STATUS[k];
              const pct = data.count ? Math.round((n / data.count) * 100) : 0;
              return (
                <div key={k}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>{cfg.label}</span>
                    <span style={{ color: 'var(--gray-500)' }}>{n} ({pct}%)</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 50, background: 'var(--gray-100)', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: cfg.color, borderRadius: 50 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top artists */}
        <div className="card">
          <div className="card-header"><div className="card-title">Шилдэг артистууд</div></div>
          {data.topArtists.length === 0
            ? <div style={{ color: 'var(--gray-500)', fontSize: 13 }}>Мэдээлэл алга</div>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.topArtists.map((a, i) => (
                  <div key={a.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--pink-light)', color: 'var(--pink-dark)', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{a.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--gray-500)' }}>{a.count} захиалга</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--pink-dark)' }}>₮{a.sum.toLocaleString()}</span>
                  </div>
                ))}
              </div>}
        </div>
      </div>

      {/* Top services */}
      <div className="card">
        <div className="card-header"><div className="card-title">Эрэлттэй үйлчилгээнүүд</div></div>
        {data.topSvcs.length === 0
          ? <div style={{ color: 'var(--gray-500)', fontSize: 13 }}>Мэдээлэл алга</div>
          : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {data.topSvcs.map((s, i) => (
                <span key={s.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 50, background: i === 0 ? 'var(--pink-light)' : 'var(--gray-100)', fontSize: 12, fontWeight: 600, color: i === 0 ? 'var(--pink-dark)' : 'var(--gray-800)' }}>
                  {s.name} <span style={{ background: '#fff', borderRadius: 50, padding: '0 7px', fontSize: 11 }}>{s.n}</span>
                </span>
              ))}
            </div>}
      </div>
    </div>
  );
}
