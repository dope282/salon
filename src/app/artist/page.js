'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth }  from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import TimeSelect   from '@/components/admin/TimeSelect';

const DAYS = [
  { day:1, label:'Даваа' }, { day:2, label:'Мягмар' }, { day:3, label:'Лхагва' },
  { day:4, label:'Пүрэв' }, { day:5, label:'Баасан' }, { day:6, label:'Бямба' }, { day:0, label:'Ням' },
];
const DEFAULT_SCHEDULE = DAYS.map(d => ({
  ...d, active: d.day >= 1 && d.day <= 5, start: '09:00', end: '18:00',
}));

const STATUS = {
  pending:   { label:'Хүлээгдэж буй', bg:'#FEF3C7', fg:'#B45309' },
  confirmed: { label:'Баталгаажсан',  bg:'#DCFCE7', fg:'#15803D' },
  cancelled: { label:'Цуцлагдсан',    bg:'#FEE2E2', fg:'#DC2626' },
  completed: { label:'Дууссан',        bg:'#F3F4F6', fg:'#6B7280' },
};

export default function ArtistPage() {
  const { user, loading, artist, isArtist, artistChecked, signOut } = useAuth();
  const router = useRouter();
  const [tab, setTab]           = useState('schedule');
  const [schedule, setSchedule] = useState([...DEFAULT_SCHEDULE]);
  const [saving, setSaving]     = useState(false);
  const [bookings, setBookings] = useState([]);
  const [bkLoading, setBkLoading] = useState(false);
  const [confirmId, setConfirmId] = useState(null);   // дуусгахыг баталгаажуулах захиалгын id
  const [busyId, setBusyId]       = useState(null);
  const [toast, setToast]       = useState({ show:false, msg:'', type:'ok' });

  const showToast = (msg, type='ok') => {
    setToast({ show:true, msg, type });
    setTimeout(() => setToast(t => ({ ...t, show:false })), 3000);
  };

  /* ── guard ── */
  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace('/'); return; }
    if (artistChecked && !isArtist) { router.replace('/'); }
  }, [loading, user, artistChecked, isArtist, router]);

  /* ── load own schedule ── */
  const loadSchedule = useCallback(async (artistId) => {
    const { data } = await supabase.from('artist_schedules').select('*').eq('artist_id', artistId);
    if (data?.length) {
      const dbMap = {};
      data.forEach(r => { dbMap[r.day_of_week] = r; });
      setSchedule(DEFAULT_SCHEDULE.map(d => {
        const r = dbMap[d.day];
        return r ? { ...d, active: r.is_active, start: r.start_time, end: r.end_time } : d;
      }));
    } else {
      setSchedule([...DEFAULT_SCHEDULE]);
    }
  }, []);

  /* ── load own bookings ── */
  const loadBookings = useCallback(async (artistName) => {
    setBkLoading(true);
    const { data } = await supabase.from('bookings').select('*')
      .eq('artist_name', artistName)
      .order('booking_date', { ascending: false })
      .order('booking_time', { ascending: false });
    setBookings(data || []);
    setBkLoading(false);
  }, []);

  useEffect(() => {
    if (artist?.id) { loadSchedule(artist.id); loadBookings(artist.name); }
  }, [artist?.id, artist?.name, loadSchedule, loadBookings]);

  /* ── save schedule ── */
  const save = async () => {
    if (!artist?.id) return;
    setSaving(true);
    await supabase.from('artist_schedules').delete().eq('artist_id', artist.id);
    const { error } = await supabase.from('artist_schedules').insert(
      schedule.map(d => ({ artist_id: artist.id, day_of_week: d.day, start_time: d.start, end_time: d.end, is_active: d.active }))
    );
    setSaving(false);
    if (error) showToast('Алдаа: ' + error.message, 'err');
    else showToast('Хуваарь хадгалагдлаа ✓', 'ok');
  };

  /* ── захиалгыг дуусгаж, төлсөн болгох ── */
  const completeBooking = async (b) => {
    setBusyId(b.id);
    const { error } = await supabase.from('bookings')
      .update({ status: 'completed', paid: true, paid_at: new Date().toISOString() })
      .eq('id', b.id);
    setBusyId(null);
    setConfirmId(null);
    if (error) { showToast('Алдаа: ' + error.message, 'err'); return; }
    showToast('Дууссан · төлсөн болголоо ✓', 'ok');
    if (artist?.name) loadBookings(artist.name);
  };

  const handleLogout = async () => { await signOut(); router.replace('/'); };

  if (loading || !artistChecked) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:'Inter,sans-serif' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>💅</div>
          <div style={{ color:'var(--gray-500)' }}>Ачааллаж байна...</div>
        </div>
      </div>
    );
  }
  if (!isArtist) return null;

  const today = new Date().toISOString().split('T')[0];
  const upcoming = bookings.filter(b => b.status !== 'cancelled' && b.booking_date >= today);
  const past     = bookings.filter(b => b.status === 'cancelled' || b.booking_date < today);

  const inp = { padding:'6px 10px', borderRadius:8, border:'1.5px solid var(--gray-200)', fontSize:13, outline:'none', fontFamily:'Inter,sans-serif', background:'#fff', color:'var(--dark)', cursor:'pointer' };

  const BookingCard = ({ b }) => {
    const st = STATUS[b.status] || STATUS.pending;
    return (
      <div style={{ border:'1.5px solid var(--gray-200)', borderRadius:14, padding:'14px 16px', background:'#fff', display:'flex', flexDirection:'column', gap:8 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10 }}>
          <div style={{ fontWeight:700, fontSize:14, color:'var(--dark)' }}>{b.service_name}</div>
          <span style={{ fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:50, background:st.bg, color:st.fg, whiteSpace:'nowrap' }}>{st.label}</span>
        </div>
        <div style={{ display:'flex', gap:14, flexWrap:'wrap', fontSize:12, color:'var(--gray-500)' }}>
          <span>📅 {b.booking_date}</span>
          <span>🕐 {b.booking_time}</span>
          {b.duration_min > 0 && <span>⏱ {b.duration_min} мин</span>}
          {b.customer_phone && <span>📞 {b.customer_phone}</span>}
        </div>
        <div style={{ display:'flex', gap:14, flexWrap:'wrap', fontSize:12, alignItems:'center' }}>
          <span style={{ color:'var(--gray-500)' }}>💳 {b.payment_method === 'qpay' ? 'QPay' : 'Бэлнээр'}</span>
          {b.paid && <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:50, background:'#DCFCE7', color:'#15803D' }}>✓ Төлсөн</span>}
          {b.total_price > 0 && <span style={{ marginLeft:'auto', fontWeight:700, color:'var(--pink-dark)' }}>₮{Number(b.total_price).toLocaleString()}</span>}
        </div>
        {b.notes && <div style={{ fontSize:12, color:'var(--gray-500)', fontStyle:'italic', borderTop:'1px solid var(--gray-100)', paddingTop:6 }}>📝 {b.notes}</div>}

        {/* Дуусгах үйлдэл — зөвхөн дуусаагүй/цуцлагдаагүй захиалгад */}
        {b.status !== 'completed' && b.status !== 'cancelled' && (
          <div style={{ borderTop:'1px solid var(--gray-100)', paddingTop:10, marginTop:2 }}>
            {confirmId === b.id ? (
              <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                <span style={{ fontSize:12, fontWeight:600, color:'var(--dark)' }}>Үйлчилгээг дуусгаж, төлбөрийг хүлээж авсан уу?</span>
                <div style={{ display:'flex', gap:8, marginLeft:'auto' }}>
                  <button onClick={() => setConfirmId(null)} disabled={busyId===b.id}
                    style={{ padding:'7px 14px', borderRadius:50, border:'1.5px solid var(--gray-200)', background:'#fff', fontSize:12, fontWeight:600, cursor:'pointer', color:'var(--gray-500)' }}>Болих</button>
                  <button onClick={() => completeBooking(b)} disabled={busyId===b.id}
                    style={{ padding:'7px 16px', borderRadius:50, border:'none', background:'linear-gradient(135deg,#38A169,#276749)', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', opacity: busyId===b.id?0.6:1 }}>
                    {busyId===b.id ? 'Хадгалж байна...' : 'Тийм, дуусгах'}
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setConfirmId(b.id)}
                style={{ width:'100%', padding:'9px 0', borderRadius:50, border:'1.5px solid #86efac', background:'#f0fdf4', color:'#15803D', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                ✓ Үйлчилгээ дуусгаж, төлсөн болгох
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ minHeight:'100vh', background:'#FAFAFA', fontFamily:'Inter,sans-serif', color:'var(--dark)' }}>
      {/* Header */}
      <div style={{ background:'#fff', borderBottom:'1.5px solid var(--gray-200)', padding:'16px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:46, height:46, borderRadius:'50%', background:'linear-gradient(135deg,#FFD6E8,#FFBCD9)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, overflow:'hidden' }}>
            {artist.image_url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={artist.image_url} alt={artist.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : (artist.avatar_emoji || '👩')}
          </div>
          <div>
            <div style={{ fontWeight:800, fontSize:17 }}>{artist.name}</div>
            <div style={{ fontSize:12, color:'var(--gray-500)' }}>{artist.specialty_mn || 'Артист'}</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <a href="/" style={{ padding:'8px 16px', borderRadius:50, border:'1.5px solid var(--gray-200)', background:'#fff', fontSize:13, fontWeight:600, color:'var(--dark)', textDecoration:'none' }}>← Нүүр</a>
          <button onClick={handleLogout} style={{ padding:'8px 16px', borderRadius:50, border:'1.5px solid #fecaca', background:'#fff5f5', fontSize:13, fontWeight:600, color:'var(--red)', cursor:'pointer' }}>Гарах</button>
        </div>
      </div>

      <div style={{ maxWidth:720, margin:'0 auto', padding:'24px 16px' }}>
        {/* Tabs */}
        <div style={{ display:'flex', gap:8, marginBottom:20 }}>
          {[['schedule','📅 Миний хуваарь'],['bookings',`📋 Захиалгууд (${bookings.length})`]].map(([id,lbl]) => (
            <button key={id} onClick={() => setTab(id)}
              style={{ flex:1, padding:'11px 0', borderRadius:12, border:'2px solid', cursor:'pointer', fontSize:13, fontWeight:700,
                borderColor: tab===id ? 'var(--pink)' : 'var(--gray-200)',
                background:  tab===id ? 'var(--pink-light)' : '#fff',
                color:       tab===id ? 'var(--pink-dark)' : 'var(--gray-500)' }}>
              {lbl}
            </button>
          ))}
        </div>

        {/* ── Schedule ── */}
        {tab === 'schedule' && (
          <div style={{ background:'#fff', borderRadius:20, padding:20, border:'1.5px solid var(--gray-200)' }}>
            <div style={{ fontSize:13, color:'var(--gray-500)', marginBottom:14 }}>
              Ажиллах өдөр, цагаа тохируулна уу. Үйлчлүүлэгчид зөвхөн идэвхтэй өдрийн боломжит цагаар захиална.
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {schedule.map((d, i) => (
                <div key={d.day} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:12, background: d.active ? '#fff' : 'var(--gray-100)', border:`1.5px solid ${d.active ? 'var(--gray-200)' : 'var(--gray-100)'}`, flexWrap:'wrap' }}>
                  <div style={{ width:60, fontSize:13, fontWeight:700, color: d.active ? 'var(--dark)' : 'var(--gray-500)' }}>{d.label}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }} onClick={() => setSchedule(prev => prev.map((s,j) => j===i ? { ...s, active:!s.active } : s))}>
                    <div style={{ width:36, height:20, borderRadius:10, background: d.active ? 'var(--pink)' : 'var(--gray-200)', position:'relative', transition:'background .2s' }}>
                      <div style={{ position:'absolute', top:2, left: d.active ? 17 : 2, width:16, height:16, borderRadius:'50%', background:'#fff', boxShadow:'0 1px 3px rgba(0,0,0,.2)', transition:'left .2s' }} />
                    </div>
                    <span style={{ fontSize:12, fontWeight:600, color: d.active ? 'var(--pink-dark)' : 'var(--gray-500)', minWidth:50 }}>{d.active ? 'Ажиллана' : 'Амарна'}</span>
                  </div>
                  {d.active && (
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                      <TimeSelect value={d.start} onChange={v => setSchedule(prev => prev.map((s,j) => j===i ? { ...s, start:v } : s))} style={inp} />
                      <span style={{ color:'var(--gray-500)', fontSize:13, fontWeight:600 }}>—</span>
                      <TimeSelect value={d.end} onChange={v => setSchedule(prev => prev.map((s,j) => j===i ? { ...s, end:v } : s))} style={inp} />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', marginTop:18 }}>
              <button onClick={save} disabled={saving}
                style={{ padding:'11px 30px', borderRadius:50, border:'none', background:'linear-gradient(135deg,#FF3399,#FF66B2)', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', opacity: saving?0.6:1 }}>
                {saving ? 'Хадгалж байна...' : '💾 Хуваарь хадгалах'}
              </button>
            </div>
          </div>
        )}

        {/* ── Bookings ── */}
        {tab === 'bookings' && (
          bkLoading ? (
            <div style={{ textAlign:'center', padding:40, color:'var(--gray-500)' }}>Ачааллаж байна...</div>
          ) : bookings.length === 0 ? (
            <div style={{ textAlign:'center', padding:'48px 20px', color:'var(--gray-500)', background:'#fff', borderRadius:20, border:'1.5px solid var(--gray-200)' }}>
              <div style={{ fontSize:44, marginBottom:10 }}>📭</div>
              <div style={{ fontSize:14, fontWeight:600 }}>Одоохондоо захиалга алга</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
              {upcoming.length > 0 && (
                <div>
                  <div style={{ fontSize:11, fontWeight:800, color:'var(--gray-500)', textTransform:'uppercase', letterSpacing:1, marginBottom:10 }}>Удахгүй болох ({upcoming.length})</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>{upcoming.map(b => <BookingCard key={b.id} b={b} />)}</div>
                </div>
              )}
              {past.length > 0 && (
                <div style={{ opacity:.65 }}>
                  <div style={{ fontSize:11, fontWeight:800, color:'var(--gray-500)', textTransform:'uppercase', letterSpacing:1, marginBottom:10 }}>Өнгөрсөн / Цуцлагдсан ({past.length})</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>{past.map(b => <BookingCard key={b.id} b={b} />)}</div>
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* Toast */}
      {toast.show && (
        <div style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', background: toast.type==='ok' ? 'linear-gradient(135deg,#38A169,#276749)' : 'linear-gradient(135deg,#E53E3E,#C53030)', color:'#fff', padding:'12px 22px', borderRadius:14, fontSize:14, fontWeight:600, zIndex:9999, boxShadow:'0 8px 28px rgba(0,0,0,.18)' }}>
          {toast.type==='ok' ? '✓ ' : '✕ '}{toast.msg}
        </div>
      )}
    </div>
  );
}
