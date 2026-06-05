'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import TimeSelect from '@/components/admin/TimeSelect';

const EMPTY = {
  name: '', specialty_mn: '', rating: '5.0',
  review_count: '0', avatar_emoji: '👩', image_url: '', active: true,
  pay_qpay: true, pay_cash: false,
};

const DAYS = [
  { day:1, label:'Даваа' }, { day:2, label:'Мягмар' }, { day:3, label:'Лхагва' },
  { day:4, label:'Пүрэв' }, { day:5, label:'Баасан' }, { day:6, label:'Бямба' }, { day:0, label:'Ням' },
];
const DEFAULT_SCHEDULE = DAYS.map(d => ({
  ...d, active: d.day >= 1 && d.day <= 5, start: '09:00', end: '18:00',
}));

export default function ArtistsManager({ showToast }) {
  const [artists,          setArtists]          = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [form,             setForm]             = useState(null);
  const [saving,           setSaving]           = useState(false);
  const [uploading,        setUploading]        = useState(false);
  const [dragOver,         setDragOver]         = useState(false);
  const [delId,            setDelId]            = useState(null);
  const [allServices,      setAllServices]      = useState([]);
  const [selServices,      setSelServices]      = useState([]);
  const [artistServiceMap, setArtistServiceMap] = useState({});
  const [schedule,         setSchedule]         = useState([...DEFAULT_SCHEDULE]);
  const fileRef = useRef(null);

  useEffect(() => {
    load();
    // Load services list once
    supabase.from('services').select('id, name_mn, emoji').eq('active', true).order('id')
      .then(({ data }) => setAllServices(data || []));
  }, []);

  const load = async () => {
    setLoading(true);
    const [{ data: artistData }, { data: svcLinks }] = await Promise.all([
      supabase.from('artists').select('*').order('id'),
      supabase.from('artist_services').select('artist_id, service_id'),
    ]);
    // Build map: artistId → serviceId[]
    const svcMap = {};
    (svcLinks || []).forEach(({ artist_id, service_id }) => {
      if (!svcMap[artist_id]) svcMap[artist_id] = [];
      svcMap[artist_id].push(service_id);
    });
    setArtistServiceMap(svcMap);
    setArtists(artistData || []);
    setLoading(false);
  };

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const scrollToForm = () => setTimeout(() => {
    const el = document.getElementById('adminMain');
    (el || window).scrollTo({ top: 99999, behavior: 'smooth' });
  }, 50);

  const loadSchedule = async (artistId) => {
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
  };

  const openAdd  = () => {
    setForm({ ...EMPTY });
    setSelServices([]);
    setSchedule([...DEFAULT_SCHEDULE]);
    scrollToForm();
  };
  const openEdit = (a) => {
    setForm({ ...a, rating: String(a.rating), review_count: String(a.review_count) });
    setSelServices(artistServiceMap[a.id] || []);
    loadSchedule(a.id);
    scrollToForm();
  };

  /* ── save (artist + artist_services) ── */
  const save = async () => {
    if (!form.name.trim()) { showToast('Нэр оруулна уу', 'err'); return; }
    setSaving(true);
    const payload = {
      name:         form.name.trim(),
      specialty_mn: form.specialty_mn.trim(),
      rating:       parseFloat(form.rating) || 5.0,
      review_count: parseInt(form.review_count) || 0,
      avatar_emoji: form.avatar_emoji.trim() || '👩',
      image_url:    form.image_url.trim(),
      active:       form.active,
      pay_qpay:     form.pay_qpay !== false,
      pay_cash:     form.pay_cash === true,
    };

    let error, artistId = form.id;
    if (form.id) {
      ({ error } = await supabase.from('artists').update(payload).eq('id', form.id));
    } else {
      const { data: newA, error: insertErr } = await supabase.from('artists').insert(payload).select('id').single();
      error = insertErr;
      if (newA) artistId = newA.id;
    }

    if (error) { setSaving(false); showToast('Алдаа: ' + error.message, 'err'); return; }

    // Sync artist_services + artist_schedules
    if (artistId) {
      await Promise.all([
        supabase.from('artist_services').delete().eq('artist_id', artistId),
        supabase.from('artist_schedules').delete().eq('artist_id', artistId),
      ]);
      const toInsert = [];
      if (selServices.length > 0)
        toInsert.push(supabase.from('artist_services').insert(selServices.map(sid => ({ artist_id: artistId, service_id: sid }))));
      // Always save full schedule (7 days)
      toInsert.push(supabase.from('artist_schedules').insert(
        schedule.map(d => ({ artist_id: artistId, day_of_week: d.day, start_time: d.start, end_time: d.end, is_active: d.active }))
      ));
      await Promise.all(toInsert);
    }

    setSaving(false);
    showToast(form.id ? 'Артист шинэчлэгдлээ ✓' : 'Артист нэмэгдлээ ✓', 'ok');
    setForm(null);
    setSelServices([]);
    setSchedule([...DEFAULT_SCHEDULE]);
    load();
  };

  /* ── delete ── */
  const remove = async (id) => {
    const { error } = await supabase.from('artists').delete().eq('id', id);
    if (error) { showToast('Устгахад алдаа: ' + error.message, 'err'); return; }
    showToast('Артист устгагдлаа', 'ok');
    setDelId(null);
    load();
  };

  /* ── toggle active ── */
  const toggleActive = async (id, val) => {
    await supabase.from('artists').update({ active: val }).eq('id', id);
    setArtists(as => as.map(a => a.id === id ? { ...a, active: val } : a));
  };

  /* ── file upload ── */
  const handleFile = async (file) => {
    if (!file?.type.startsWith('image/')) return;
    setUploading(true);
    const fname = `artist-${Date.now()}.${file.name.split('.').pop()}`;
    const { error: upErr } = await supabase.storage.from('hero-images').upload(fname, file, { upsert: true });
    if (upErr) { showToast('Зураг байршуулахад алдаа: ' + upErr.message, 'err'); setUploading(false); return; }
    const { data } = supabase.storage.from('hero-images').getPublicUrl(fname);
    setF('image_url', data.publicUrl);
    setUploading(false);
    showToast('Зураг байршлаа ✓', 'ok');
  };
  const handleInputFile = (e) => { handleFile(e.target.files?.[0]); e.target.value = ''; };
  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]); };

  /* ── shared styles ── */
  const inp = { width: '100%', padding: '9px 13px', borderRadius: 10, border: '1.5px solid var(--gray-200)', fontSize: 13, fontFamily: 'Inter,sans-serif', outline: 'none', color: 'var(--dark)', background: '#fff' };

  const Toggle = ({ value, onChange, label }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => onChange(!value)}>
      <div style={{ width: 40, height: 22, borderRadius: 11, background: value ? 'var(--pink)' : 'var(--gray-200)', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 2, left: value ? 19 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'left .2s' }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: value ? 'var(--dark)' : 'var(--gray-500)' }}>{label}</span>
    </div>
  );

  const AvatarPreview = ({ a, size = 56 }) => (
    <div style={{ width: size, height: size, borderRadius: '50%', border: '2px solid var(--pink-light)', background: 'linear-gradient(135deg,#FFD6E8,#FFBCD9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.44, overflow: 'hidden', flexShrink: 0 }}>
      {a.image_url
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={a.image_url} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : (a.avatar_emoji || '👩')}
    </div>
  );

  /* ── service tag strip for list view ── */
  const ServiceTags = ({ artistId }) => {
    const ids = artistServiceMap[artistId] || [];
    if (ids.length === 0) return (
      <span style={{ fontSize: 10, color: 'var(--gray-500)', background: 'var(--gray-100)', padding: '2px 8px', borderRadius: 50, fontWeight: 600 }}>
        Бүх үйлчилгээ
      </span>
    );
    return (
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {allServices.filter(s => ids.includes(s.id)).map(s => (
          <span key={s.id} style={{ fontSize: 10, color: 'var(--pink-dark)', background: 'var(--pink-light)', padding: '2px 8px', borderRadius: 50, fontWeight: 600 }}>
            {s.emoji} {s.name_mn}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── top bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>
          Нийт <strong>{artists.length}</strong> артист ·{' '}
          <strong style={{ color: 'var(--green)' }}>{artists.filter(a => a.active).length}</strong> ажиллана
        </div>
        <button className="btn-primary" onClick={openAdd} style={{ fontSize: 13, padding: '10px 22px' }}>
          + Артист нэмэх
        </button>
      </div>

      {/* ── list ── */}
      <div className="card" style={{ padding: loading ? 40 : 16 }}>
        {loading && <div style={{ textAlign: 'center', color: 'var(--gray-500)', fontSize: 14 }}>Ачааллаж байна...</div>}

        {!loading && artists.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--gray-500)', padding: '32px 20px' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>👩‍🎨</div>
            <div style={{ fontSize: 14 }}>Артист байхгүй байна</div>
            <button className="btn-primary" onClick={openAdd} style={{ marginTop: 16, fontSize: 13, padding: '10px 22px' }}>+ Нэмэх</button>
          </div>
        )}

        {!loading && artists.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {artists.map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 14, border: '1.5px solid var(--gray-200)', background: a.active ? '#fff' : 'var(--gray-100)', opacity: a.active ? 1 : .7, transition: 'all .2s', flexWrap: 'wrap' }}>

                <AvatarPreview a={a} size={52} />

                <div style={{ flex: 1, minWidth: 140 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', marginBottom: 2 }}>{a.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 4 }}>{a.specialty_mn}</div>
                  <ServiceTags artistId={a.id} />
                </div>

                <div style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 600, flexShrink: 0 }}>
                  ⭐ {Number(a.rating).toFixed(1)} · {a.review_count} сэтгэгдэл
                </div>

                <Toggle value={a.active} onChange={v => toggleActive(a.id, v)} label={a.active ? 'Ажиллана' : 'Ажиллахгүй'} />

                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => openEdit(a)} style={{ padding: '7px 14px', borderRadius: 8, border: '1.5px solid var(--gray-200)', background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: 'var(--dark)', whiteSpace: 'nowrap' }}>✏️ Засах</button>
                  <button onClick={() => setDelId(a.id)} style={{ padding: '7px 10px', borderRadius: 8, border: '1.5px solid #fecaca', background: '#fff5f5', fontSize: 12, cursor: 'pointer', color: 'var(--red)' }}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Delete confirm ── */}
      {delId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 32, maxWidth: 340, width: '100%', textAlign: 'center', boxShadow: '0 24px 80px rgba(0,0,0,.18)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Артист устгах уу?</div>
            <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 24 }}>Энэ үйлдлийг буцаах боломжгүй.</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-outline" onClick={() => setDelId(null)} style={{ flex: 1, fontSize: 13, padding: '10px 0' }}>Цуцлах</button>
              <button onClick={() => remove(delId)} style={{ flex: 1, padding: '10px 0', borderRadius: 50, border: 'none', background: 'var(--red)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Устгах</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════
          ADD / EDIT FORM
      ══════════════════════════ */}
      {form && (
        <div className="card" style={{ border: '2px solid var(--pink-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)' }}>
              {form.id ? '✏️ Артист засах' : '➕ Шинэ артист'}
            </h3>
            <button onClick={() => { setForm(null); setSelServices([]); setSchedule([...DEFAULT_SCHEDULE]); }} style={{ background: 'var(--gray-100)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: 'var(--gray-500)' }}>✕</button>
          </div>

          {/* ── Basic fields ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14, marginBottom: 16 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: .8 }}>Нэр *</label>
              <input type="text" value={form.name} onChange={e => setF('name', e.target.value)} placeholder="Артистийн нэр" style={inp} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: .8 }}>Мэргэжил / Чиглэл</label>
              <input type="text" value={form.specialty_mn} onChange={e => setF('specialty_mn', e.target.value)} placeholder="жишээ: Lash мэргэжилтэн" style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: .8 }}>Үнэлгээ (0–5)</label>
              <input type="number" value={form.rating} onChange={e => setF('rating', e.target.value)} placeholder="5.0" min="0" max="5" step="0.1" style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: .8 }}>Сэтгэгдлийн тоо</label>
              <input type="number" value={form.review_count} onChange={e => setF('review_count', e.target.value)} placeholder="0" min="0" style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: .8 }}>Emoji</label>
              <input type="text" value={form.avatar_emoji} onChange={e => setF('avatar_emoji', e.target.value)} placeholder="👩" style={{ ...inp, fontSize: 20 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
              <Toggle value={form.active} onChange={v => setF('active', v)} label="Нүүр хуудаст харагдах" />
            </div>
          </div>

          {/* ── Services selection ── */}
          {allServices.length > 0 && (
            <div style={{ borderTop: '1.5px solid var(--gray-200)', paddingTop: 16, marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: .8 }}>
                🧴 Үзүүлж болох үйлчилгээнүүд
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {allServices.map(s => {
                  const on = selServices.includes(s.id);
                  return (
                    <button key={s.id} type="button"
                      onClick={() => setSelServices(prev => on ? prev.filter(id => id !== s.id) : [...prev, s.id])}
                      style={{
                        padding: '8px 16px', borderRadius: 50, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        border: '2px solid', transition: 'all .15s',
                        borderColor: on ? 'var(--pink)' : 'var(--gray-200)',
                        background:  on ? 'var(--pink-light)' : '#fff',
                        color:       on ? 'var(--pink-dark)' : 'var(--gray-500)',
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}>
                      <span>{s.emoji}</span> {s.name_mn}
                    </button>
                  );
                })}
              </div>
              <div style={{ fontSize: 11, marginTop: 8, fontWeight: 600,
                color: selServices.length > 0 ? 'var(--pink-dark)' : 'var(--gray-500)' }}>
                {selServices.length > 0
                  ? `✓ ${selServices.length} үйлчилгээ сонгогдлоо — зөвхөн эдгээрт харагдана`
                  : '💡 Сонгоогүй бол энэ артист бүх үйлчилгээнд харагдана'}
              </div>
            </div>
          )}

          {/* ── Payment methods ── */}
          <div style={{ borderTop: '1.5px solid var(--gray-200)', paddingTop: 16, marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: .8 }}>
              💳 Төлбөрийн арга
            </label>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <Toggle value={form.pay_qpay !== false} onChange={v => setF('pay_qpay', v)} label="📱 QPay-ээр" />
              <Toggle value={form.pay_cash === true}  onChange={v => setF('pay_cash', v)}  label="💵 Бэлнээр" />
            </div>
            {!form.pay_qpay && !form.pay_cash && (
              <div style={{ fontSize: 11, marginTop: 8, fontWeight: 600, color: 'var(--red)' }}>
                ⚠️ Дор хаяж нэг арга идэвхтэй байх ёстой (үгүй бол QPay автоматаар ашиглагдана)
              </div>
            )}
          </div>

          {/* ── Weekly schedule ── */}
          <div style={{ borderTop: '1.5px solid var(--gray-200)', paddingTop: 16, marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', display: 'block', marginBottom: 12, textTransform: 'uppercase', letterSpacing: .8 }}>
              📅 Ажиллах цагийн хуваарь
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {schedule.map((d, i) => (
                <div key={d.day} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12, background: d.active ? '#fff' : 'var(--gray-100)', border: `1.5px solid ${d.active ? 'var(--gray-200)' : 'var(--gray-100)'}`, flexWrap: 'wrap', transition: 'all .2s' }}>
                  {/* Day name */}
                  <div style={{ width: 70, fontSize: 13, fontWeight: 700, color: d.active ? 'var(--dark)' : 'var(--gray-500)', flexShrink: 0 }}>
                    {d.label}
                  </div>
                  {/* Toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => setSchedule(prev => prev.map((s, j) => j === i ? { ...s, active: !s.active } : s))}>
                    <div style={{ width: 36, height: 20, borderRadius: 10, background: d.active ? 'var(--pink)' : 'var(--gray-200)', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
                      <div style={{ position: 'absolute', top: 2, left: d.active ? 17 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'left .2s' }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: d.active ? 'var(--pink-dark)' : 'var(--gray-500)', minWidth: 50 }}>{d.active ? 'Ажиллана' : 'Амарна'}</span>
                  </div>
                  {/* Time inputs */}
                  {d.active && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <TimeSelect value={d.start}
                        onChange={v => setSchedule(prev => prev.map((s, j) => j === i ? { ...s, start: v } : s))}
                        style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid var(--gray-200)', fontSize: 13, outline: 'none', fontFamily: 'Inter,sans-serif', background: '#fff', color: 'var(--dark)', cursor: 'pointer' }} />
                      <span style={{ color: 'var(--gray-500)', fontSize: 13, fontWeight: 600 }}>—</span>
                      <TimeSelect value={d.end}
                        onChange={v => setSchedule(prev => prev.map((s, j) => j === i ? { ...s, end: v } : s))}
                        style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid var(--gray-200)', fontSize: 13, outline: 'none', fontFamily: 'Inter,sans-serif', background: '#fff', color: 'var(--dark)', cursor: 'pointer' }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Photo ── */}
          <div style={{ borderTop: '1.5px solid var(--gray-200)', paddingTop: 16, marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: .8 }}>📷 Зураг (заавал биш)</label>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div style={{ flexShrink: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: .8 }}>Preview</div>
                <div style={{ width: 80, height: 80, borderRadius: '50%', border: '3px solid var(--pink-light)', background: 'linear-gradient(135deg,#FFD6E8,#FFBCD9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, overflow: 'hidden' }}>
                  {form.image_url
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={form.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : (form.avatar_emoji || '👩')}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input type="url" value={form.image_url} onChange={e => setF('image_url', e.target.value)} placeholder="https://example.com/photo.jpg" style={{ ...inp, flex: 1 }} />
                  {form.image_url && <button onClick={() => setF('image_url', '')} style={{ padding: '9px 10px', borderRadius: 10, border: '1.5px solid var(--gray-200)', background: '#fff', cursor: 'pointer', color: 'var(--gray-500)' }}>✕</button>}
                </div>
                <div
                  onClick={() => !uploading && fileRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  style={{ border: `2px dashed ${dragOver ? 'var(--pink)' : 'var(--gray-200)'}`, borderRadius: 10, padding: '14px', textAlign: 'center', cursor: uploading ? 'not-allowed' : 'pointer', background: dragOver ? 'var(--pink-light)' : '#fff', transition: 'all .2s' }}>
                  <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>{uploading ? '⏳ Байршуулж байна...' : '📁 Зураг сонгох / чирж тавих'}</span>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleInputFile} />
                </div>
              </div>
            </div>
          </div>

          {/* ── Actions ── */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn-outline" onClick={() => { setForm(null); setSelServices([]); }} style={{ fontSize: 13, padding: '9px 20px' }}>Цуцлах</button>
            <button className="btn-primary" onClick={save} disabled={saving} style={{ fontSize: 13, padding: '10px 28px' }}>
              {saving ? 'Хадгалж байна...' : form.id ? 'Шинэчлэх' : 'Нэмэх'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
