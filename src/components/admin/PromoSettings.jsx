'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

const DEFAULT = {
  active : true,
  mode   : 'text',            // 'text' | 'image'
  // ── text mode fields ──
  tag    : '⚡ ОНЦГОЙ САНАЛ',
  title  : 'Анхны захиалгадаа',
  pct    : '20%',
  all    : 'Бүх үйлчилгээнд',
  btn    : 'Одоо захиалах →',
  badge  : 'ОНЦГОЙ · САНАЛ · ЗӨВХӨН · ТАНД',
  emoji  : '💇‍♀️',
  // ── image mode field ──
  img    : '',
};

export default function PromoSettings({ showToast }) {
  const [form, setForm]         = useState(DEFAULT);
  const [saving, setSaving]     = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => { loadPromo(); }, []);

  const loadPromo = async () => {
    const { data } = await supabase
      .from('site_settings').select('value').eq('key', 'promo_config').single();
    if (data?.value) {
      try { setForm({ ...DEFAULT, ...JSON.parse(data.value) }); } catch {}
    }
  };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from('site_settings')
      .upsert({ key: 'promo_config', value: JSON.stringify(form), updated_at: new Date().toISOString() });
    setSaving(false);
    if (error) showToast('Хадгалахад алдаа: ' + error.message, 'err');
    else showToast('Промо баннер амжилттай шинэчлэгдлээ! ✓', 'ok');
  };

  /* ── file upload ── */
  const handleFile = async (file) => {
    if (!file?.type.startsWith('image/')) return;
    setUploading(true);
    const ext  = file.name.split('.').pop();
    const fname = `promo-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from('hero-images').upload(fname, file, { upsert: true });
    if (upErr) { showToast('Зураг байршуулахад алдаа: ' + upErr.message, 'err'); setUploading(false); return; }
    const { data: ud } = supabase.storage.from('hero-images').getPublicUrl(fname);
    set('img', ud.publicUrl);
    setUploading(false);
    showToast('Зураг байршлаа — "Хадгалах" дарна уу', 'ok');
  };

  const handleInputFile = (e) => { handleFile(e.target.files?.[0]); e.target.value = ''; };
  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]); };

  const inp = {
    width: '100%', padding: '9px 13px', borderRadius: 10,
    border: '1.5px solid var(--gray-200)', fontSize: 13,
    fontFamily: 'Inter,sans-serif', outline: 'none', color: 'var(--dark)', background: '#fff',
  };

  const isText  = form.mode === 'text';
  const isImage = form.mode === 'image';

  return (
    <div className="card">

      {/* ── Header ── */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)', marginBottom: 4 }}>📢 Промо баннерийн тохиргоо</h3>
        <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>Нүүр хуудасны онцгой санал хэсгийн агуулгыг өөрчлөх</p>
      </div>

      {/* ── Active toggle ── */}
      <div
        onClick={() => set('active', !form.active)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: form.active ? 'var(--pink-light)' : 'var(--gray-100)', border: `1.5px solid ${form.active ? 'var(--pink)' : 'var(--gray-200)'}`, borderRadius: 12, padding: '12px 16px', marginBottom: 20, cursor: 'pointer' }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)' }}>{form.active ? '✅ Баннер идэвхтэй' : '⏸️ Баннер нуугдсан'}</div>
          <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{form.active ? 'Нүүр хуудаст харагдаж байна' : 'Нүүр хуудаст харагдахгүй'}</div>
        </div>
        <div style={{ width: 46, height: 26, borderRadius: 13, background: form.active ? 'var(--pink)' : 'var(--gray-200)', position: 'relative', flexShrink: 0, transition: 'background .2s' }}>
          <div style={{ position: 'absolute', top: 3, left: form.active ? 23 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.2)', transition: 'left .2s' }} />
        </div>
      </div>

      {/* ── Mode switcher ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-500)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: .8 }}>Баннерийн төрөл</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { id: 'text',  icon: '📝', title: 'Текст агуулга',  desc: 'Шошго, гарчиг, хувь болон бусад' },
            { id: 'image', icon: '🖼️', title: 'Зураг',          desc: 'Бэлдсэн баннер зургаа оруулах' },
          ].map(m => (
            <div
              key={m.id}
              onClick={() => set('mode', m.id)}
              style={{
                border: `2px solid ${form.mode === m.id ? 'var(--pink)' : 'var(--gray-200)'}`,
                background: form.mode === m.id ? 'var(--pink-light)' : '#fff',
                borderRadius: 12, padding: '14px 16px', cursor: 'pointer', transition: 'all .2s',
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 6 }}>{m.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: form.mode === m.id ? 'var(--pink-dark)' : 'var(--dark)', marginBottom: 2 }}>{m.title}</div>
              <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>{m.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════
          TEXT MODE
      ══════════════════════════════════════ */}
      {isText && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14, marginBottom: 20 }}>
          {[
            { key: 'tag',   label: 'Шошго',          placeholder: '⚡ ОНЦГОЙ САНАЛ' },
            { key: 'title', label: 'Гарчиг',          placeholder: 'Анхны захиалгадаа' },
            { key: 'pct',   label: 'Хувь / Тоо',      placeholder: '20%' },
            { key: 'all',   label: 'Дэд гарчиг',      placeholder: 'Бүх үйлчилгээнд' },
            { key: 'btn',   label: 'Товчны текст',    placeholder: 'Одоо захиалах →' },
            { key: 'emoji', label: 'Emoji дүрс',      placeholder: '💇‍♀️' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: .8 }}>{label}</label>
              <input type="text" value={form[key]} onChange={e => set(key, e.target.value)} placeholder={placeholder} style={inp} />
            </div>
          ))}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: .8 }}>Тойрог дахь текст</label>
            <input type="text" value={form.badge} onChange={e => set('badge', e.target.value)} placeholder="ОНЦГОЙ · САНАЛ · ЗӨВХӨН · ТАНД" style={inp} />
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          IMAGE MODE
      ══════════════════════════════════════ */}
      {isImage && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 14 }}>
            Бэлдсэн баннер зургаа оруулна уу. Зураг нь баннерийн бүх талбайг дүүргэнэ.
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start', marginBottom: 14 }}>
            {/* Preview */}
            <div style={{ flexShrink: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: .8 }}>Одоогийн зураг</div>
              <div style={{ width: 160, height: 90, borderRadius: 12, overflow: 'hidden', border: '2px solid var(--gray-200)', background: 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-500)', fontSize: 12 }}>
                {form.img
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={form.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : 'Зураг байхгүй'}
              </div>
              {form.img && (
                <button onClick={() => set('img', '')} style={{ marginTop: 8, width: '100%', padding: '6px 0', borderRadius: 8, border: '1.5px solid var(--red)', background: '#fff5f5', color: 'var(--red)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  ✕ Зураг устгах
                </button>
              )}
            </div>

            {/* Upload */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: .8 }}>URL оруулах</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <input type="url" value={form.img} onChange={e => set('img', e.target.value)} placeholder="https://example.com/banner.jpg" style={{ ...inp, flex: 1 }} />
                {form.img && <button onClick={() => set('img', '')} style={{ padding: '9px 12px', borderRadius: 10, border: '1.5px solid var(--gray-200)', background: '#fff', cursor: 'pointer', color: 'var(--gray-500)' }}>✕</button>}
              </div>
              <div
                onClick={() => !uploading && fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                style={{ border: `2px dashed ${dragOver ? 'var(--pink)' : 'var(--gray-200)'}`, borderRadius: 12, padding: '24px 16px', textAlign: 'center', cursor: uploading ? 'not-allowed' : 'pointer', transition: 'all .2s', background: dragOver ? 'var(--pink-light)' : uploading ? 'var(--gray-100)' : '#fff' }}
              >
                <div style={{ fontSize: 28, marginBottom: 6 }}>{uploading ? '⏳' : '📁'}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)', marginBottom: 2 }}>{uploading ? 'Байршуулж байна...' : 'Дарж зураг сонгох'}</div>
                <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>эсвэл чирж тавих · JPG, PNG, WEBP</div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleInputFile} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Live Preview ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-500)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Урьдчилан харах</div>

        {/* TEXT preview */}
        {isText && (
          <div style={{ background: 'linear-gradient(135deg,#FF6B9D,#C850C0 50%,#4158D0)', borderRadius: 16, padding: '28px 28px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', opacity: form.active ? 1 : 0.4 }}>
            <div style={{ position: 'absolute', top: '-40%', left: '-30%', width: '180%', height: '200%', background: 'radial-gradient(circle at 25% 50%,rgba(255,255,255,.12),transparent 55%)', pointerEvents: 'none' }} />
            <div style={{ zIndex: 2, flex: 1, minWidth: 140 }}>
              <div style={{ display: 'inline-block', background: 'rgba(255,255,255,.2)', color: '#fff', padding: '3px 12px', borderRadius: 50, fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>{form.tag || '⚡ ОНЦГОЙ САНАЛ'}</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{form.title || 'Анхны захиалгадаа'}</div>
              <div style={{ fontSize: 44, fontWeight: 900, color: '#fff', lineHeight: 1, marginBottom: 2 }}>{form.pct || '20%'}</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 13, color: 'rgba(255,255,255,.9)', fontStyle: 'italic', marginBottom: 12 }}>{form.all || 'Бүх үйлчилгээнд'}</div>
              <div style={{ display: 'inline-block', background: '#fff', color: '#C9789E', borderRadius: 50, padding: '6px 18px', fontSize: 12, fontWeight: 700 }}>{form.btn || 'Одоо захиалах →'}</div>
            </div>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(201,168,76,.9)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, textAlign: 'center', lineHeight: 1.3, zIndex: 2, flexShrink: 0, padding: 3 }}>
              {(form.badge || '').split('·').join('\n·\n')}
            </div>
            <div style={{ width: 80, height: 72, borderRadius: 12, background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, zIndex: 2, flexShrink: 0 }}>
              {form.emoji || '💇‍♀️'}
            </div>
          </div>
        )}

        {/* IMAGE preview */}
        {isImage && (
          <div style={{ borderRadius: 16, overflow: 'hidden', background: 'var(--gray-100)', border: '2px solid var(--gray-200)', minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: form.active ? 1 : 0.4 }}>
            {form.img
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={form.img} alt="promo preview" style={{ width: '100%', maxHeight: 240, objectFit: 'cover', display: 'block' }} />
              : <div style={{ textAlign: 'center', color: 'var(--gray-500)', padding: 32 }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🖼️</div>
                  <div style={{ fontSize: 13 }}>Зураг байхгүй байна</div>
                </div>
            }
          </div>
        )}
      </div>

      {/* ── Actions ── */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <button className="btn-outline" onClick={() => setForm(DEFAULT)} style={{ fontSize: 13, padding: '9px 18px' }}>🔄 Анхны утгад буцах</button>
        <button className="btn-primary" onClick={save} disabled={saving} style={{ fontSize: 13, padding: '10px 28px' }}>
          {saving ? 'Хадгалж байна...' : 'Хадгалах'}
        </button>
      </div>
    </div>
  );
}
