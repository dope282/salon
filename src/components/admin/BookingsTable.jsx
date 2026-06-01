'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

function formatDT(date, time) {
  if (!date) return '—';
  const d = new Date(date);
  return `${d.getMonth()+1}-р сар ${d.getDate()}, ${time||''}`;
}
function badgeCls(s){ return {pending:'pend',confirmed:'ok',completed:'info',cancelled:'fail'}[s]||'pend' }
function statusMn(s){ return {pending:'Хүлээгдэж байна',confirmed:'Батлагдсан',completed:'Дууссан',cancelled:'Цуцлагдсан'}[s]||s }

const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const EMPTY_MANUAL = { phone:'', name:'', artist:'', service:'', date: todayStr(), time:'10:00', duration:'60', price:'', notes:'' };

export default function BookingsTable({ bookings, onRefresh, showToast }) {
  const [filter, setFilter] = useState('');
  const [updating, setUpdating] = useState(null);
  const [artists, setArtists]   = useState([]);
  const [services, setServices] = useState([]);
  const [showAdd, setShowAdd]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [m, setM]               = useState(EMPTY_MANUAL);

  useEffect(() => {
    Promise.all([
      supabase.from('artists').select('name').eq('active', true).order('id'),
      supabase.from('services').select('name_mn, duration_min, price_from').eq('active', true).order('id'),
    ]).then(([{ data: a }, { data: s }]) => { setArtists(a || []); setServices(s || []); });
  }, []);

  const setMF = (k, v) => setM(prev => ({ ...prev, [k]: v }));
  const pickService = (name) => {
    const svc = services.find(s => s.name_mn === name);
    setM(prev => ({ ...prev, service: name,
      duration: svc?.duration_min ? String(svc.duration_min) : prev.duration,
      price: svc?.price_from ? String(svc.price_from) : prev.price }));
  };

  const saveManual = async () => {
    if (!/^[0-9]{8}$/.test(m.phone.trim())) { showToast('Утасны дугаар 8 оронтой байх ёстой', 'err'); return; }
    if (!m.artist)  { showToast('Артист сонгоно уу', 'err'); return; }
    if (!m.service.trim()) { showToast('Үйлчилгээ оруулна уу', 'err'); return; }
    if (!m.date || !m.time) { showToast('Огноо болон цаг оруулна уу', 'err'); return; }
    setSaving(true);
    const { error } = await supabase.from('bookings').insert([{
      customer_name: m.name.trim() || m.phone.trim(),
      customer_phone: m.phone.trim(),
      service_name: m.service.trim(),
      artist_name: m.artist,
      booking_date: m.date,
      booking_time: m.time,
      duration_min: parseInt(m.duration) || 60,
      total_price: parseInt(m.price) || 0,
      payment_method: 'cash',
      notes: m.notes.trim() || null,
      status: 'confirmed',
    }]);
    setSaving(false);
    if (error) { showToast('Алдаа: ' + error.message, 'err'); return; }
    showToast('Цаг амжилттай нэмэгдлээ ✓', 'ok');
    setShowAdd(false); setM(EMPTY_MANUAL); onRefresh();
  };

  const filtered = filter ? bookings.filter(b => b.status === filter) : bookings;

  const setStatus = async (id, status) => {
    setUpdating(id);
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
    setUpdating(null);
    if (error) { showToast('Алдаа гарлаа: ' + error.message, 'err'); return; }
    const msgs = { confirmed:'Батлагдлаа ✓', cancelled:'Цуцлагдлаа', completed:'Дууссан ✓', pending:'Сэргээгдлээ' };
    showToast(msgs[status] || 'Шинэчлэгдлээ', status === 'cancelled' ? 'err' : 'ok');
    onRefresh();
  };

  const ActionBtns = ({ b }) => {
    const { id, status } = b;
    const dis = updating === id;
    return (
      <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
        {status === 'pending' && <>
          <button className="btn-outline-sm" style={{ color:'var(--green)', borderColor:'var(--green)' }} disabled={dis} onClick={() => setStatus(id,'confirmed')}>Батлах</button>
          <button className="btn-outline-sm" style={{ color:'var(--red)', borderColor:'var(--red)' }}     disabled={dis} onClick={() => setStatus(id,'cancelled')}>Цуцлах</button>
        </>}
        {status === 'confirmed' && <>
          <button className="btn-outline-sm" style={{ color:'var(--gold)', borderColor:'var(--gold)' }}   disabled={dis} onClick={() => setStatus(id,'completed')}>Дуусгах</button>
          <button className="btn-outline-sm" style={{ color:'var(--red)', borderColor:'var(--red)' }}     disabled={dis} onClick={() => setStatus(id,'cancelled')}>Цуцлах</button>
        </>}
        {status === 'cancelled' && (
          <button className="btn-outline-sm" disabled={dis} onClick={() => setStatus(id,'pending')}>Сэргээх</button>
        )}
        {status === 'completed' && <span style={{ color:'var(--gray-500)', fontSize:12 }}>Дууссан</span>}
      </div>
    );
  };

  return (
    <div className="card" style={{ marginBottom:20 }}>
      <div className="card-header">
        <div className="card-title">Бүх захиалгууд</div>
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
      <div className="tbl-scroll">
        <table>
          <thead>
            <tr><th>#</th><th>Утас</th><th>Үйлчилгээ</th><th>Уран бүтээлч</th><th>Огноо & Цаг</th><th>Тэмдэглэл</th><th>Статус</th><th>Үйлдэл</th></tr>
          </thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={8} style={{ textAlign:'center', padding:32, color:'var(--gray-500)' }}>Захиалга байхгүй байна</td></tr>
              : filtered.map(b => (
                <tr key={b.id}>
                  <td style={{ fontSize:11, color:'var(--gray-500)' }}>{b.id.slice(0,6).toUpperCase()}</td>
                  <td><strong>{b.customer_phone}</strong></td>
                  <td>{b.service_name}</td>
                  <td>{b.artist_name}</td>
                  <td>{formatDT(b.booking_date, b.booking_time)}</td>
                  <td style={{ maxWidth:200, fontSize:12, color: b.notes ? 'var(--dark)' : 'var(--gray-300)' }}>
                    {b.notes ? <span title={b.notes}>📝 {b.notes}</span> : '—'}
                  </td>
                  <td><span className={`badge ${badgeCls(b.status)}`}>{statusMn(b.status)}</span></td>
                  <td><ActionBtns b={b} /></td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

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
                  <select value={m.artist} onChange={e => setMF('artist', e.target.value)} style={inp}>
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
                  <input type="date" value={m.date} onChange={e => setMF('date', e.target.value)} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Цаг *</label>
                  <input type="time" value={m.time} onChange={e => setMF('time', e.target.value)} step="300" style={inp} />
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
  );
}
