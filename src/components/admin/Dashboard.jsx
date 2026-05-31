'use client';
import { useState } from 'react';

function formatDT(date, time) {
  if (!date) return '—';
  const d = new Date(date);
  return `${d.getMonth()+1}-р сар ${d.getDate()}, ${time||''}`;
}
function badgeCls(s){ return {pending:'pend',confirmed:'ok',completed:'info',cancelled:'fail'}[s]||'pend' }
function statusMn(s){ return {pending:'Хүлээгдэж байна',confirmed:'Батлагдсан',completed:'Дууссан',cancelled:'Цуцлагдсан'}[s]||s }

const STATUS_COLOR = {
  pending:   { bg:'#FFF7ED', border:'#FB923C', text:'#C2410C', dot:'#F97316' },
  confirmed: { bg:'#F0FDF4', border:'#4ADE80', text:'#15803D', dot:'#22C55E' },
  completed: { bg:'#EFF6FF', border:'#60A5FA', text:'#1D4ED8', dot:'#3B82F6' },
  cancelled: { bg:'#FEF2F2', border:'#FCA5A5', text:'#B91C1C', dot:'#EF4444' },
};

const HOURS = Array.from({ length: 10 }, (_, i) => i + 9); // 09:00–18:00
const SLOT_H = 64; // px per hour

function TodayCalendar({ bookings }) {
  const [tooltip, setTooltip] = useState(null);

  // Unique artists from today's bookings
  const artists = [...new Set(bookings.map(b => b.artist_name).filter(Boolean))].sort();

  // Current time indicator
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const startMins = 9 * 60;
  const endMins   = 19 * 60;
  const nowPct = nowMins >= startMins && nowMins <= endMins
    ? ((nowMins - startMins) / (endMins - startMins)) * 100
    : null;

  const timeToTop = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    return ((h * 60 + m - startMins) / (endMins - startMins)) * 100;
  };

  if (bookings.length === 0) {
    return (
      <div style={{ textAlign:'center', padding:'32px 0', color:'var(--gray-500)' }}>
        <div style={{ fontSize:36, marginBottom:8 }}>📅</div>
        <div style={{ fontSize:13 }}>Өнөөдөр захиалга байхгүй байна</div>
      </div>
    );
  }

  const totalH = SLOT_H * HOURS.length;

  return (
    <div style={{ overflowX:'auto' }}>
      <div style={{ minWidth: artists.length > 1 ? artists.length * 140 + 56 : 300 }}>
        {/* Header — artist names */}
        <div style={{ display:'flex', marginLeft:56, marginBottom:4 }}>
          {artists.map(a => (
            <div key={a} style={{ flex:1, minWidth:120, textAlign:'center', fontSize:12, fontWeight:700, color:'var(--gray-600)', padding:'0 4px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              👩 {a}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display:'flex', position:'relative' }}>
          {/* Time axis */}
          <div style={{ width:48, flexShrink:0, position:'relative', height:totalH }}>
            {HOURS.map(h => (
              <div key={h} style={{ position:'absolute', top: SLOT_H * (h - 9), width:'100%', height:SLOT_H }}>
                <span style={{ fontSize:11, color:'var(--gray-400)', fontWeight:600, lineHeight:1 }}>
                  {String(h).padStart(2,'0')}:00
                </span>
              </div>
            ))}
          </div>

          {/* Columns per artist */}
          <div style={{ flex:1, position:'relative', height:totalH, display:'flex' }}>
            {/* Hour grid lines */}
            {HOURS.map(h => (
              <div key={h} style={{
                position:'absolute', left:0, right:0,
                top: SLOT_H * (h - 9),
                height:1, background:'#F3F4F6', zIndex:0,
              }} />
            ))}

            {/* Now line */}
            {nowPct !== null && (
              <div style={{
                position:'absolute', left:0, right:0,
                top:`${nowPct}%`, height:2,
                background:'#EF4444', zIndex:10,
                display:'flex', alignItems:'center',
              }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:'#EF4444', marginLeft:-4 }} />
              </div>
            )}

            {artists.map((artist, ci) => {
              const artistBks = bookings.filter(b => b.artist_name === artist);
              return (
                <div key={artist} style={{ flex:1, minWidth:120, position:'relative', borderLeft: ci > 0 ? '1px solid #F3F4F6' : 'none' }}>
                  {artistBks.map(b => {
                    const topPct = timeToTop(b.booking_time);
                    const sc = STATUS_COLOR[b.status] || STATUS_COLOR.pending;
                    return (
                      <div key={b.id}
                        onMouseEnter={() => setTooltip(b.id)}
                        onMouseLeave={() => setTooltip(null)}
                        style={{
                          position:'absolute', left:4, right:4,
                          top:`calc(${topPct}% + 1px)`,
                          minHeight:52, padding:'6px 8px',
                          background:sc.bg,
                          border:`1.5px solid ${sc.border}`,
                          borderRadius:10, cursor:'default',
                          zIndex:5, overflow:'hidden',
                          transition:'box-shadow .15s',
                          boxShadow: tooltip === b.id ? `0 4px 16px ${sc.border}55` : '0 1px 4px rgba(0,0,0,.06)',
                        }}>
                        <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:2 }}>
                          <div style={{ width:7, height:7, borderRadius:'50%', background:sc.dot, flexShrink:0 }} />
                          <span style={{ fontSize:11, fontWeight:700, color:sc.text }}>{b.booking_time}</span>
                        </div>
                        <div style={{ fontSize:12, fontWeight:700, color:'#1F2937', lineHeight:1.2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {b.customer_name}
                        </div>
                        <div style={{ fontSize:10, color:'#6B7280', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {b.service_name}
                        </div>
                        {tooltip === b.id && (
                          <div style={{
                            position:'absolute', bottom:'calc(100% + 6px)', left:0,
                            background:'#1F2937', color:'white', borderRadius:8,
                            padding:'8px 10px', fontSize:11, zIndex:20,
                            whiteSpace:'nowrap', pointerEvents:'none',
                            boxShadow:'0 4px 16px rgba(0,0,0,.2)',
                          }}>
                            <div style={{ fontWeight:700, marginBottom:2 }}>{b.customer_name}</div>
                            <div>{b.service_name}</div>
                            {b.customer_phone && <div>📞 {b.customer_phone}</div>}
                            <div style={{ marginTop:4 }}>
                              <span style={{ background:sc.dot, borderRadius:4, padding:'1px 6px', fontSize:10, fontWeight:700 }}>
                                {statusMn(b.status)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ bookings, onSwitchView }) {
  const today     = new Date().toISOString().split('T')[0];
  const todayBks  = bookings.filter(b => b.booking_date === today && b.status !== 'cancelled');
  const pendingBks= bookings.filter(b => b.status === 'pending');
  const totalRev  = bookings.filter(b => b.status !== 'cancelled').reduce((s,b) => s+(b.total_price||0), 0);
  const recent    = [...bookings].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);

  const stats = [
    { lbl:'Нийт захиалга',        val:bookings.length,   chg:`${pendingBks.length} хүлээгдэж байна`, ico:'📅', cls:'pink' },
    { lbl:'Нийт орлого',          val:'₮'+totalRev.toLocaleString(), chg:'Нийт үнийн дүн', ico:'💰', cls:'gold' },
    { lbl:'Өнөөдрийн захиалга',   val:todayBks.length,   chg:'Өнөөдөр',             ico:'📆', cls:'green' },
    { lbl:'Батлах хүлээгдэж буй', val:pendingBks.length, chg:'Шинэ захиалга',       ico:'⏳', cls:'blue' },
  ];

  return (
    <>
      {/* Stats */}
      <div className="stats-grid">
        {stats.map((s,i) => (
          <div key={i} className="stat-card">
            <div>
              <div className="sc-lbl">{s.lbl}</div>
              <div className="sc-val">{s.val}</div>
              <div className="sc-chg">{s.chg}</div>
            </div>
            <div className={`sc-ico ${s.cls}`}>{s.ico}</div>
          </div>
        ))}
      </div>

      {/* Today's schedule — full width timeline calendar */}
      <div className="card" style={{ marginBottom:20 }}>
        <div className="card-header" style={{ marginBottom:16 }}>
          <div className="card-title">📅 Өнөөдрийн хуваарь</div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {[['pending','#F97316','Хүлээгдэж байна'],['confirmed','#22C55E','Батлагдсан'],['completed','#3B82F6','Дууссан']].map(([s,c,l]) => (
                <span key={s} style={{ fontSize:11, color:'#6B7280', display:'flex', alignItems:'center', gap:4 }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:c, display:'inline-block' }} />{l}
                </span>
              ))}
            </div>
            <span style={{ fontSize:12, color:'var(--gray-500)', fontWeight:600 }}>{todayBks.length} захиалга</span>
          </div>
        </div>
        <TodayCalendar bookings={todayBks.sort((a,b) => a.booking_time.localeCompare(b.booking_time))} />
      </div>

      <div className="two-col" style={{ marginBottom:20 }}>
        {/* Chart placeholder */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Орлогын тойм</div>
          </div>
          <div style={{ height:120, display:'flex', alignItems:'flex-end', gap:6, padding:'0 8px' }}>
            {[40,65,50,80,45,90,70].map((h,i) => (
              <div key={i} style={{ flex:1, height:`${h}%`, background:'linear-gradient(to top,var(--pink),var(--pink-light))', borderRadius:'6px 6px 0 0', opacity:.8 }} />
            ))}
          </div>
        </div>
        <div className="card" style={{ minHeight:0 }} /></div>

      {/* Recent bookings */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Ойрын захиалгууд</div>
          <button className="admin-btn-ghost" onClick={() => onSwitchView('appointments')}>Бүгдийг харах</button>
        </div>
        <div className="tbl-scroll">
          <table>
            <thead><tr><th>Огноо & Цаг</th><th>Үйлчлүүлэгч</th><th>Үйлчилгээ</th><th>Уран бүтээлч</th><th>Статус</th></tr></thead>
            <tbody>
              {recent.length === 0
                ? <tr><td colSpan={5} style={{ textAlign:'center', padding:24, color:'var(--gray-500)' }}>Захиалга байхгүй байна</td></tr>
                : recent.map(b => (
                  <tr key={b.id}>
                    <td>{formatDT(b.booking_date, b.booking_time)}</td>
                    <td><strong>{b.customer_name}</strong></td>
                    <td>{b.service_name}</td>
                    <td>{b.artist_name}</td>
                    <td><span className={`badge ${badgeCls(b.status)}`}>{statusMn(b.status)}</span></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
