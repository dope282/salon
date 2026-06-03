'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import MultiImageUploader from '@/components/admin/MultiImageUploader';

const EMPTY = {
  name_mn: '', description_mn: '', price_from: '', deposit: '', duration_min: '60', emoji: '✂️', image_url: '', images: [], active: true,
};

const EMOJI_OPTIONS = ['✂️','🎨','💆','💅','🦶','💄','💇','🧴','💋','🌸','✨','💆‍♀️'];

export default function ServicesManager({ showToast }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [delId, setDelId] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('services').select('*').order('id');
    setServices(data || []);
    setLoading(false);
  };

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const scrollToForm = () => setTimeout(() => {
    const el = document.getElementById('adminMain');
    (el || window).scrollTo({ top: 99999, behavior: 'smooth' });
  }, 50);
  const openAdd = () => { setForm({ ...EMPTY }); scrollToForm(); };
  const openEdit = (s) => { setForm({ ...s, price_from: String(s.price_from), deposit: String(s.deposit || ''), duration_min: String(s.duration_min), images: s.images?.length ? s.images : (s.image_url ? [s.image_url] : []) }); scrollToForm(); };

  const save = async () => {
    if (!form.name_mn.trim()) { showToast('Үйлчилгээний нэр оруулна уу', 'err'); return; }
    if (!form.price_from || isNaN(parseInt(form.price_from))) { showToast('Үнэ оруулна уу', 'err'); return; }
    setSaving(true);
    const imgs = form.images || [];
    const payload = {
      name_mn: form.name_mn.trim(),
      description_mn: form.description_mn.trim(),
      price_from: parseInt(form.price_from) || 0,
      duration_min: parseInt(form.duration_min) || 60,
      emoji: form.emoji.trim() || '✂️',
      deposit: parseInt(form.deposit) || 0,
      images: imgs, image_url: imgs[0] || '',
      active: form.active,
    };
    let error;
    if (form.id) {
      ({ error } = await supabase.from('services').update(payload).eq('id', form.id));
    } else {
      ({ error } = await supabase.from('services').insert(payload));
    }
    setSaving(false);
    if (error) { showToast('Алдаа: ' + error.message, 'err'); return; }
    showToast(form.id ? 'Үйлчилгээ шинэчлэгдлээ ✓' : 'Үйлчилгээ нэмэгдлээ ✓', 'ok');
    setForm(null);
    load();
  };

  const remove = async (id) => {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) { showToast('Устгахад алдаа: ' + error.message, 'err'); return; }
    showToast('Үйлчилгээ устгагдлаа', 'ok');
    setDelId(null);
    load();
  };

  const toggleActive = async (id, val) => {
    await supabase.from('services').update({ active: val }).eq('id', id);
    setServices(ss => ss.map(s => s.id === id ? { ...s, active: val } : s));
  };

  const inp = { width: '100%', padding: '9px 13px', borderRadius: 10, border: '1.5px solid var(--gray-200)', fontSize: 13, fontFamily: 'Inter,sans-serif', outline: 'none', color: 'var(--dark)', background: '#fff', boxSizing: 'border-box' };

  const Toggle = ({ value, onChange, label }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => onChange(!value)}>
      <div style={{ width: 40, height: 22, borderRadius: 11, background: value ? 'var(--pink)' : 'var(--gray-200)', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 2, left: value ? 19 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'left .2s' }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: value ? 'var(--dark)' : 'var(--gray-500)' }}>{label}</span>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>
          Нийт <strong>{services.length}</strong> үйлчилгээ ·{' '}
          <strong style={{ color: 'var(--green)' }}>{services.filter(s => s.active).length}</strong> Идэвхтэй
        </div>
        <button className="btn-primary" onClick={openAdd} style={{ fontSize: 13, padding: '10px 22px' }}>
          + Үйлчилгээ нэмэх
        </button>
      </div>

      {/* list */}
      <div className="card" style={{ padding: loading ? 40 : 16 }}>
        {loading && <div style={{ textAlign: 'center', color: 'var(--gray-500)', fontSize: 14 }}>Ачааллаж байна...</div>}

        {!loading && services.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--gray-500)', padding: '32px 20px' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>✂️</div>
            <div style={{ fontSize: 14 }}>Үйлчилгээ байхгүй байна</div>
            <button className="btn-primary" onClick={openAdd} style={{ marginTop: 16, fontSize: 13, padding: '10px 22px' }}>+ Нэмэх</button>
          </div>
        )}

        {!loading && services.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {services.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 14, border: '1.5px solid var(--gray-200)', background: s.active ? '#fff' : 'var(--gray-100)', opacity: s.active ? 1 : .7, transition: 'all .2s', flexWrap: 'wrap' }}>

                {/* Service image / emoji fallback */}
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#FFD6E8,#FFBCD9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0, overflow: 'hidden' }}>
                  {(s.images?.[0] || s.image_url)
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={s.images?.[0] || s.image_url} alt={s.name_mn} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : s.emoji}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 140 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', marginBottom: 2 }}>{s.name_mn}</div>
                  {s.description_mn && <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 2 }}>{s.description_mn}</div>}
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--pink-dark)' }}>₮{s.price_from?.toLocaleString()}+</span>
                    <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>⏱ {s.duration_min} мин</span>
                  </div>
                </div>

                {/* Active toggle */}
                <Toggle value={s.active} onChange={v => toggleActive(s.id, v)} label={s.active ? 'Идэвхтэй' : 'Идэвхгүй'} />

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => openEdit(s)} style={{ padding: '7px 14px', borderRadius: 8, border: '1.5px solid var(--gray-200)', background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: 'var(--dark)', whiteSpace: 'nowrap' }}>✏️ Засах</button>
                  <button onClick={() => setDelId(s.id)} style={{ padding: '7px 10px', borderRadius: 8, border: '1.5px solid #fecaca', background: '#fff5f5', fontSize: 12, cursor: 'pointer', color: 'var(--red)' }}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirm */}
      {delId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 32, maxWidth: 340, width: '100%', textAlign: 'center', boxShadow: '0 24px 80px rgba(0,0,0,.18)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Үйлчилгээ устгах уу?</div>
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
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)' }}>
              {form.id ? '✏️ Үйлчилгээ засах' : '➕ Шинэ үйлчилгээ'}
            </h3>
            <button onClick={() => setForm(null)} style={{ background: 'var(--gray-100)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: 'var(--gray-500)' }}>✕</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14, marginBottom: 16 }}>

            {/* Name */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: .8 }}>Үйлчилгээний нэр *</label>
              <input type="text" value={form.name_mn} onChange={e => setF('name_mn', e.target.value)} placeholder="жишээ: Үс тайрах & Засах" style={inp} />
            </div>

            {/* Description */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: .8 }}>Тайлбар</label>
              <textarea value={form.description_mn} onChange={e => setF('description_mn', e.target.value)} placeholder="Үйлчилгээний дэлгэрэнгүй тайлбар..." rows={3} style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }} />
            </div>

            {/* Price */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: .8 }}>Үнэ (₮) *</label>
              <input type="number" value={form.price_from} onChange={e => setF('price_from', e.target.value)} placeholder="35000" min="0" style={inp} />
            </div>

            {/* Deposit */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: .8 }}>Урьдчилгаа (₮)</label>
              <input type="number" value={form.deposit} onChange={e => setF('deposit', e.target.value)} placeholder="0 = бүтэн төлбөр" min="0" style={inp} />
            </div>

            {/* Duration */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: .8 }}>Хугацаа (мин)</label>
              <input type="number" value={form.duration_min} onChange={e => setF('duration_min', e.target.value)} placeholder="60" min="5" step="5" style={inp} />
            </div>

            {/* Active */}
            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
              <Toggle value={form.active} onChange={v => setF('active', v)} label="Нүүр хуудаст харагдах" />
            </div>
          </div>

          {/* Зурагнууд */}
          <div style={{ borderTop: '1.5px solid var(--gray-200)', paddingTop: 16, marginBottom: 16 }}>
            <MultiImageUploader images={form.images} onChange={imgs => setF('images', imgs)} prefix="service" showToast={showToast} fallbackEmoji={form.emoji} />
          </div>

          {/* Emoji fallback (зураг байхгүй үед) */}
          <div style={{ borderTop: '1.5px solid var(--gray-200)', paddingTop: 16, marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: .8 }}>Emoji дүрс <span style={{ textTransform: 'none', fontWeight: 400, color: 'var(--gray-400)' }}>(зураг байхгүй үед харагдана)</span></label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {EMOJI_OPTIONS.map(e => (
                <button key={e} onClick={() => setF('emoji', e)}
                  style={{ width: 44, height: 44, borderRadius: 12, border: `2px solid ${form.emoji === e ? 'var(--pink)' : 'var(--gray-200)'}`, background: form.emoji === e ? 'var(--pink-light)' : '#fff', fontSize: 22, cursor: 'pointer', transition: 'all .15s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {e}
                </button>
              ))}
              <input type="text" value={form.emoji} onChange={e => setF('emoji', e.target.value)} placeholder="✂️" style={{ ...inp, width: 60, fontSize: 20, textAlign: 'center' }} />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn-outline" onClick={() => setForm(null)} style={{ fontSize: 13, padding: '9px 20px' }}>Цуцлах</button>
            <button className="btn-primary" onClick={save} disabled={saving} style={{ fontSize: 13, padding: '10px 28px' }}>
              {saving ? 'Хадгалж байна...' : form.id ? 'Шинэчлэх' : 'Нэмэх'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
