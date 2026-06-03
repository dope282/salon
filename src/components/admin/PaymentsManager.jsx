'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

const METHOD = {
  cash: { label: 'Бэлэн',  icon: '💵', color: '#15803D', bg: '#F0FDF4' },
  card: { label: 'Карт',   icon: '💳', color: '#1D4ED8', bg: '#EFF6FF' },
  qpay: { label: 'QPay',   icon: '📱', color: '#C2186F', bg: '#FFE0EF' },
};
const fmtDate = (d) => d ? `${new Date(d).getMonth()+1}-р сар ${new Date(d).getDate()}` : '—';
const fmtDT = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
};

export default function PaymentsManager({ bookings, onRefresh, showToast }) {
  const [filter, setFilter] = useState('all'); // all | paid | unpaid
  const [busy, setBusy] = useState(null);

  const active = bookings.filter(b => b.status !== 'cancelled');
  const totalRevenue = active.reduce((s, b) => s + (b.total_price || 0), 0);
  const paidRevenue  = active.filter(b => b.paid).reduce((s, b) => s + (b.total_price || 0), 0);
  const unpaidRevenue = totalRevenue - paidRevenue;

  const byMethod = ['cash', 'card', 'qpay'].map(m => ({
    m,
    count: active.filter(b => (b.payment_method || 'cash') === m).length,
    sum: active.filter(b => (b.payment_method || 'cash') === m).reduce((s, b) => s + (b.total_price || 0), 0),
  }));

  const list = active.filter(b => filter === 'all' ? true : filter === 'paid' ? b.paid : !b.paid)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const togglePaid = async (b) => {
    setBusy(b.id);
    const { error } = await supabase.from('bookings')
      .update({ paid: !b.paid, paid_at: !b.paid ? new Date().toISOString() : null })
      .eq('id', b.id);
    setBusy(null);
    if (error) { showToast?.('Алдаа: ' + error.message, 'err'); return; }
    showToast?.(!b.paid ? 'Төлсөн гэж тэмдэглэлээ ✓' : 'Төлбөр цуцлагдлаа', !b.paid ? 'ok' : 'err');
    onRefresh?.();
  };

  const stats = [
    { lbl: 'Нийт орлого',        val: '₮' + totalRevenue.toLocaleString(), ico: '💰', cls: 'gold' },
    { lbl: 'Төлөгдсөн',          val: '₮' + paidRevenue.toLocaleString(),  ico: '✅', cls: 'green' },
    { lbl: 'Төлөгдөөгүй',        val: '₮' + unpaidRevenue.toLocaleString(),ico: '⏳', cls: 'blue' },
    { lbl: 'Гүйлгээний тоо',     val: active.length,                       ico: '🧾', cls: 'pink' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Stats */}
      <div className="stats-grid">
        {stats.map((s, i) => (
          <div key={i} className="stat-card">
            <div>
              <div className="sc-lbl">{s.lbl}</div>
              <div className="sc-val">{s.val}</div>
            </div>
            <div className={`sc-ico ${s.cls}`}>{s.ico}</div>
          </div>
        ))}
      </div>

      {/* By method */}
      <div className="two-col">
        <div className="card">
          <div className="card-header"><div className="card-title">Төлбөрийн аргаар</div></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {byMethod.map(({ m, count, sum }) => {
              const cfg = METHOD[m];
              const pct = totalRevenue ? Math.round((sum / totalRevenue) * 100) : 0;
              return (
                <div key={m}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>{cfg.icon} {cfg.label} <span style={{ color: 'var(--gray-500)', fontWeight: 400 }}>({count})</span></span>
                    <span style={{ fontWeight: 700, color: cfg.color }}>₮{sum.toLocaleString()}</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 50, background: 'var(--gray-100)', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: cfg.color, borderRadius: 50, transition: 'width .4s' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 6 }}>
          <div style={{ fontSize: 13, color: 'var(--gray-500)', fontWeight: 600 }}>Төлбөрийн биелэлт</div>
          <div style={{ fontSize: 40, fontWeight: 800, color: 'var(--green)', fontFamily: 'Playfair Display,serif' }}>
            {totalRevenue ? Math.round((paidRevenue / totalRevenue) * 100) : 0}%
          </div>
          <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
            ₮{paidRevenue.toLocaleString()} / ₮{totalRevenue.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[['all', 'Бүгд'], ['paid', 'Төлөгдсөн'], ['unpaid', 'Төлөгдөөгүй']].map(([id, lbl]) => (
          <button key={id} onClick={() => setFilter(id)}
            style={{ padding: '8px 16px', borderRadius: 50, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1.5px solid',
              borderColor: filter === id ? 'var(--pink)' : 'var(--gray-200)',
              background: filter === id ? 'var(--pink-light)' : '#fff',
              color: filter === id ? 'var(--pink-dark)' : 'var(--gray-500)' }}>
            {lbl}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="tbl-scroll">
          <table>
            <thead><tr><th>Огноо</th><th>Үйлчлүүлэгч</th><th>Үйлчилгээ</th><th>Дүн</th><th>Арга</th><th>Төлөв</th><th>Үйлдэл</th></tr></thead>
            <tbody>
              {list.length === 0
                ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 28, color: 'var(--gray-500)' }}>Гүйлгээ байхгүй байна</td></tr>
                : list.map(b => {
                  const cfg = METHOD[b.payment_method] || METHOD.cash;
                  return (
                    <tr key={b.id}>
                      <td style={{ whiteSpace: 'nowrap', color: 'var(--gray-500)', fontSize: 12 }}>{fmtDate(b.booking_date)}</td>
                      <td><strong>{b.customer_phone}</strong></td>
                      <td style={{ maxWidth: 180 }}>{b.service_name}</td>
                      <td style={{ fontWeight: 700, color: 'var(--pink-dark)', whiteSpace: 'nowrap' }}>₮{(b.total_price || 0).toLocaleString()}</td>
                      <td><span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 50, background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' }}>{cfg.icon} {cfg.label}</span></td>
                      <td>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 50, background: b.paid ? '#F0FDF4' : '#FFF7ED', color: b.paid ? '#15803D' : '#C2410C', whiteSpace: 'nowrap' }}>
                          {b.paid ? '✓ Төлсөн' : 'Хүлээгдэж буй'}
                        </span>
                        {b.paid && b.paid_at && (
                          <div style={{ fontSize: 10, color: 'var(--gray-500)', marginTop: 3, whiteSpace: 'nowrap' }}>🕐 {fmtDT(b.paid_at)}</div>
                        )}
                      </td>
                      <td>
                        <button disabled={busy === b.id} onClick={() => togglePaid(b)}
                          className="btn-outline-sm" style={{ color: b.paid ? 'var(--red)' : 'var(--green)', borderColor: b.paid ? 'var(--red)' : 'var(--green)' }}>
                          {busy === b.id ? '...' : b.paid ? 'Цуцлах' : 'Төлсөн'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
