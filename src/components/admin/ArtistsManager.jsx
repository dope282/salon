'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

const EMPTY = {
  name: '', specialty_mn: '', rating: '5.0',
  review_count: '0', avatar_emoji: '👩', image_url: '', active: true,
};

export default function ArtistsManager({ showToast }) {
  const [artists,   setArtists]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [form,      setForm]      = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver,  setDragOver]  = useState(false);
  const [delId,     setDelId]     = useState(null);
  const fileRef = useRef(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('artists').select('*').order('id');
    setArtists(data || []);
    setLoading(false);
  };

  const setF   = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const openAdd  = () => { setForm({ ...EMPTY }); setTimeout(() => window.scrollTo({ top: 99999, behavior:'smooth' }), 50); };
  const openEdit = (a) => { setForm({ ...a, rating: String(a.rating), review_count: String(a.review_count) }); setTimeout(() => window.scrollTo({ top: 99999, behavior:'smooth' }), 50); };

  /* ── save ── */
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
    };
    let error;
    if (form.id) {
      ({ error } = await supabase.from('artists').update(payload).eq('id', form.id));
    } else {
      ({ error } = await supabase.from('artists').insert(payload));
    }
    setSaving(false);
    if (error) { showToast('Алдаа: ' + error.message, 'err'); return; }
    showToast(form.id ? 'Уран бүтээлч шинэчлэгдлээ ✓' : 'Уран бүтээлч нэмэгдлээ ✓', 'ok');
    setForm(null);
    load();
  };

  /* ── delete ── */
  const remove = async (id) => {
    const { error } = await supabase.from('artists').delete().eq('id', id);
    if (error) { showToast('Устгахад алдаа: ' + error.message, 'err'); return; }
    showToast('Уран бүтээлч устгагдлаа', 'ok');
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
  const inp = { width:'100%', padding:'9px 13px', borderRadius:10, border:'1.5px solid var(--gray-200)', fontSize:13, fontFamily:'Inter,sans-serif', outline:'none', color:'var(--dark)', background:'#fff' };
  const Toggle = ({ value, onChange, label }) => (
    <div style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }} onClick={() => onChange(!value)}>
      <div style={{ width:40, height:22, borderRadius:11, background:value?'var(--pink)':'var(--gray-200)', position:'relative', transition:'background .2s', flexShrink:0 }}>
        <div style={{ position:'absolute', top:2, left:value?19:2, width:18, height:18, borderRadius:'50%', background:'#fff', boxShadow:'0 1px 3px rgba(0,0,0,.2)', transition:'left .2s' }} />
      </div>
      <span style={{ fontSize:13, fontWeight:600, color:value?'var(--dark)':'var(--gray-500)' }}>{label}</span>
    </div>
  );

  /* ── avatar preview ── */
  const AvatarPreview = ({ a, size = 56 }) => (
    <div style={{ width:size, height:size, borderRadius:'50%', border:'2px solid var(--pink-light)', background:'linear-gradient(135deg,#FFD6E8,#FFBCD9)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*0.44, overflow:'hidden', flexShrink:0 }}>
      {a.image_url
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={a.image_url} alt={a.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        : (a.avatar_emoji || a.image_url || '👩')}
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

      {/* ── top bar ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div style={{ fontSize:13, color:'var(--gray-500)' }}>
          Нийт <strong>{artists.length}</strong> уран бүтээлч ·{' '}
          <strong style={{ color:'var(--green)' }}>{artists.filter(a=>a.active).length}</strong> идэвхтэй
        </div>
        <button className="btn-primary" onClick={openAdd} style={{ fontSize:13, padding:'10px 22px' }}>
          + Уран бүтээлч нэмэх
        </button>
      </div>

      {/* ── list ── */}
      <div className="card" style={{ padding: loading ? 40 : 16 }}>
        {loading && <div style={{ textAlign:'center', color:'var(--gray-500)', fontSize:14 }}>Ачааллаж байна...</div>}

        {!loading && artists.length === 0 && (
          <div style={{ textAlign:'center', color:'var(--gray-500)', padding:'32px 20px' }}>
            <div style={{ fontSize:40, marginBottom:10 }}>👩‍🎨</div>
            <div style={{ fontSize:14 }}>Уран бүтээлч байхгүй байна</div>
            <button className="btn-primary" onClick={openAdd} style={{ marginTop:16, fontSize:13, padding:'10px 22px' }}>+ Нэмэх</button>
          </div>
        )}

        {!loading && artists.length > 0 && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {artists.map(a => (
              <div key={a.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 14px', borderRadius:14, border:'1.5px solid var(--gray-200)', background:a.active?'#fff':'var(--gray-100)', opacity:a.active?1:.7, transition:'all .2s', flexWrap:'wrap' }}>

                {/* Avatar */}
                <AvatarPreview a={a} size={52} />

                {/* Info */}
                <div style={{ flex:1, minWidth:140 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:'var(--dark)', marginBottom:2 }}>{a.name}</div>
                  <div style={{ fontSize:12, color:'var(--gray-500)', marginBottom:2 }}>{a.specialty_mn}</div>
                  <div style={{ fontSize:12, color:'var(--gold)', fontWeight:600 }}>⭐ {Number(a.rating).toFixed(1)} · {a.review_count} сэтгэгдэл</div>
                </div>

                {/* Active toggle */}
                <Toggle value={a.active} onChange={v => toggleActive(a.id, v)} label={a.active ? 'Идэвхтэй' : 'Нуугдсан'} />

                {/* Actions */}
                <div style={{ display:'flex', gap:6 }}>
                  <button onClick={() => openEdit(a)} style={{ padding:'7px 14px', borderRadius:8, border:'1.5px solid var(--gray-200)', background:'#fff', fontSize:12, fontWeight:600, cursor:'pointer', color:'var(--dark)', whiteSpace:'nowrap' }}>✏️ Засах</button>
                  <button onClick={() => setDelId(a.id)} style={{ padding:'7px 10px', borderRadius:8, border:'1.5px solid #fecaca', background:'#fff5f5', fontSize:12, cursor:'pointer', color:'var(--red)' }}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Delete confirm ── */}
      {delId && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'#fff', borderRadius:20, padding:32, maxWidth:340, width:'100%', textAlign:'center', boxShadow:'0 24px 80px rgba(0,0,0,.18)' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🗑️</div>
            <div style={{ fontSize:16, fontWeight:700, marginBottom:8 }}>Уран бүтээлч устгах уу?</div>
            <div style={{ fontSize:13, color:'var(--gray-500)', marginBottom:24 }}>Энэ үйлдлийг буцаах боломжгүй.</div>
            <div style={{ display:'flex', gap:10 }}>
              <button className="btn-outline" onClick={() => setDelId(null)} style={{ flex:1, fontSize:13, padding:'10px 0' }}>Цуцлах</button>
              <button onClick={() => remove(delId)} style={{ flex:1, padding:'10px 0', borderRadius:50, border:'none', background:'var(--red)', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>Устгах</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════
          ADD / EDIT FORM
      ══════════════════════════ */}
      {form && (
        <div className="card" style={{ border:'2px solid var(--pink-light)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
            <h3 style={{ fontSize:16, fontWeight:700, color:'var(--dark)' }}>
              {form.id ? '✏️ Уран бүтээлч засах' : '➕ Шинэ уран бүтээлч'}
            </h3>
            <button onClick={() => setForm(null)} style={{ background:'var(--gray-100)', border:'none', borderRadius:'50%', width:32, height:32, cursor:'pointer', fontSize:16, color:'var(--gray-500)' }}>✕</button>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:14, marginBottom:16 }}>
            {/* Name */}
            <div style={{ gridColumn:'1 / -1' }}>
              <label style={{ fontSize:12, fontWeight:600, color:'var(--gray-500)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:.8 }}>Нэр *</label>
              <input type="text" value={form.name} onChange={e=>setF('name',e.target.value)} placeholder="Уран бүтээлчийн нэр" style={inp} />
            </div>

            {/* Specialty */}
            <div style={{ gridColumn:'1 / -1' }}>
              <label style={{ fontSize:12, fontWeight:600, color:'var(--gray-500)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:.8 }}>Мэргэжил / Чиглэл</label>
              <input type="text" value={form.specialty_mn} onChange={e=>setF('specialty_mn',e.target.value)} placeholder="жишээ: Lash мэргэжилтэн" style={inp} />
            </div>

            {/* Rating */}
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'var(--gray-500)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:.8 }}>Үнэлгээ (0–5)</label>
              <input type="number" value={form.rating} onChange={e=>setF('rating',e.target.value)} placeholder="5.0" min="0" max="5" step="0.1" style={inp} />
            </div>

            {/* Review count */}
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'var(--gray-500)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:.8 }}>Сэтгэгдлийн тоо</label>
              <input type="number" value={form.review_count} onChange={e=>setF('review_count',e.target.value)} placeholder="0" min="0" style={inp} />
            </div>

            {/* Emoji */}
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'var(--gray-500)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:.8 }}>Emoji (зураг байхгүй үед)</label>
              <input type="text" value={form.avatar_emoji} onChange={e=>setF('avatar_emoji',e.target.value)} placeholder="👩" style={{ ...inp, fontSize:20 }} />
            </div>

            {/* Active toggle */}
            <div style={{ display:'flex', alignItems:'flex-end', paddingBottom:4 }}>
              <Toggle value={form.active} onChange={v=>setF('active',v)} label="Нүүр хуудаст харагдах" />
            </div>
          </div>

          {/* ── Photo section ── */}
          <div style={{ borderTop:'1.5px solid var(--gray-200)', paddingTop:16, marginBottom:20 }}>
            <label style={{ fontSize:12, fontWeight:600, color:'var(--gray-500)', display:'block', marginBottom:10, textTransform:'uppercase', letterSpacing:.8 }}>📷 Зураг (заавал биш)</label>
            <div style={{ display:'flex', gap:14, flexWrap:'wrap', alignItems:'flex-start' }}>

              {/* Preview */}
              <div style={{ flexShrink:0 }}>
                <div style={{ fontSize:11, fontWeight:600, color:'var(--gray-500)', marginBottom:6, textTransform:'uppercase', letterSpacing:.8 }}>Preview</div>
                <div style={{ width:80, height:80, borderRadius:'50%', border:'3px solid var(--pink-light)', background:'linear-gradient(135deg,#FFD6E8,#FFBCD9)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:34, overflow:'hidden' }}>
                  {form.image_url
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={form.image_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : (form.avatar_emoji || '👩')}
                </div>
              </div>

              <div style={{ flex:1, minWidth:180 }}>
                {/* URL input */}
                <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                  <input type="url" value={form.image_url} onChange={e=>setF('image_url',e.target.value)} placeholder="https://example.com/photo.jpg" style={{ ...inp, flex:1 }} />
                  {form.image_url && <button onClick={()=>setF('image_url','')} style={{ padding:'9px 10px', borderRadius:10, border:'1.5px solid var(--gray-200)', background:'#fff', cursor:'pointer', color:'var(--gray-500)' }}>✕</button>}
                </div>
                {/* Drop zone */}
                <div
                  onClick={()=>!uploading&&fileRef.current?.click()}
                  onDragOver={e=>{e.preventDefault();setDragOver(true)}}
                  onDragLeave={()=>setDragOver(false)}
                  onDrop={handleDrop}
                  style={{ border:`2px dashed ${dragOver?'var(--pink)':'var(--gray-200)'}`, borderRadius:10, padding:'14px', textAlign:'center', cursor:uploading?'not-allowed':'pointer', background:dragOver?'var(--pink-light)':'#fff', transition:'all .2s' }}
                >
                  <span style={{ fontSize:13, color:'var(--gray-500)' }}>{uploading?'⏳ Байршуулж байна...':'📁 Зураг сонгох / чирж тавих'}</span>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleInputFile} />
                </div>
              </div>
            </div>
          </div>

          {/* ── Actions ── */}
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button className="btn-outline" onClick={()=>setForm(null)} style={{ fontSize:13, padding:'9px 20px' }}>Цуцлах</button>
            <button className="btn-primary" onClick={save} disabled={saving} style={{ fontSize:13, padding:'10px 28px' }}>
              {saving ? 'Хадгалж байна...' : form.id ? 'Шинэчлэх' : 'Нэмэх'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
