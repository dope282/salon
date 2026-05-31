'use client';
import { useState, useEffect, useMemo } from 'react';
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
  const [expanded, setExpanded] = useState(null);

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

  // Хэрэглэгчээр бүлэглэх — имэйлтэй бол имэйлээр, үгүй бол утсаар
  const customers = useMemo(() => {
    const map = new Map();
    bookings.forEach(b => {
      const key = (b.customer_email || b.customer_phone || 'unknown').toLowerCase();
      if (!map.has(key)) {
        map.set(key, { key, email: b.customer_email || null, phone: b.customer_phone || null, bookings: [] });
      }
      const c = map.get(key);
      c.bookings.push(b);
      if (b.customer_email && !c.email) c.email = b.customer_email;
      if (b.customer_phone && !c.phone) c.phone = b.customer_phone;
    });
    return [...map.values()].map(c => {
      const total     = c.bookings.length;
      const completed = c.bookings.filter(b => b.status === 'completed').length;
      const upcoming  = c.bookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length;
      const spent     = c.bookings.filter(b => b.status !== 'cancelled').reduce((s,b) => s + (b.total_price || 0), 0);
      const dates     = c.bookings.map(b => b.booking_date).filter(Boolean).sort();
      const lastVisit = dates[dates.length - 1] || null;
      return { ...c, total, completed, upcoming, spent, lastVisit };
    }).sort((a, b) => b.completed - a.completed || b.total - a.total);
  }, [bookings]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(c =>
      c.phone?.includes(q) || c.email?.toLowerCase().includes(q)
    );
  }, [customers, search]);

  const totalCompleted = bookings.filter(b => b.status === 'completed').length;
  const totalRevenue   = bookings.filter(b => b.status !== 'cancelled').reduce((s,b) => s + (b.total_price || 0), 0);

  const inp = { padding: '9px 13px', borderRadius: 10, border: '1.5px solid var(--gray-200)', fontSize: 13, fontFamily: 'Inter,sans-serif', outline: 'none', color: 'var(--dark)', background: '#fff' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 12 }}>
        {[
          { label: 'Нийт үйлчлүүлэгч',  value: customers.length, icon: '👥', color: 'var(--pink)' },
          { label: 'Нийт захиалга',      value: bookings.length,  icon: '📋', color: '#6366f1' },
          { label: 'Үйлчилгээ авсан',    value: totalCompleted,   icon: '✅', color: 'var(--green)' },
          { label: 'Нийт орлого',        value: `₮${totalRevenue.toLocaleString()}`, icon: '💰', color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '16px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--gray-500)', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Утас, имэйл хайх..."
          style={{ ...inp, flex: 1, minWidth: 180 }}
        />
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
                  {['Үйлчлүүлэгч','Холбоо барих','Захиалсан','Үйлчилгээ авсан','Нийт төлсөн','Сүүлчийн',''].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: 'var(--gray-500)', fontSize: 11, textTransform: 'uppercase', letterSpacing: .6, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => {
                  const primary = c.email || c.phone || '?';
                  const isOpen  = expanded === c.key;
                  return (
                    <FragmentRow key={c.key}>
                      <tr
                        onClick={() => setExpanded(isOpen ? null : c.key)}
                        style={{ borderBottom: isOpen ? 'none' : '1px solid var(--gray-200)', background: i % 2 === 0 ? '#fff' : '#fafafa', cursor: 'pointer' }}>

                        {/* Customer */}
                        <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#FFD6E8,#FFBCD9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: 'var(--pink-dark)', flexShrink: 0 }}>
                              {primary[0]?.toUpperCase() || '?'}
                            </div>
                            <span style={{ fontWeight: 600, color: 'var(--dark)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{primary}</span>
                          </div>
                        </td>

                        {/* Contact */}
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--dark)' }}>{c.phone || '—'}</div>
                          {c.email && <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>{c.email}</div>}
                        </td>

                        {/* Total bookings */}
                        <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: 700, color: 'var(--dark)' }}>{c.total}</span>
                          {c.upcoming > 0 && <span style={{ fontSize: 11, color: '#1D4ED8', marginLeft: 6 }}>({c.upcoming} удахгүй)</span>}
                        </td>

                        {/* Completed count — key metric */}
                        <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 50, background: '#F0FDF4', color: '#15803D', fontWeight: 800, fontSize: 14 }}>
                            ✅ {c.completed}
                            <span style={{ fontWeight: 500, fontSize: 11 }}>удаа</span>
                          </span>
                        </td>

                        {/* Spent */}
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--pink-dark)', whiteSpace: 'nowrap' }}>
                          {c.spent ? `₮${c.spent.toLocaleString()}` : '—'}
                        </td>

                        {/* Last visit */}
                        <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', color: 'var(--gray-500)', fontSize: 12 }}>
                          {c.lastVisit || '—'}
                        </td>

                        {/* Expand arrow */}
                        <td style={{ padding: '12px 14px', color: 'var(--gray-400)', fontSize: 12 }}>
                          {isOpen ? '▲' : '▼'}
                        </td>
                      </tr>

                      {/* Expanded — booking history */}
                      {isOpen && (
                        <tr style={{ borderBottom: '1px solid var(--gray-200)', background: '#FFFBF5' }}>
                          <td colSpan={7} style={{ padding: '8px 14px 16px 14px' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: .6, margin: '8px 0 6px' }}>
                              Захиалгын түүх ({c.bookings.length})
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {c.bookings.map(b => {
                                const st = STATUS_COLORS[b.status] || STATUS_COLORS.pending;
                                return (
                                  <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: '#fff', borderRadius: 10, border: '1px solid var(--gray-200)', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: 12, color: 'var(--gray-500)', minWidth: 90 }}>{b.booking_date} {b.booking_time}</span>
                                    <span style={{ fontWeight: 600, color: 'var(--dark)', flex: 1, minWidth: 120 }}>{b.service_name}</span>
                                    <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>👩 {b.artist_name}</span>
                                    {b.notes && <span style={{ fontSize: 11, color: 'var(--gray-500)', fontStyle: 'italic' }} title={b.notes}>📝 {b.notes}</span>}
                                    <span style={{ fontWeight: 700, color: 'var(--pink-dark)', fontSize: 12 }}>{b.total_price ? `₮${b.total_price.toLocaleString()}` : ''}</span>
                                    <select value={b.status} onChange={e => updateStatus(b.id, e.target.value)}
                                      style={{ ...inp, padding: '4px 8px', fontSize: 11, cursor: 'pointer', background: st.bg, color: st.color, fontWeight: 700, borderColor: 'transparent' }}>
                                      <option value="pending">Хүлээгдэж байна</option>
                                      <option value="confirmed">Баталгаажсан</option>
                                      <option value="completed">Дууссан</option>
                                      <option value="cancelled">Цуцалсан</option>
                                    </select>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      )}
                    </FragmentRow>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ fontSize: 12, color: 'var(--gray-500)', textAlign: 'right' }}>
        Нийт <strong>{filtered.length}</strong> үйлчлүүлэгч · <strong>{bookings.length}</strong> захиалга
      </div>
    </div>
  );
}

// Fragment wrapper that allows two <tr> siblings with a single key
function FragmentRow({ children }) {
  return <>{children}</>;
}
