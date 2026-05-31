'use client';

function formatDT(date, time) {
  if (!date) return '—';
  const d = new Date(date);
  return `${d.getMonth()+1}-р сар ${d.getDate()}, ${time||''}`;
}
function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;') }
function badgeCls(s){ return {pending:'pend',confirmed:'ok',completed:'info',cancelled:'fail'}[s]||'pend' }
function statusMn(s){ return {pending:'Хүлээгдэж байна',confirmed:'Батлагдсан',completed:'Дууссан',cancelled:'Цуцлагдсан'}[s]||s }

export default function Dashboard({ bookings, onSwitchView }) {
  const today     = new Date().toISOString().split('T')[0];
  const todayBks  = bookings.filter(b => b.booking_date === today);
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

        {/* Today's schedule */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Өнөөдрийн хуваарь</div>
            <span style={{ fontSize:12, color:'var(--gray-500)' }}>{todayBks.length} захиалга</span>
          </div>
          {todayBks.length === 0
            ? <div style={{ color:'var(--gray-500)', fontSize:13, padding:'8px 0' }}>Өнөөдөр захиалга байхгүй байна</div>
            : todayBks
                .sort((a,b) => a.booking_time.localeCompare(b.booking_time))
                .map(b => (
                  <div key={b.id} className="schedule-row">
                    <div className="sch-time">{b.booking_time}</div>
                    <div className="sch-bar">
                      <div className="sch-name">{esc(b.customer_name)}</div>
                      <div className="sch-sub">{esc(b.service_name)} · {esc(b.artist_name)}</div>
                    </div>
                    <span className={`badge ${badgeCls(b.status)}`} style={{ marginLeft:'auto' }}>{statusMn(b.status)}</span>
                  </div>
                ))
          }
        </div>
      </div>

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
