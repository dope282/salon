'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const STATUS_COLORS = {
  pending:   { bg:'#FFF7ED', color:'#C2410C', label:'Хүлээгдэж байна' },
  confirmed: { bg:'#EFF6FF', color:'#1D4ED8', label:'Баталгаажсан' },
  completed: { bg:'#F0FDF4', color:'#15803D', label:'Дууссан' },
  cancelled: { bg:'#FFF1F2', color:'#BE123C', label:'Цуцалсан' },
};

export default function CustomersManager({ showToast }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('all');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });
    setBookings(data || []);
    setLoading(false);
  };

  const updateStatus = async (id, status) => {
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
    if (error) { showToast('Алдаа: ' + error.message, 'err'); return; }
    setBookings(bs => bs.map(b => b.id === id ? { ...b, status } : b));
    showToast('Төлөв шинэчлэгдлээ ✓', 'ok');
  };

  const filtered = bookings.filter(b => {
    const matchFilter = filter === 'all' || b.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      b.customer_name?.toLowerCase().includes(q) ||
      b.customer_phone?.includes(q) ||
      b.customer_email?.toLowerCase().includes(q) ||
      b.service_name?.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  // Unique customers by phone
  const uniqueCustomers = [...new Map(bookings.map(b => [b.customer_phone, b])).values()];

  const inp = { padding: '9px 13px', borderRadius: 10, border: '1.5px solid var(--gray-200)', fontSize: 13, fontFamily: 'Inter,sans-serif', outline: 'none', color: 'var(--dark)', background: '#fff' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 12 }}>
        {[
          { label: 'Нийт үйлчлүүлэгч', value: uniqueCustomers.length, icon: '👥', color: 'var(--pink)' },
          { label: 'Нийт захиалга',     value: bookings.length,         icon: '📋', color: '#6366f1' },
          { label: 'Хүлээгдэж байна',   value: bookings.filter(b=>b.status==='pending').length,   icon: '⏳', color: '#f59e0b' },
          { label: 'Дууссан',           value: bookings.filter(b=>b.status==='completed').length,  icon: '✅', color: 'var(--green)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '16px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--gray-500)', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Нэр, утас, имэйл хайх..."
          style={{ ...inp, flex: 1, minWidth: 180 }}
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['all','pending','confirmed','completed','cancelled'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '8px 14px', borderRadius: 50, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1.5px solid', transition: 'all .15s',
                borderColor: filter === f ? 'var(--pink)' : 'var(--gray-200)',
                background:  filter === f ? 'var(--pink-light)' : '#fff',
                color:       filter === f ? 'var(--pink-dark)' : 'var(--gray-500)',
              }}>
              {f === 'all' ? 'Бүгд' : STATUS_COLORS[f]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading && <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-500)', fontSize: 14 }}>Ачааллаж байна...</div>}

        {!loading && filtered.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--gray-500)' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>👥</div>
            <div style={{ fontSize: 14 }}>Үйлчлүүлэгч олдсонгүй</div>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--gray-100)', borderBottom: '1.5px solid var(--gray-200)' }}>
                  {['Үйлчлүүлэгч','Утас / Имэйл','Үйлчилгээ','Огноо & Цаг','Үнэ','Төлөв','Үйлдэл'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: 'var(--gray-500)', fontSize: 11, textTransform: 'uppercase', letterSpacing: .6, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((b, i) => {
                  const st = STATUS_COLORS[b.status] || STATUS_COLORS.pending;
                  return (
                    <tr key={b.id} style={{ borderBottom: '1px solid var(--gray-200)', background: i % 2 === 0 ? '#fff' : '#fafafa', transition: 'background .15s' }}>

                      {/* Customer */}
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#FFD6E8,#FFBCD9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: 'var(--pink-dark)', flexShrink: 0 }}>
                            {b.customer_name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <span style={{ fontWeight: 600, color: 'var(--dark)' }}>{b.customer_name}</span>
                        </div>
                      </td>

                      {/* Contact */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--dark)' }}>{b.customer_phone}</div>
                        {b.customer_email && <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>{b.customer_email}</div>}
                      </td>

                      {/* Service */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--dark)', maxWidth: 150 }}>{b.service_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>{b.artist_name}</div>
                      </td>

                      {/* Date */}
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 600, color: 'var(--dark)' }}>{b.booking_date}</div>
                        <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>{b.booking_time}</div>
                      </td>

                      {/* Price */}
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--pink-dark)', whiteSpace: 'nowrap' }}>
                        {b.total_price ? `₮${b.total_price.toLocaleString()}` : '—'}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: 50, fontSize: 11, fontWeight: 700, background: st.bg, color: st.color, whiteSpace: 'nowrap' }}>
                          {st.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 14px' }}>
                        <select value={b.status} onChange={e => updateStatus(b.id, e.target.value)}
                          style={{ ...inp, padding: '5px 8px', fontSize: 12, cursor: 'pointer' }}>
                          <option value="pending">Хүлээгдэж байна</option>
                          <option value="confirmed">Баталгаажсан</option>
                          <option value="completed">Дууссан</option>
                          <option value="cancelled">Цуцалсан</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ fontSize: 12, color: 'var(--gray-500)', textAlign: 'right' }}>
        Нийт <strong>{filtered.length}</strong> захиалга · <strong>{uniqueCustomers.length}</strong> үйлчлүүлэгч
      </div>
    </div>
  );
}
