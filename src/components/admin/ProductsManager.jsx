'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import MultiImageUploader from '@/components/admin/MultiImageUploader';

const EMPTY = {
  name: '', description: '', price: '',
  category: '', image_url: '', images: [], in_stock: true, active: true,
};

export default function ProductsManager({ showToast }) {
  const [products,  setProducts]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [form,      setForm]      = useState(null);   // null=closed | {...}=open
  const [saving,    setSaving]    = useState(false);
  const [tab,       setTab]       = useState('all');  // all | active | inactive
  const [delId,     setDelId]     = useState(null);   // confirm delete id

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('products').select('*')
      .order('sort_order').order('created_at', { ascending: false });
    setProducts(data || []);
    setLoading(false);
  };

  /* ── helpers ── */
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const scrollToForm = () => setTimeout(() => {
    const el = document.getElementById('adminMain');
    (el || window).scrollTo({ top: 99999, behavior: 'smooth' });
  }, 50);
  const openAdd  = () => { setForm({ ...EMPTY }); scrollToForm(); };
  const openEdit = (p) => { setForm({ ...p, price: String(p.price), images: p.images?.length ? p.images : (p.image_url ? [p.image_url] : []) }); scrollToForm(); };

  /* ── save (insert / update) ── */
  const save = async () => {
    if (!form.name.trim()) { showToast('Бүтээгдэхүүний нэр оруулна уу', 'err'); return; }
    setSaving(true);
    const imgs = form.images || [];
    const payload = {
      name:        form.name.trim(),
      description: form.description.trim(),
      price:       parseInt(form.price) || 0,
      category:    form.category.trim(),
      images:      imgs, image_url: imgs[0] || '',
      in_stock:    form.in_stock,
      active:      form.active,
    };
    let error;
    if (form.id) {
      ({ error } = await supabase.from('products').update(payload).eq('id', form.id));
    } else {
      ({ error } = await supabase.from('products').insert(payload));
    }
    setSaving(false);
    if (error) { showToast('Алдаа: ' + error.message, 'err'); return; }
    showToast(form.id ? 'Бүтээгдэхүүн шинэчлэгдлээ ✓' : 'Бүтээгдэхүүн нэмэгдлээ ✓', 'ok');
    setForm(null);
    load();
  };

  /* ── delete ── */
  const remove = async (id) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) { showToast('Устгахад алдаа: ' + error.message, 'err'); return; }
    showToast('Бүтээгдэхүүн устгагдлаа', 'ok');
    setDelId(null);
    load();
  };

  /* ── toggle field ── */
  const toggle = async (id, field, val) => {
    await supabase.from('products').update({ [field]: val }).eq('id', id);
    setProducts(ps => ps.map(p => p.id === id ? { ...p, [field]: val } : p));
  };

  /* ── filtered list ── */
  const list = products.filter(p =>
    tab === 'all' ? true : tab === 'active' ? p.active : !p.active
  );

  /* ── styles ── */
  const inp = {
    width: '100%', padding: '9px 13px', borderRadius: 10,
    border: '1.5px solid var(--gray-200)', fontSize: 13,
    fontFamily: 'Inter,sans-serif', outline: 'none', color: 'var(--dark)', background: '#fff',
  };
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

      {/* ── Top bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[['all','Бүгд'], ['active','Идэвхтэй'], ['inactive','Идэвхгүй']].map(([id, lbl]) => (
            <button key={id} onClick={() => setTab(id)} style={{ padding: '7px 16px', borderRadius: 50, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1.5px solid', borderColor: tab === id ? 'var(--pink)' : 'var(--gray-200)', background: tab === id ? 'var(--pink-light)' : '#fff', color: tab === id ? 'var(--pink-dark)' : 'var(--gray-500)', transition: 'all .2s' }}>
              {lbl} {tab === id && `(${list.length})`}
            </button>
          ))}
        </div>
        <button className="btn-primary" onClick={openAdd} style={{ fontSize: 13, padding: '10px 22px' }}>
          + Бүтээгдэхүүн нэмэх
        </button>
      </div>

      {/* ── Product grid ── */}
      <div className="card" style={{ padding: loading ? 40 : 20 }}>
        {loading && <div style={{ textAlign: 'center', color: 'var(--gray-500)', fontSize: 14 }}>Ачааллаж байна...</div>}

        {!loading && list.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--gray-500)', padding: '32px 20px' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📦</div>
            <div style={{ fontSize: 14 }}>Бүтээгдэхүүн байхгүй байна</div>
            <button className="btn-primary" onClick={openAdd} style={{ marginTop: 16, fontSize: 13, padding: '10px 22px' }}>+ Нэмэх</button>
          </div>
        )}

        {!loading && list.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16 }}>
            {list.map(p => (
              <div key={p.id} style={{ border: '1.5px solid var(--gray-200)', borderRadius: 14, overflow: 'hidden', background: p.active ? '#fff' : 'var(--gray-100)', opacity: p.active ? 1 : 0.7, transition: 'all .2s' }}>
                {/* Image */}
                <div style={{ width: '100%', height: 140, background: 'linear-gradient(135deg,#F5E6C8,#FDE8F0)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44 }}>
                  {(p.images?.[0] || p.image_url)
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={p.images?.[0] || p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
                    : '🛒'}
                  {/* Badges */}
                  <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {!p.active && <span style={{ background: '#1a1a2e', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 50 }}>НУУГДСАН</span>}
                    {!p.in_stock && <span style={{ background: 'var(--red)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 50 }}>ДУУССАН</span>}
                  </div>
                </div>

                {/* Info */}
                <div style={{ padding: '12px 14px' }}>
                  {p.category && <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--pink-dark)', background: 'var(--pink-light)', display: 'inline-block', padding: '2px 8px', borderRadius: 50, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 6 }}>{p.category}</div>}
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--pink)', marginBottom: 10 }}>{p.price.toLocaleString()}₮</div>

                  {/* Toggles */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                    <Toggle value={p.active}   onChange={v => toggle(p.id, 'active', v)}   label={p.active ? 'Идэвхтэй' : 'Нуугдсан'} />
                    <Toggle value={p.in_stock} onChange={v => toggle(p.id, 'in_stock', v)} label={p.in_stock ? 'Нөөцтэй' : 'Дууссан'} />
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => openEdit(p)} style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: '1.5px solid var(--gray-200)', background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: 'var(--dark)' }}>✏️ Засах</button>
                    <button onClick={() => setDelId(p.id)} style={{ padding: '7px 10px', borderRadius: 8, border: '1.5px solid #fecaca', background: '#fff5f5', fontSize: 12, cursor: 'pointer', color: 'var(--red)' }}>🗑</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Delete confirm ── */}
      {delId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 32, maxWidth: 360, width: '100%', textAlign: 'center', boxShadow: '0 24px 80px rgba(0,0,0,.18)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Бүтээгдэхүүн устгах уу?</div>
            <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 24 }}>Энэ үйлдлийг буцаах боломжгүй.</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-outline" onClick={() => setDelId(null)} style={{ flex: 1, fontSize: 13, padding: '10px 0' }}>Цуцлах</button>
              <button onClick={() => remove(delId)} style={{ flex: 1, padding: '10px 0', borderRadius: 50, border: 'none', background: 'var(--red)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Устгах</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════
          ADD / EDIT FORM
      ══════════════════════════════ */}
      {form && (
        <div className="card" style={{ border: '2px solid var(--pink-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)' }}>
              {form.id ? '✏️ Бүтээгдэхүүн засах' : '➕ Шинэ бүтээгдэхүүн'}
            </h3>
            <button onClick={() => setForm(null)} style={{ background: 'var(--gray-100)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: 'var(--gray-500)' }}>✕</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14, marginBottom: 16 }}>
            {/* Name */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: .8 }}>Нэр *</label>
              <input type="text" value={form.name} onChange={e => setF('name', e.target.value)} placeholder="Бүтээгдэхүүний нэр" style={inp} />
            </div>

            {/* Description */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: .8 }}>Тайлбар</label>
              <textarea value={form.description} onChange={e => setF('description', e.target.value)} placeholder="Бүтээгдэхүүний тайлбар..." rows={2} style={{ ...inp, resize: 'vertical' }} />
            </div>

            {/* Price */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: .8 }}>Үнэ (₮) *</label>
              <input type="number" value={form.price} onChange={e => setF('price', e.target.value)} placeholder="0" style={inp} min="0" />
            </div>

            {/* Category */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: .8 }}>Ангилал</label>
              <input type="text" value={form.category} onChange={e => setF('category', e.target.value)} placeholder="жишээ: Үсний бүтээгдэхүүн" style={inp} />
            </div>

            {/* Toggles */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 12 }}>
              <Toggle value={form.active}   onChange={v => setF('active', v)}   label="Нүүр хуудаст харагдах" />
              <Toggle value={form.in_stock} onChange={v => setF('in_stock', v)} label="Нөөцтэй (Авах боломжтой)" />
            </div>
          </div>

          {/* ── Зурагнууд ── */}
          <div style={{ borderTop: '1.5px solid var(--gray-200)', paddingTop: 16, marginBottom: 20 }}>
            <MultiImageUploader images={form.images} onChange={imgs => setF('images', imgs)} prefix="product" showToast={showToast} fallbackEmoji="🛒" />
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
