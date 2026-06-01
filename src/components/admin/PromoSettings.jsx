'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import MultiImageUploader from '@/components/admin/MultiImageUploader';

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
  // ── image mode fields ──
  img    : '',
  imgs   : [],
};

export default function PromoSettings({ showToast }) {
  const [form, setForm]         = useState(DEFAULT);
  const [saving, setSaving]     = useState(false);

  useEffect(() => { loadPromo(); }, []);

  const loadPromo = async () => {
    const { data } = await supabase
      .from('site_settings').select('value').eq('key', 'promo_config').single();
    if (data?.value) {
      try {
        const parsed = JSON.parse(data.value);
        if (!parsed.imgs?.length && parsed.img) parsed.imgs = [parsed.img];
        setForm({ ...DEFAULT, ...parsed });
      } catch {}
    }
  };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const save = async () => {
    setSaving(true);
    const payload = { ...form, img: (form.imgs && form.imgs[0]) || '' };
    const { error } = await supabase.from('site_settings')
      .upsert({ key: 'promo_config', value: JSON.stringify(payload), updated_at: new Date().toISOString() });
    setSaving(false);
    if (error) showToast('Хадгалахад алдаа: ' + error.message, 'err');
    else showToast('Промо баннер амжилттай шинэчлэгдлээ! ✓', 'ok');
  };

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
            Баннер зурагнуудаа оруулна уу. Олон зураг оруулбал <strong>автоматаар ээлжлэн</strong> солигдоно. (4:1 харьцаатай өргөн зураг тохиромжтой)
          </div>
          <MultiImageUploader images={form.imgs} onChange={imgs => set('imgs', imgs)} prefix="promo" showToast={showToast} />
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
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,51,153,.9)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, textAlign: 'center', lineHeight: 1.3, zIndex: 2, flexShrink: 0, padding: 3 }}>
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
            {form.imgs?.[0]
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={form.imgs[0]} alt="promo preview" style={{ width: '100%', maxHeight: 240, objectFit: 'cover', display: 'block' }} />
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
