'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

function formatDT(date, time) {
  if (!date) return '—';
  const d = new Date(date);
  return `${d.getMonth()+1}-р сар ${d.getDate()}, ${time||''}`;
}
function badgeCls(s){ return {pending:'pend',confirmed:'ok',completed:'info',cancelled:'fail'}[s]||'pend' }
function statusMn(s){ return {pending:'Хүлээгдэж байна',confirmed:'Батлагдсан',completed:'Дууссан',cancelled:'Цуцлагдсан'}[s]||s }

export default function BookingsTable({ bookings, onRefresh, showToast }) {
  const [filter, setFilter] = useState('');
  const [updating, setUpdating] = useState(null);

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
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
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
    </div>
  );
}
