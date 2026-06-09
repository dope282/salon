'use client';
import { useState, useEffect, useMemo, Fragment } from 'react';
import { supabase } from '@/lib/supabase';

const DAY_MN   = ['Ням','Даваа','Мягмар','Лхагва','Пүрэв','Баасан','Бямба'];
const MONTH_MN = ['1-р сар','2-р сар','3-р сар','4-р сар','5-р сар','6-р сар',
                  '7-р сар','8-р сар','9-р сар','10-р сар','11-р сар','12-р сар'];

function formatDateLabel(dateStr) {
  if (!dateStr || dateStr === '__nodate__') return '📋 Огноогүй';
  const d     = new Date(dateStr + 'T00:00');
  const today = new Date(); today.setHours(0,0,0,0);
  const diff  = Math.round((d - today) / 86_400_000);
  const base  = `${d.getFullYear()} оны ${MONTH_MN[d.getMonth()]} ${d.getDate()}-ны өдөр · ${DAY_MN[d.getDay()]}`;
  if (diff === 0)  return `🟢 Өнөөдөр · ${base}`;
  if (diff === 1)  return `🔵 Маргааш · ${base}`;
  if (diff === -1) return `⚫ Өчигдөр · ${base}`;
  if (diff < 0)    return `⚫ ${base}`;
  return `📅 ${base}`;
}

function formatTime(time) { return time ? time.slice(0,5) : '—'; }
function badgeCls(s)  { return {pending:'pend',confirmed:'ok',completed:'info',cancelled:'fail'}[s]||'pend'; }
function statusMn(s)  { return {pending:'Хүлээгдэж байна',confirmed:'Батлагдсан',completed:'Дууссан',cancelled:'Цуцлагдсан'}[s]||s; }

// Боломжит цаг тооцоолох туслахууд
const WORK_START = '09:00', WORK_END = '18:00', LEAD_MIN = 20;
const timeToMin = (t) => { const [h, m] = String(t).split(':').map(Number); return h * 60 + m; };
const minToTime = (m) => `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
const todayStr  = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };

const EMPTY_MANUAL = { phone:'', name:'', artist:'', service:'', date: todayStr(), time:'', duration:'60', price:'', notes:'' };

export default function BookingsTable({ bookings, onRefresh, showToast }) {
  const [filter,   setFilter]   = useState('');
  const [updating, setUpdating] = useState(null);
  const [artists,  setArtists]  = useState([]);
  const [services, setServices] = useState([]);
  const [showAdd,  setShowAdd]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [m,        setM]        = useState(EMPTY_MANUAL);
  const [schedMap, setSchedMap] = useState({});
  const [orders,   setOrders]   = useState([]);
  const [delOrder, setDelOrder] = useState(null);

  const loadOrders = async () => {
    const { data } = await supabase.from('product_orders').select('*').order('created_at', { ascending: false });
    setOrders(data || []);
  };

  const removeOrder = async (id) => {
    const { error } = await supabase.from('product_orders').delete().eq('id', id);
    setDelOrder(null);
    if (error) { showToast('Устгахад алдаа: ' + error.message, 'err'); return; }
    showToast('Захиалга устгагдлаа', 'ok');
    loadOrders();
  };

  useEffect(() => {
    Promise.all([
      supabase.from('artists').select('id, name').eq('active', true).order('id'),
      supabase.from('services').select('name_mn, duration_min, price_from').eq('active', true).order('id'),
      supabase.from('artist_schedules').select('*'),
    ]).then(([{ data: a }, { data: s }, { data: sch }]) => {
      setArtists(a || []); setServices(s || []);
      const map = {};
      (sch || []).forEach(r => { if (!map[r.artist_id]) map[r.artist_id] = []; map[r.artist_id].push(r); });
      setSchedMap(map);
    });
    loadOrders();
  }, []);

  // Боломжит цагууд — артист, огноо, үйлчилгээний хугацаа, давхцал, буфер тооцсон
  const adminSlots = useMemo(() => {
    if (!m.artist || !m.date) return [];
    const dur    = parseInt(m.duration) || 60;
    const artist = artists.find(a => a.name === m.artist);
    const dow    = new Date(`${m.date}T00:00`).getDay();
    const sched  = artist ? (schedMap[artist.id] || []).find(s => s.day_of_week === dow) : null;
    if (sched && !sched.is_active) return [];
    const winStart = timeToMin(sched ? sched.start_time : WORK_START);
    const winEnd   = timeToMin(sched ? sched.end_time   : WORK_END);
    const busy = (bookings || [])
      .filter(b => b.artist_name === m.artist && b.booking_date === m.date && b.status !== 'cancelled')
      .map(b => { const s = timeToMin(b.booking_time); return { start: s, end: s + (b.duration_min || 60) }; });
    const overlaps = (s, e) => busy.some(b => s < b.end && b.start < e);
    const isToday  = m.date === todayStr();
    const nowMins  = new Date().getHours() * 60 + new Date().getMinutes();
    const step     = dur > 0 ? dur : 60;
    const out = [];
    for (let s = winStart; s + dur <= winEnd; s += step) {
      if (isToday && s <= nowMins + LEAD_MIN) continue;
      if (overlaps(s, s + dur)) continue;
      out.push(minToTime(s));
    }
    return out;
  }, [m.artist, m.date, m.duration, artists, schedMap, bookings]);

  const setMF     = (k, v) => setM(prev => ({ ...prev, [k]: v }));
  const pickService = (name) => {
    const svc = services.find(s => s.name_mn === name);
    setM(prev => ({ ...prev, service: name, time: '',
      duration: svc?.duration_min ? String(svc.duration_min) : prev.duration,
      price:    svc?.price_from   ? String(svc.price_from)   : prev.price }));
  };

  const saveManual = async () => {
    if (!/^[0-9]{8}$/.test(m.phone.trim())) { showToast('Утасны дугаар 8 оронтой байх ёстой', 'err'); return; }
    if (!m.artist)          { showToast('Артист сонгоно уу', 'err'); return; }
    if (!m.service.trim())  { showToast('Үйлчилгээ оруулна уу', 'err'); return; }
    if (!m.date || !m.time) { showToast('Огноо болон цаг оруулна уу', 'err'); return; }
    setSaving(true);
    const { error } = await supabase.from('bookings').insert([{
      customer_name:  m.name.trim() || m.phone.trim(),
      customer_phone: m.phone.trim(),
      service_name:   m.service.trim(),
      artist_name:    m.artist,
      booking_date:   m.date,
      booking_time:   m.time,
      duration_min:   parseInt(m.duration) || 60,
      total_price:    parseInt(m.price) || 0,
      payment_method: 'cash',
      notes:          m.notes.trim() || null,
      status:         'confirmed',
    }]);
    setSaving(false);
    if (error) { showToast('Алдаа: ' + error.message, 'err'); return; }
    showToast('Цаг амжилттай нэмэгдлээ ✓', 'ok');
    setShowAdd(false); setM(EMPTY_MANUAL); onRefresh();
  };

  const setStatus = async (id, status) => {
    setUpdating(id);
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
    setUpdating(null);
    if (error) { showToast('Алдаа гарлаа: ' + error.message, 'err'); return; }
    const msgs = { confirmed:'Батлагдлаа ✓', cancelled:'Цуцлагдлаа', completed:'Дууссан ✓', pending:'Сэргээгдлээ' };
    showToast(msgs[status] || 'Шинэчлэгдлээ', status === 'cancelled' ? 'err' : 'ok');
    onRefresh();
  };

  // ── Өдрөөр бүлэглэх ──────────────────────────────────────────────
  const filtered = filter ? bookings.filter(b => b.status === filter) : bookings;

  const groupedByDate = useMemo(() => {
    // Тухайн өдрийн захиалгуудыг цагаар эрэмблэх
    const sorted = [...filtered].sort((a, b) =>
      (a.booking_time || '').localeCompare(b.booking_time || '')
    );
    const map = {};
    sorted.forEach(b => {
      const key = b.booking_date || '__nodate__';
      if (!map[key]) map[key] = [];
      map[key].push(b);
    });
    const today = todayStr();
    // Өнөөдөр → Ирээдүй (өсөх) → Өнгөрсөн (буурах — хамгийн сүүлийн өчигдрөөс)
    const keys = Object.keys(map);
    const todayKeys  = keys.filter(k => k === today);
    const futureKeys = keys.filter(k => k !== '__nodate__' && k > today).sort();
    const pastKeys   = keys.filter(k => k !== '__nodate__' && k < today).sort().reverse();
    const noDateKeys = keys.filter(k => k === '__nodate__');
    return [...todayKeys, ...futureKeys, ...pastKeys, ...noDateKeys].map(k => [k, map[k]]);
  }, [filtered]);

  // Өнөөдрийн мөрийн artstyle
  const isToday = (dateStr) => dateStr === todayStr();
  const isPast  = (dateStr) => dateStr && dateStr < todayStr();

  const ActionBtns = ({ b }) => {
    const { id, status } = b;
    const dis = updating === id;
    return (
      <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
        {status === 'pending' && <>
          <button className="btn-outline-sm" style={{ color:'var(--green)', borderColor:'var(--green)' }}   disabled={dis} onClick={() => setStatus(id,'confirmed')}>Батлах</button>
          <button className="btn-outline-sm" style={{ color:'var(--red)',   borderColor:'var(--red)' }}     disabled={dis} onClick={() => setStatus(id,'cancelled')}>Цуцлах</button>
        </>}
        {status === 'confirmed' && <>
          <button className="btn-outline-sm" style={{ color:'var(--gold)', borderColor:'var(--gold)' }}     disabled={dis} onClick={() => setStatus(id,'completed')}>Дуусгах</button>
          <button className="btn-outline-sm" style={{ color:'var(--red)',  borderColor:'var(--red)' }}      disabled={dis} onClick={() => setStatus(id,'cancelled')}>Цуцлах</button>
        </>}
        {status === 'cancelled' && (
          <button className="btn-outline-sm" disabled={dis} onClick={() => setStatus(id,'pending')}>Сэргээх</button>
        )}
        {status === 'completed' && <span style={{ color:'var(--gray-500)', fontSize:12 }}>Дууссан</span>}
      </div>
    );
  };

  return (
    <>
    <div className="card" style={{ marginBottom:20 }}>
      <div className="card-header">
        <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <div className="card-title" style={{ marginBottom:0 }}>Бүх захиалгууд</div>
          {filtered.length > 0 && (
            <span style={{ fontSize:11, fontWeight:700, padding:'2px 9px', borderRadius:50, background:'#F3E8FF', color:'#7C3AED' }}>
              {filtered.length} нийт · {groupedByDate.length} өдөр
            </span>
          )}
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <button className="btn-primary" style={{ padding:'8px 16px', fontSize:13 }} onClick={() => { setM(EMPTY_MANUAL); setShowAdd(true); }}>
            + Гараар цаг нэмэх
          </button>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{ padding:'7px 14px', fontSize:13, border:'1px solid var(--gray-200)', borderRadius:50, outline:'none', background:'#fff' }}
          >
            <option value="">Бүх статус</option>
            <option value="pending">Хүлээгдэж байна</option>
            <option value="confirmed">Батлагдсан</option>
            <option value="completed">Дууссан</option>
            <option value="cancelled">Цуцлагдсан</option>
          </select>
          <button
            style={{ padding:'7px 14px', fontSize:12, border:'1px solid var(--gray-200)', borderRadius:50, background:'#fff', cursor:'pointer' }}
            onClick={onRefresh}
          >
            <i className="fas fa-sync-alt" />
          </button>
        </div>
      </div>

      {/* ── Өдрөөр бүлэглэсэн захиалгууд ── */}
      {groupedByDate.length === 0 ? (
        <div style={{ textAlign:'center', padding:'40px 20px', color:'var(--gray-400)' }}>
          <div style={{ fontSize:36, marginBottom:8 }}>📭</div>
          <div style={{ fontSize:14, fontWeight:600 }}>Захиалга байхгүй байна</div>
        </div>
      ) : (
        groupedByDate.map(([dateKey, dayBookings]) => {
          const today  = isToday(dateKey);
          const past   = isPast(dateKey);
          const headerBg    = today ? '#ECFDF5' : past ? '#F9FAFB' : '#EFF6FF';
          const headerColor = today ? '#065F46' : past ? '#6B7280' : '#1E40AF';
          const headerBorder= today ? '#A7F3D0' : past ? '#E5E7EB' : '#BFDBFE';

          return (
            <Fragment key={dateKey}>
              {/* ── Өдрийн хэсгийн header ── */}
              <div style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'10px 20px', background:headerBg,
                borderTop:`2px solid ${headerBorder}`,
                borderBottom:`1px solid ${headerBorder}`,
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:13, fontWeight:700, color:headerColor }}>
                    {formatDateLabel(dateKey)}
                  </span>
                </div>
                <span style={{
                  fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:50,
                  background: today ? '#059669' : past ? '#9CA3AF' : '#2563EB',
                  color:'#fff',
                }}>
                  {dayBookings.length} захиалга
                </span>
              </div>

              {/* ── Тухайн өдрийн захиалгууд ── */}
              <div className="tbl-scroll" style={{ marginBottom:0 }}>
                <table style={{ marginBottom:0 }}>
                  <thead>
                    <tr>
                      <th style={{ width:64 }}>#</th>
                      <th>Утас</th>
                      <th>Үйлчилгээ</th>
                      <th>Артист</th>
                      <th style={{ width:80 }}>Цаг</th>
                      <th>Тэмдэглэл</th>
                      <th>Статус</th>
                      <th>Үйлдэл</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dayBookings.map(b => (
                      <tr key={b.id} style={today ? { background:'#FFFBF5' } : past && b.status !== 'cancelled' ? { opacity:.72 } : {}}>
                        <td style={{ fontSize:11, color:'var(--gray-500)' }}>{b.id.slice(0,6).toUpperCase()}</td>
                        <td><strong>{b.customer_phone}</strong></td>
                        <td style={{ maxWidth:200 }}>{b.service_name}</td>
                        <td>{b.artist_name}</td>
                        <td style={{ fontWeight:700, whiteSpace:'nowrap' }}>{formatTime(b.booking_time)}</td>
                        <td style={{ maxWidth:160, fontSize:12, color: b.notes ? 'var(--dark)' : 'var(--gray-300)' }}>
                          {b.notes ? <span title={b.notes}>📝 {b.notes}</span> : '—'}
                        </td>
                        <td><span className={`badge ${badgeCls(b.status)}`}>{statusMn(b.status)}</span></td>
                        <td><ActionBtns b={b} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Fragment>
          );
        })
      )}

      {/* Гараар цаг нэмэх — модал */}
      {showAdd && (() => {
        const inp = { width:'100%', padding:'9px 12px', borderRadius:10, border:'1.5px solid var(--gray-200)', fontSize:13, fontFamily:'Inter,sans-serif', outline:'none', color:'var(--dark)', background:'#fff', boxSizing:'border-box' };
        const lbl = { fontSize:11, fontWeight:700, color:'var(--gray-500)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:.6 };
        return (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
            onClick={e => { if (e.target === e.currentTarget) setShowAdd(false); }}>
            <div style={{ background:'#fff', borderRadius:20, padding:28, maxWidth:480, width:'100%', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 80px rgba(0,0,0,.18)' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
                <h3 style={{ fontSize:17, fontWeight:700 }}>➕ Гараар цаг нэмэх</h3>
                <button onClick={() => setShowAdd(false)} style={{ background:'var(--gray-100)', border:'none', borderRadius:'50%', width:32, height:32, cursor:'pointer', fontSize:16, color:'var(--gray-500)' }}>✕</button>
              </div>
              <p style={{ fontSize:12, color:'var(--gray-500)', marginBottom:18 }}>Утсаар эсвэл шууд ирсэн үйлчлүүлэгчийн цагийг бүртгэнэ.</p>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div style={{ gridColumn:'1 / -1' }}>
                  <label style={lbl}>Утасны дугаар *</label>
                  <input type="tel" value={m.phone} onChange={e => setMF('phone', e.target.value)} placeholder="99xxxxxx" style={inp} />
                </div>
                <div style={{ gridColumn:'1 / -1' }}>
                  <label style={lbl}>Нэр (заавал биш)</label>
                  <input type="text" value={m.name} onChange={e => setMF('name', e.target.value)} placeholder="Үйлчлүүлэгчийн нэр" style={inp} />
                </div>
                <div style={{ gridColumn:'1 / -1' }}>
                  <label style={lbl}>Артист *</label>
                  <select value={m.artist} onChange={e => setM(prev => ({ ...prev, artist: e.target.value, time: '' }))} style={inp}>
                    <option value="">— Сонгох —</option>
                    {artists.map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn:'1 / -1' }}>
                  <label style={lbl}>Үйлчилгээ *</label>
                  <select value={services.some(s => s.name_mn === m.service) ? m.service : ''} onChange={e => pickService(e.target.value)} style={inp}>
                    <option value="">— Сонгох —</option>
                    {services.map(s => <option key={s.name_mn} value={s.name_mn}>{s.name_mn}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Огноо *</label>
                  <input type="date" value={m.date} min={todayStr()} onChange={e => setM(prev => ({ ...prev, date: e.target.value, time: '' }))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Цаг * <span style={{ textTransform:'none', fontWeight:400, color:'var(--gray-400)' }}>(боломжит)</span></label>
                  <select value={m.time} onChange={e => setMF('time', e.target.value)} style={{ ...inp, cursor:'pointer' }}
                    disabled={!m.artist || !m.date}>
                    {!m.artist || !m.date
                      ? <option value="">Артист, огноо сонгоно уу</option>
                      : adminSlots.length === 0
                        ? <option value="">Боломжит цаг алга</option>
                        : <><option value="">— Сонгох —</option>{adminSlots.map(t => <option key={t} value={t}>{t}</option>)}</>}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Үргэлжлэх (мин)</label>
                  <input type="number" value={m.duration} onChange={e => setMF('duration', e.target.value)} min="15" step="15" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Үнэ (₮)</label>
                  <input type="number" value={m.price} onChange={e => setMF('price', e.target.value)} min="0" placeholder="0" style={inp} />
                </div>
                <div style={{ gridColumn:'1 / -1' }}>
                  <label style={lbl}>Тэмдэглэл</label>
                  <input type="text" value={m.notes} onChange={e => setMF('notes', e.target.value)} placeholder="Нэмэлт мэдээлэл..." style={inp} />
                </div>
              </div>

              <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:22 }}>
                <button className="btn-outline" onClick={() => setShowAdd(false)} style={{ fontSize:13, padding:'9px 20px' }}>Цуцлах</button>
                <button className="btn-primary" onClick={saveManual} disabled={saving} style={{ fontSize:13, padding:'10px 26px' }}>
                  {saving ? 'Хадгалж байна...' : 'Цаг нэмэх'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>

    {/* Бүтээгдэхүүн / Сургалтын худалдан авалт */}
    <div className="card" style={{ marginBottom:20 }}>
      <div className="card-header">
        <div className="card-title">🛍️ Худалдан авалт / Сургалт</div>
        <button style={{ padding:'7px 14px', fontSize:12, border:'1px solid var(--gray-200)', borderRadius:50, background:'#fff', cursor:'pointer' }} onClick={loadOrders}>
          <i className="fas fa-sync-alt" />
        </button>
      </div>
      <div className="tbl-scroll">
        <table>
          <thead>
            <tr><th>Огноо</th><th>Төрөл</th><th>Нэр</th><th>Утас</th><th>Дүн</th><th>Төлбөр</th><th>Үйлдэл</th></tr>
          </thead>
          <tbody>
            {orders.length === 0
              ? <tr><td colSpan={7} style={{ textAlign:'center', padding:28, color:'var(--gray-500)' }}>Худалдан авалт байхгүй байна</td></tr>
              : orders.map(o => {
                const dt = o.created_at ? new Date(o.created_at) : null;
                const when = dt ? `${dt.getMonth()+1}/${dt.getDate()} ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}` : '—';
                const isTraining = o.item_type === 'training';
                return (
                  <tr key={o.id}>
                    <td style={{ whiteSpace:'nowrap', fontSize:12, color:'var(--gray-500)' }}>{when}</td>
                    <td><span style={{ fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:50, background: isTraining ? '#EFF6FF' : '#FFE0EF', color: isTraining ? '#1D4ED8' : '#C2186F', whiteSpace:'nowrap' }}>{isTraining ? '🎓 Сургалт' : '🛍️ Бүтээгдэхүүн'}</span></td>
                    <td>{o.product_name}</td>
                    <td><strong>{o.customer_phone || '—'}</strong></td>
                    <td style={{ fontWeight:700, color:'var(--pink-dark)', whiteSpace:'nowrap' }}>₮{(o.price||0).toLocaleString()}</td>
                    <td>
                      <span style={{ fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:50, background: o.paid ? '#F0FDF4' : '#FFF7ED', color: o.paid ? '#15803D' : '#C2410C', whiteSpace:'nowrap' }}>
                        {o.paid ? '✓ Төлсөн' : 'Хүлээгдэж буй'}
                      </span>
                      {o.paid && o.paid_at && (() => { const d = new Date(o.paid_at); return <div style={{ fontSize:10, color:'var(--gray-500)', marginTop:3 }}>🕐 {d.getMonth()+1}/{d.getDate()} {String(d.getHours()).padStart(2,'0')}:{String(d.getMinutes()).padStart(2,'0')}</div>; })()}
                    </td>
                    <td>
                      <button className="btn-outline-sm" style={{ color:'var(--red)', borderColor:'#fecaca' }} onClick={() => setDelOrder(o)}>
                        🗑 Устгах
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>

    {/* Худалдан авалт устгах баталгаажуулах */}
    {delOrder && (
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
        onClick={e => { if (e.target === e.currentTarget) setDelOrder(null); }}>
        <div style={{ background:'#fff', borderRadius:20, padding:32, maxWidth:360, width:'100%', textAlign:'center', boxShadow:'0 24px 80px rgba(0,0,0,.18)' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🗑️</div>
          <div style={{ fontSize:16, fontWeight:700, marginBottom:6 }}>{delOrder.item_type === 'training' ? 'Сургалт' : 'Худалдан авалт'} устгах уу?</div>
          <div style={{ fontSize:13, color:'var(--gray-500)', marginBottom:4 }}>{delOrder.product_name}</div>
          <div style={{ fontSize:12, color:'var(--gray-500)', marginBottom:20 }}>{delOrder.customer_phone} · ₮{(delOrder.price||0).toLocaleString()}{delOrder.paid ? ' · Төлсөн' : ''}</div>
          <div style={{ display:'flex', gap:10 }}>
            <button className="btn-outline" onClick={() => setDelOrder(null)} style={{ flex:1, fontSize:13, padding:'10px 0' }}>Болих</button>
            <button onClick={() => removeOrder(delOrder.id)} style={{ flex:1, padding:'10px 0', borderRadius:50, border:'none', background:'var(--red)', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>Устгах</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
