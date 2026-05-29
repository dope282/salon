'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

const DEFAULT_IMG =
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=700&q=85&auto=format&fit=crop';

export default function HeroSettings({ showToast }) {
  const [currentUrl, setCurrentUrl] = useState('');
  const [urlInput, setUrlInput]     = useState('');
  const [uploading, setUploading]   = useState(false);
  const [saving, setSaving]         = useState(false);
  const [preview, setPreview]       = useState('');
  const fileRef = useRef(null);

  useEffect(() => { loadSettings(); }, []);

  /* ─── helpers ─── */
  const loadSettings = async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'hero_image_url')
      .single();
    const url = data?.value || DEFAULT_IMG;
    setCurrentUrl(url);
    setUrlInput(url);
    setPreview(url);
  };

  const persistUrl = async (url) => {
    setSaving(true);
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key: 'hero_image_url', value: url, updated_at: new Date().toISOString() });
    setSaving(false);
    if (error) {
      showToast('Хадгалахад алдаа: ' + error.message, 'err');
    } else {
      setCurrentUrl(url);
      setPreview(url);
      showToast('Hero зураг амжилттай шинэчлэгдлээ! ✓', 'ok');
    }
  };

  /* ─── URL save ─── */
  const handleUrlSave = () => {
    if (!urlInput.trim()) return;
    persistUrl(urlInput.trim());
  };

  /* ─── File upload ─── */
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';               // allow re-selecting same file

    setUploading(true);
    const ext = file.name.split('.').pop();
    const fileName = `hero-${Date.now()}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from('hero-images')
      .upload(fileName, file, { upsert: true });

    if (uploadErr) {
      setUploading(false);
      // Bucket олдсонгүй — dashboard-аас үүсгэхийг хүс
      if (uploadErr.message?.toLowerCase().includes('bucket')) {
        setBucketMissing(true);
        showToast('Bucket олдсонгүй — доорх зааврыг уншина уу', 'err');
      } else {
        showToast('Зураг байршуулахад алдаа: ' + uploadErr.message, 'err');
      }
      return;
    }
    setBucketMissing(false);

    const { data: urlData } = supabase.storage
      .from('hero-images')
      .getPublicUrl(fileName);

    setUploading(false);
    const pub = urlData.publicUrl;
    setUrlInput(pub);
    await persistUrl(pub);
  };

  /* ─── drag-over styling ─── */
  const [bucketMissing, setBucketMissing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleFileUpload({ target: { files: [file], value: '' } });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Preview ── */}
      <div className="card">
        <div style={{ marginBottom: 18 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)', marginBottom: 4 }}>
            🖼️ Hero зургийн тохиргоо
          </h3>
          <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>
            Нүүр хуудасны баатар хэсгийн зургийг энд солих боломжтой.
          </p>
        </div>

        {/* Current preview */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-500)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            Одоогийн зураг
          </div>
          <div style={{ width: '100%', maxWidth: 480, height: 270, borderRadius: 16, overflow: 'hidden', background: 'var(--gray-100)', border: '2px solid var(--gray-200)', position: 'relative' }}>
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Hero preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={() => setPreview(DEFAULT_IMG)}
              />
            )}
          </div>
        </div>

        {/* URL input */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)', display: 'block', marginBottom: 8 }}>
            URL-аар зураг оруулах
          </label>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              type="url"
              value={urlInput}
              onChange={e => { setUrlInput(e.target.value); setPreview(e.target.value); }}
              placeholder="https://example.com/image.jpg"
              style={{
                flex: 1, minWidth: 200, padding: '10px 14px',
                borderRadius: 10, border: '1.5px solid var(--gray-200)',
                fontSize: 13, fontFamily: 'Inter,sans-serif', outline: 'none',
                color: 'var(--dark)', background: '#fff',
              }}
            />
            <button
              className="btn-primary"
              onClick={handleUrlSave}
              disabled={saving || !urlInput.trim()}
              style={{ padding: '10px 22px', fontSize: 13, whiteSpace: 'nowrap' }}
            >
              {saving ? 'Хадгалж байна...' : 'Хадгалах'}
            </button>
          </div>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--gray-200)' }} />
          <span style={{ fontSize: 12, color: 'var(--gray-500)', fontWeight: 600 }}>эсвэл компьютерээсээ</span>
          <div style={{ flex: 1, height: 1, background: 'var(--gray-200)' }} />
        </div>

        {/* File upload drop zone */}
        <div
          onClick={() => !uploading && fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragOver ? 'var(--pink)' : 'var(--gray-200)'}`,
            borderRadius: 14,
            padding: '32px 20px',
            textAlign: 'center',
            cursor: uploading ? 'not-allowed' : 'pointer',
            transition: 'all .2s',
            background: dragOver ? 'var(--pink-light)' : uploading ? 'var(--gray-100)' : '#fff',
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 10 }}>{uploading ? '⏳' : '📁'}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--dark)', marginBottom: 4 }}>
            {uploading ? 'Байршуулж байна...' : 'Дарж зураг сонгох'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
            эсвэл энд чирж тавих · JPG, PNG, WEBP
          </div>
          <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 4 }}>
            Зөвлөмж хэмжээ: 700 × 560 px
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
        </div>

        {/* Bucket setup guide — always visible or highlighted on error */}
        <div style={{
          background: bucketMissing ? '#FFF5F5' : 'var(--gold-light)',
          border: `1.5px solid ${bucketMissing ? 'var(--red)' : 'var(--gold)'}`,
          borderRadius: 12, padding: '16px 18px', fontSize: 13, color: 'var(--dark)', lineHeight: 1.8,
        }}>
          {bucketMissing && (
            <div style={{ fontWeight: 700, color: 'var(--red)', marginBottom: 8, fontSize: 14 }}>
              ⚠️ "hero-images" bucket олдсонгүй — доорх алхмуудыг дагана уу:
            </div>
          )}
          {!bucketMissing && (
            <div style={{ fontWeight: 700, marginBottom: 8 }}>💡 Зураг байршуулахын өмнө нэг удаа хийх тохиргоо:</div>
          )}
          <ol style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <li>
              <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer"
                style={{ color: 'var(--pink-dark)', fontWeight: 600 }}>
                supabase.com/dashboard
              </a>{' '}
              → өөрийн проект
            </li>
            <li>Зүүн цэснээс <strong>Storage</strong> дарна</li>
            <li><strong>New bucket</strong> товчийг дарна</li>
            <li>Name: <code style={{ background: '#fff', padding: '1px 6px', borderRadius: 4 }}>hero-images</code></li>
            <li><strong>Public bucket</strong> checkbox-ийг тэмдэглэнэ ✅</li>
            <li><strong>Save</strong> дарна → дууслаа!</li>
          </ol>
        </div>
      </div>

      {/* Reset to default */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--dark)' }}>Анхны зурагт буцах</div>
          <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>Unsplash-ийн анхны зурагруу шилжинэ</div>
        </div>
        <button
          className="btn-outline"
          onClick={() => { setUrlInput(DEFAULT_IMG); setPreview(DEFAULT_IMG); persistUrl(DEFAULT_IMG); }}
          disabled={saving}
          style={{ fontSize: 13, padding: '9px 20px' }}
        >
          🔄 Анхны зурагт буцах
        </button>
      </div>

    </div>
  );
}
