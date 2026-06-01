'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import MultiImageUploader from '@/components/admin/MultiImageUploader';

const EMPTY = { title:'', description:'', image_url:'', images:[], price:'', duration:'', level:'', schedule:'', active:true, sort_order:'0' };

export default function TrainingsManager({ showToast }) {
  const [list,      setList]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [form,      setForm]      = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [delId,     setDelId]     = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('trainings').select('*').order('sort_order').order('id');
    setList(data || []);
    setLoading(false);
  };

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const scroll = () => setTimeout(() => { const el = document.getElementById('adminMain'); (el || window).scrollTo({ top:99999, behavior:'smooth' }); }, 50);
  const openAdd  = () => { setForm({ ...EMPTY }); scroll(); };
  const openEdit = (t) => { setForm({ ...t, price: String(t.price), sort_order: String(t.sort_order), images: t.images?.length ? t.images : (t.image_url ? [t.image_url] : []) }); scroll(); };

  const save = async () => {
    if (!form.title.trim()) { showToast('Гарчиг оруулна уу', 'err'); return; }
    setSaving(true);
    const imgs = form.images || [];
    const payload = {
      title: form.title.trim(), description: form.description.trim(),
      images: imgs, image_url: imgs[0] || '', price: parseInt(form.price) || 0,
      duration: form.duration.trim(), level: form.level.trim(),
      schedule: form.schedule.trim(), active: form.active,
      sort_order: parseInt(form.sort_order) || 0,
    };
    let error;
    if (form.id) ({ error } = await supabase.from('trainings').update(payload).eq('id', form.id));
    else         ({ error } = await supabase.from('trainings').insert(payload));
    setSaving(false);
    if (error) { showToast('Алдаа: ' + error.message, 'err'); return; }
    showToast(form.id ? 'Сургалт шинэчлэгдлээ ✓' : 'Сургалт нэмэгдлээ ✓', 'ok');
    setForm(null); load();
  };

  const remove = async (id) => {
    const { error } = await supabase.from('trainings').delete().eq('id', id);
    if (error) { showToast('Устгахад алдаа: ' + error.message, 'err'); return; }
    showToast('Сургалт устгагдлаа', 'ok'); setDelId(null); load();
  };

  const toggleActive = async (id, val) => {
    await supabase.from('trainings').update({ active: val }).eq('id', id);
    setList(l => l.map(t => t.id === id ? { ...t, active: val } : t));
  };

  const inp = { width:'100%', padding:'9px 12px', borderRadius:10, border:'1.5px solid var(--gray-200)', fontSize:13, fontFamily:'Inter,sans-serif', outline:'none', color:'var(--dark)', background:'#fff', boxSizing:'border-box' };

  const Toggle = ({ value, onChange, label }) => (
    <div style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }} onClick={() => onChange(!value)}>
      <div style={{ width:40, height:22, borderRadius:11, background: value ? 'var(--gold)' : 'var(--gray-200)', position:'relative', transition:'background .2s', flexShrink:0 }}>
        <div style={{ position:'absolute', top:2, left: value ? 19 : 2, width:18, height:18, borderRadius:'50%', background:'#fff', boxShadow:'0 1px 3px rgba(0,0,0,.2)', transition:'left .2s' }} />
      </div>
      <span style={{ fontSize:13, fontWeight:600, color: value ? 'var(--dark)' : 'var(--gray-500)' }}>{label}</span>
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

      {/* Top bar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div style={{ fontSize:13, color:'var(--gray-500)' }}>
          Нийт <strong>{list.length}</strong> сургалт ·{' '}
          <strong style={{ color:'var(--green)' }}>{list.filter(t => t.active).length}</strong> идэвхтэй
        </div>
        <button className="btn-primary" onClick={openAdd} style={{ fontSize:13, padding:'10px 22px' }}>
          + Сургалт нэмэх
        </button>
      </div>

      {/* List */}
      <div className="card" style={{ padding: loading ? 40 : 16 }}>
        {loading && <div style={{ textAlign:'center', color:'var(--gray-500)', fontSize:14 }}>Ачааллаж байна...</div>}
        {!loading && list.length === 0 && (
          <div style={{ textAlign:'center', color:'var(--gray-500)', padding:'32px 20px' }}>
            <div style={{ fontSize:40, marginBottom:10 }}>🎓</div>
            <div style={{ fontSize:14 }}>Сургалт байхгүй байна</div>
            <button className="btn-primary" onClick={openAdd} style={{ marginTop:16, fontSize:13, padding:'10px 22px' }}>+ Нэмэх</button>
          </div>
        )}
        {!loading && list.length > 0 && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {list.map(t => (
              <div key={t.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 14px', borderRadius:14, border:'1.5px solid var(--gray-200)', background: t.active ? '#fff' : 'var(--gray-100)', opacity: t.active ? 1 : .7, transition:'all .2s', flexWrap:'wrap' }}>
                {/* Зураг */}
                <div style={{ width:60, height:60, borderRadius:12, overflow:'hidden', background:'linear-gradient(135deg,#F5E6C8,#FDE8F0)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, flexShrink:0 }}>
                  {(t.images?.[0] || t.image_url)
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={t.images?.[0] || t.image_url} alt={t.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : '🎓'}
                </div>
                {/* Мэдээлэл */}
                <div style={{ flex:1, minWidth:160 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:'var(--dark)', marginBottom:3 }}>{t.title}</div>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {t.price > 0 && <span style={{ fontSize:12, fontWeight:700, color:'var(--gold-dark)' }}>₮{t.price.toLocaleString()}</span>}
                    {t.duration && <span style={{ fontSize:11, color:'var(--gray-500)' }}>⏱ {t.duration}</span>}
                    {t.level    && <span style={{ fontSize:11, color:'var(--gray-500)' }}>📊 {t.level}</span>}
                  </div>
                </div>
                <Toggle value={t.active} onChange={v => toggleActive(t.id, v)} label={t.active ? 'Идэвхтэй' : 'Нуугдсан'} />
                <div style={{ display:'flex', gap:6 }}>
                  <button onClick={() => openEdit(t)} style={{ padding:'7px 14px', borderRadius:8, border:'1.5px solid var(--gray-200)', background:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}>✏️ Засах</button>
                  <button onClick={() => setDelId(t.id)} style={{ padding:'7px 10px', borderRadius:8, border:'1.5px solid #fecaca', background:'#fff5f5', fontSize:12, cursor:'pointer', color:'var(--red)' }}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirm */}
      {delId && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'#fff', borderRadius:20, padding:32, maxWidth:340, width:'100%', textAlign:'center' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🗑️</div>
            <div style={{ fontSize:16, fontWeight:700, marginBottom:8 }}>Сургалт устгах уу?</div>
            <div style={{ fontSize:13, color:'var(--gray-500)', marginBottom:24 }}>Энэ үйлдлийг буцаах боломжгүй.</div>
            <div style={{ display:'flex', gap:10 }}>
              <button className="btn-outline" onClick={() => setDelId(null)} style={{ flex:1, fontSize:13, padding:'10px 0' }}>Цуцлах</button>
              <button onClick={() => remove(delId)} style={{ flex:1, padding:'10px 0', borderRadius:50, border:'none', background:'var(--red)', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>Устгах</button>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      {form && (
        <div className="card" style={{ border:'2px solid var(--pink-light)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
            <h3 style={{ fontSize:16, fontWeight:700 }}>{form.id ? '✏️ Сургалт засах' : '➕ Шинэ сургалт'}</h3>
            <button onClick={() => setForm(null)} style={{ background:'var(--gray-100)', border:'none', borderRadius:'50%', width:32, height:32, cursor:'pointer', fontSize:16, color:'var(--gray-500)' }}>✕</button>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:14, marginBottom:16 }}>
            <div style={{ gridColumn:'1 / -1' }}>
              <label style={{ fontSize:12, fontWeight:600, color:'var(--gray-500)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:.8 }}>Гарчиг *</label>
              <input type="text" value={form.title} onChange={e => setF('title', e.target.value)} placeholder="Lash Extension сургалт" style={inp} />
            </div>
            <div style={{ gridColumn:'1 / -1' }}>
              <label style={{ fontSize:12, fontWeight:600, color:'var(--gray-500)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:.8 }}>Дэлгэрэнгүй мэдээлэл</label>
              <textarea value={form.description} onChange={e => setF('description', e.target.value)} rows={4} placeholder="Сургалтын агуулга, дэлгэрэнгүй мэдээлэл..." style={{ ...inp, resize:'vertical', lineHeight:1.6 }} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'var(--gray-500)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:.8 }}>Үнэ (₮)</label>
              <input type="number" value={form.price} onChange={e => setF('price', e.target.value)} placeholder="0" min="0" style={inp} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'var(--gray-500)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:.8 }}>Үргэлжлэх хугацаа</label>
              <input type="text" value={form.duration} onChange={e => setF('duration', e.target.value)} placeholder="3 өдөр, 2 цаг..." style={inp} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'var(--gray-500)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:.8 }}>Түвшин</label>
              <input type="text" value={form.level} onChange={e => setF('level', e.target.value)} placeholder="Эхлэгч, Дунд, Дэвшилтэт" style={inp} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'var(--gray-500)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:.8 }}>Хуваарь</label>
              <input type="text" value={form.schedule} onChange={e => setF('schedule', e.target.value)} placeholder="Бямба, Ням / Долоо хоног бүр" style={inp} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'var(--gray-500)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:.8 }}>Дараалал</label>
              <input type="number" value={form.sort_order} onChange={e => setF('sort_order', e.target.value)} placeholder="0" style={inp} />
            </div>
            <div style={{ display:'flex', alignItems:'flex-end', paddingBottom:4 }}>
              <Toggle value={form.active} onChange={v => setF('active', v)} label="Нүүр хуудаст харагдах" />
            </div>
          </div>

          {/* Зурагнууд */}
          <div style={{ borderTop:'1.5px solid var(--gray-200)', paddingTop:16, marginBottom:20 }}>
            <MultiImageUploader images={form.images} onChange={imgs => setF('images', imgs)} prefix="training" showToast={showToast} fallbackEmoji="🎓" />
          </div>

          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button className="btn-outline" onClick={() => setForm(null)} style={{ fontSize:13, padding:'9px 20px' }}>Цуцлах</button>
            <button className="btn-primary" onClick={save} disabled={saving} style={{ fontSize:13, padding:'10px 28px' }}>
              {saving ? 'Хадгалж байна...' : form.id ? 'Шинэчлэх' : 'Нэмэх'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
