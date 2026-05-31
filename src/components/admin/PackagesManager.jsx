'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

const EMPTY = {
  name: '', description: '', price: '', original_price: '',
  emoji: '🎁', image_url: '', duration_min: '120', active: true, sort_order: '0',
};
const EMOJI_OPT = ['🎁','💆','💅','✨','👁️','💄','🌸','💇','🧖','🎀','💎','🌟'];

export default function PackagesManager({ showToast }) {
  const [packages,    setPackages]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [form,        setForm]        = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [uploading,   setUploading]   = useState(false);
  const [delId,       setDelId]       = useState(null);
  const [allServices, setAllServices] = useState([]);
  const [allArtists,  setAllArtists]  = useState([]);
  const [selServices, setSelServices] = useState([]); // included service IDs
  const [selArtists,  setSelArtists]  = useState([]); // artist IDs who can deliver
  const [pkgSvcMap,   setPkgSvcMap]   = useState({}); // { pkgId: svcId[] }
  const [pkgArtMap,   setPkgArtMap]   = useState({}); // { pkgId: artId[] }
  const fileRef = useRef(null);

  useEffect(() => {
    load();
    Promise.all([
      supabase.from('services').select('id, name_mn, emoji').eq('active', true).order('id'),
      supabase.from('artists').select('id, name, avatar_emoji, image_url').eq('active', true).order('id'),
    ]).then(([{ data: sData }, { data: aData }]) => {
      setAllServices(sData || []);
      setAllArtists(aData || []);
    });
  }, []);

  const load = async () => {
    setLoading(true);
    const [{ data: pkgData }, { data: psLinks }, { data: apLinks }] = await Promise.all([
      supabase.from('packages').select('*').order('sort_order').order('id'),
      supabase.from('package_services').select('package_id, service_id'),
      supabase.from('artist_packages').select('package_id, artist_id'),
    ]);
    const svcMap = {}, artMap = {};
    (psLinks || []).forEach(r => { if (!svcMap[r.package_id]) svcMap[r.package_id] = []; svcMap[r.package_id].push(r.service_id); });
    (apLinks || []).forEach(r => { if (!artMap[r.package_id]) artMap[r.package_id] = []; artMap[r.package_id].push(r.artist_id); });
    setPkgSvcMap(svcMap);
    setPkgArtMap(artMap);
    setPackages(pkgData || []);
    setLoading(false);
  };

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const scrollToForm = () => setTimeout(() => { const el = document.getElementById('adminMain'); (el || window).scrollTo({ top: 99999, behavior: 'smooth' }); }, 50);

  const openAdd = () => { setForm({ ...EMPTY }); setSelServices([]); setSelArtists([]); scrollToForm(); };
  const openEdit = (p) => {
    setForm({ ...p, price: String(p.price), original_price: String(p.original_price || ''), duration_min: String(p.duration_min), sort_order: String(p.sort_order) });
    setSelServices(pkgSvcMap[p.id] || []);
    setSelArtists(pkgArtMap[p.id] || []);
    scrollToForm();
  };

  const save = async () => {
    if (!form.name.trim()) { showToast('Багцын нэр оруулна уу', 'err'); return; }
    if (!form.price || isNaN(parseInt(form.price))) { showToast('Үнэ оруулна уу', 'err'); return; }
    setSaving(true);
    const payload = {
      name: form.name.trim(), description: form.description.trim(),
      price: parseInt(form.price) || 0, original_price: parseInt(form.original_price) || 0,
      emoji: form.emoji || '🎁', image_url: form.image_url.trim(),
      duration_min: parseInt(form.duration_min) || 120,
      active: form.active, sort_order: parseInt(form.sort_order) || 0,
    };

    let error, pkgId = form.id;
    if (form.id) {
      ({ error } = await supabase.from('packages').update(payload).eq('id', form.id));
    } else {
      const { data: newP, error: ie } = await supabase.from('packages').insert(payload).select('id').single();
      error = ie; if (newP) pkgId = newP.id;
    }
    if (error) { setSaving(false); showToast('Алдаа: ' + error.message, 'err'); return; }

    // Sync associations
    if (pkgId) {
      await Promise.all([
        supabase.from('package_services').delete().eq('package_id', pkgId),
        supabase.from('artist_packages').delete().eq('package_id', pkgId),
      ]);
      const toInsert = [];
      if (selServices.length > 0)
        toInsert.push(supabase.from('package_services').insert(selServices.map(sid => ({ package_id: pkgId, service_id: sid }))));
      if (selArtists.length > 0)
        toInsert.push(supabase.from('artist_packages').insert(selArtists.map(aid => ({ package_id: pkgId, artist_id: aid }))));
      if (toInsert.length) await Promise.all(toInsert);
    }

    setSaving(false);
    showToast(form.id ? 'Багц шинэчлэгдлээ ✓' : 'Багц нэмэгдлээ ✓', 'ok');
    setForm(null); setSelServices([]); setSelArtists([]);
    load();
  };

  const remove = async (id) => {
    const { error } = await supabase.from('packages').delete().eq('id', id);
    if (error) { showToast('Устгахад алдаа: ' + error.message, 'err'); return; }
    showToast('Багц устгагдлаа', 'ok'); setDelId(null); load();
  };

  const toggleActive = async (id, val) => {
    await supabase.from('packages').update({ active: val }).eq('id', id);
    setPackages(ps => ps.map(p => p.id === id ? { ...p, active: val } : p));
  };

  const handleFile = async (file) => {
    if (!file?.type.startsWith('image/')) return;
    setUploading(true);
    const fname = `package-${Date.now()}.${file.name.split('.').pop()}`;
    const { error: upErr } = await supabase.storage.from('hero-images').upload(fname, file, { upsert: true });
    if (upErr) { showToast('Зураг байршуулахад алдаа: ' + upErr.message, 'err'); setUploading(false); return; }
    setF('image_url', supabase.storage.from('hero-images').getPublicUrl(fname).data.publicUrl);
    setUploading(false); showToast('Зураг байршлаа ✓', 'ok');
  };

  const inp = { width: '100%', padding: '9px 13px', borderRadius: 10, border: '1.5px solid var(--gray-200)', fontSize: 13, fontFamily: 'Inter,sans-serif', outline: 'none', color: 'var(--dark)', background: '#fff' };

  const Toggle = ({ value, onChange, label }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => onChange(!value)}>
      <div style={{ width: 40, height: 22, borderRadius: 11, background: value ? 'var(--pink)' : 'var(--gray-200)', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 2, left: value ? 19 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'left .2s' }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: value ? 'var(--dark)' : 'var(--gray-500)' }}>{label}</span>
    </div>
  );

  const TagBtn = ({ selected, onClick, children }) => (
    <button type="button" onClick={onClick} style={{
      padding: '7px 14px', borderRadius: 50, fontSize: 12, fontWeight: 600, cursor: 'pointer',
      border: '2px solid', transition: 'all .15s', display: 'flex', alignItems: 'center', gap: 5,
      borderColor: selected ? 'var(--pink)' : 'var(--gray-200)',
      background:  selected ? 'var(--pink-light)' : '#fff',
      color:       selected ? 'var(--pink-dark)' : 'var(--gray-500)',
    }}>{children}</button>
  );

  const savings = (p) => p.original_price > p.price ? p.original_price - p.price : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>
          Нийт <strong>{packages.length}</strong> багц · <strong style={{ color: 'var(--green)' }}>{packages.filter(p => p.active).length}</strong> идэвхтэй
        </div>
        <button className="btn-primary" onClick={openAdd} style={{ fontSize: 13, padding: '10px 22px' }}>+ Багц нэмэх</button>
      </div>

      {/* list */}
      <div className="card" style={{ padding: loading ? 40 : 16 }}>
        {loading && <div style={{ textAlign: 'center', color: 'var(--gray-500)', fontSize: 14 }}>Ачааллаж байна...</div>}
        {!loading && packages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--gray-500)', padding: '32px 20px' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🎁</div>
            <div style={{ fontSize: 14 }}>Багц байхгүй байна</div>
            <button className="btn-primary" onClick={openAdd} style={{ marginTop: 16, fontSize: 13, padding: '10px 22px' }}>+ Нэмэх</button>
          </div>
        )}
        {!loading && packages.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {packages.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 14, border: '1.5px solid var(--gray-200)', background: p.active ? '#fff' : 'var(--gray-100)', opacity: p.active ? 1 : .7, transition: 'all .2s', flexWrap: 'wrap' }}>
                {/* Emoji/icon */}
                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg,#FFF0E6,#FFD6B8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
                  {p.emoji}
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', marginBottom: 2 }}>{p.name}</div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--pink-dark)' }}>₮{p.price.toLocaleString()}</span>
                    {savings(p) > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--green)', background: '#f0fff4', padding: '1px 7px', borderRadius: 50 }}>-₮{savings(p).toLocaleString()} хэмнэлт</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {(pkgSvcMap[p.id] || []).map(sid => {
                      const s = allServices.find(sv => sv.id === sid);
                      return s ? <span key={sid} style={{ fontSize: 10, color: 'var(--pink-dark)', background: 'var(--pink-light)', padding: '2px 7px', borderRadius: 50, fontWeight: 600 }}>{s.emoji} {s.name_mn}</span> : null;
                    })}
                    {(pkgArtMap[p.id] || []).map(aid => {
                      const a = allArtists.find(ar => ar.id === aid);
                      return a ? <span key={aid} style={{ fontSize: 10, color: '#6366f1', background: '#eef2ff', padding: '2px 7px', borderRadius: 50, fontWeight: 600 }}>👤 {a.name}</span> : null;
                    })}
                  </div>
                </div>
                <Toggle value={p.active} onChange={v => toggleActive(p.id, v)} label={p.active ? 'Идэвхтэй' : 'Нуугдсан'} />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => openEdit(p)} style={{ padding: '7px 14px', borderRadius: 8, border: '1.5px solid var(--gray-200)', background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: 'var(--dark)' }}>✏️ Засах</button>
                  <button onClick={() => setDelId(p.id)} style={{ padding: '7px 10px', borderRadius: 8, border: '1.5px solid #fecaca', background: '#fff5f5', fontSize: 12, cursor: 'pointer', color: 'var(--red)' }}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirm */}
      {delId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 32, maxWidth: 340, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Багц устгах уу?</div>
            <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 24 }}>Энэ үйлдлийг буцаах боломжгүй.</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-outline" onClick={() => setDelId(null)} style={{ flex: 1, fontSize: 13, padding: '10px 0' }}>Цуцлах</button>
              <button onClick={() => remove(delId)} style={{ flex: 1, padding: '10px 0', borderRadius: 50, border: 'none', background: 'var(--red)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Устгах</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT FORM */}
      {form && (
        <div className="card" style={{ border: '2px solid var(--pink-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)' }}>{form.id ? '✏️ Багц засах' : '➕ Шинэ багц'}</h3>
            <button onClick={() => { setForm(null); setSelServices([]); setSelArtists([]); }} style={{ background: 'var(--gray-100)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: 'var(--gray-500)' }}>✕</button>
          </div>

          {/* Basic fields */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 14, marginBottom: 16 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: .8 }}>Нэр *</label>
              <input type="text" value={form.name} onChange={e => setF('name', e.target.value)} placeholder="жишээ: Бүрэн лаш + хуруу сайжруулалт" style={inp} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: .8 }}>Тайлбар</label>
              <textarea value={form.description} onChange={e => setF('description', e.target.value)} rows={2} placeholder="Багцад багтах үйлчилгээний тайлбар..." style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: .8 }}>Багцын үнэ (₮) *</label>
              <input type="number" value={form.price} onChange={e => setF('price', e.target.value)} placeholder="80000" min="0" style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: .8 }}>Анхны үнэ (хэмнэлт харуулах)</label>
              <input type="number" value={form.original_price} onChange={e => setF('original_price', e.target.value)} placeholder="100000" min="0" style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: .8 }}>Хугацаа (мин)</label>
              <input type="number" value={form.duration_min} onChange={e => setF('duration_min', e.target.value)} placeholder="120" min="5" step="5" style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: .8 }}>Дараалал</label>
              <input type="number" value={form.sort_order} onChange={e => setF('sort_order', e.target.value)} placeholder="0" style={inp} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
              <Toggle value={form.active} onChange={v => setF('active', v)} label="Нүүр хуудаст харагдах" />
            </div>
          </div>

          {/* Emoji picker */}
          <div style={{ borderTop: '1.5px solid var(--gray-200)', paddingTop: 16, marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: .8 }}>Дүрс / Emoji</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {EMOJI_OPT.map(e => (
                <button key={e} type="button" onClick={() => setF('emoji', e)}
                  style={{ width: 44, height: 44, borderRadius: 12, border: `2px solid ${form.emoji === e ? 'var(--pink)' : 'var(--gray-200)'}`, background: form.emoji === e ? 'var(--pink-light)' : '#fff', fontSize: 22, cursor: 'pointer', transition: 'all .15s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {e}
                </button>
              ))}
              <input type="text" value={form.emoji} onChange={e => setF('emoji', e.target.value)} style={{ ...inp, width: 60, fontSize: 20, textAlign: 'center' }} />
            </div>
          </div>

          {/* Included services */}
          {allServices.length > 0 && (
            <div style={{ borderTop: '1.5px solid var(--gray-200)', paddingTop: 16, marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: .8 }}>
                ✂️ Багцад багтах үйлчилгээнүүд
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {allServices.map(s => (
                  <TagBtn key={s.id} selected={selServices.includes(s.id)}
                    onClick={() => setSelServices(prev => prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id])}>
                    {s.emoji} {s.name_mn}
                  </TagBtn>
                ))}
              </div>
              <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 7 }}>
                {selServices.length > 0 ? `✓ ${selServices.length} үйлчилгээ сонгогдлоо` : 'Хэрэглэгчид харагдах үйлчилгээний жагсаалт'}
              </div>
            </div>
          )}

          {/* Artists who can deliver */}
          {allArtists.length > 0 && (
            <div style={{ borderTop: '1.5px solid var(--gray-200)', paddingTop: 16, marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: .8 }}>
                👤 Энэ багцыг хийж чадах артистууд
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {allArtists.map(a => (
                  <TagBtn key={a.id} selected={selArtists.includes(a.id)}
                    onClick={() => setSelArtists(prev => prev.includes(a.id) ? prev.filter(id => id !== a.id) : [...prev, a.id])}>
                    {a.avatar_emoji || '👩'} {a.name}
                  </TagBtn>
                ))}
              </div>
              <div style={{ fontSize: 11, marginTop: 7, fontWeight: 600, color: selArtists.length > 0 ? 'var(--pink-dark)' : 'var(--gray-500)' }}>
                {selArtists.length > 0 ? `✓ ${selArtists.length} артист — зөвхөн эдгээр захиалгын step 2-д харагдана` : '💡 Сонгоогүй бол бүх артист харагдана'}
              </div>
            </div>
          )}

          {/* Image */}
          <div style={{ borderTop: '1.5px solid var(--gray-200)', paddingTop: 16, marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: .8 }}>📷 Зураг (заавал биш)</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input type="url" value={form.image_url} onChange={e => setF('image_url', e.target.value)} placeholder="https://..." style={{ ...inp, flex: 1 }} />
              {form.image_url && <button onClick={() => setF('image_url', '')} style={{ padding: '9px 10px', borderRadius: 10, border: '1.5px solid var(--gray-200)', background: '#fff', cursor: 'pointer', color: 'var(--gray-500)' }}>✕</button>}
            </div>
            <div onClick={() => !uploading && fileRef.current?.click()}
              style={{ border: '2px dashed var(--gray-200)', borderRadius: 10, padding: 14, textAlign: 'center', cursor: uploading ? 'not-allowed' : 'pointer', background: '#fff' }}>
              <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>{uploading ? '⏳ Байршуулж байна...' : '📁 Зураг сонгох / чирж тавих'}</span>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { handleFile(e.target.files?.[0]); e.target.value = ''; }} />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn-outline" onClick={() => { setForm(null); setSelServices([]); setSelArtists([]); }} style={{ fontSize: 13, padding: '9px 20px' }}>Цуцлах</button>
            <button className="btn-primary" onClick={save} disabled={saving} style={{ fontSize: 13, padding: '10px 28px' }}>
              {saving ? 'Хадгалж байна...' : form.id ? 'Шинэчлэх' : 'Нэмэх'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
