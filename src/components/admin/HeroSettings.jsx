'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import MultiImageUploader from '@/components/admin/MultiImageUploader';

const DEFAULT_IMG =
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=700&q=85&auto=format&fit=crop';

export default function HeroSettings({ showToast }) {
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from('site_settings').select('key, value').in('key', ['hero_image_url', 'hero_images']);
    const rows = {}; (data || []).forEach(r => { rows[r.key] = r.value; });
    let imgs = [];
    if (rows.hero_images) { try { imgs = JSON.parse(rows.hero_images); } catch {} }
    if (!imgs.length && rows.hero_image_url) imgs = [rows.hero_image_url];
    setImages(imgs);
    setLoading(false);
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from('site_settings').upsert([
      { key: 'hero_images',    value: JSON.stringify(images),         updated_at: new Date().toISOString() },
      { key: 'hero_image_url', value: images[0] || DEFAULT_IMG,       updated_at: new Date().toISOString() },
    ]);
    setSaving(false);
    if (error) showToast('Хадгалахад алдаа: ' + error.message, 'err');
    else showToast('Hero зураг амжилттай шинэчлэгдлээ! ✓', 'ok');
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)', marginBottom: 4 }}>🖼️ Hero зургийн тохиргоо</h3>
        <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>
          Нүүр хуудасны баатар хэсгийн зурагнууд. Олон зураг оруулбал <strong>автоматаар ээлжлэн</strong> солигдоно.
        </p>
      </div>

      {loading
        ? <div style={{ color: 'var(--gray-500)', fontSize: 14 }}>Ачааллаж байна...</div>
        : <MultiImageUploader images={images} onChange={setImages} prefix="hero" showToast={showToast} />}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap', borderTop: '1px solid var(--gray-200)', paddingTop: 16 }}>
        <button className="btn-outline" onClick={() => setImages([DEFAULT_IMG])} style={{ fontSize: 13, padding: '9px 18px' }}>🔄 Анхны зурагт буцах</button>
        <button className="btn-primary" onClick={save} disabled={saving} style={{ fontSize: 13, padding: '10px 28px' }}>
          {saving ? 'Хадгалж байна...' : 'Хадгалах'}
        </button>
      </div>
    </div>
  );
}
