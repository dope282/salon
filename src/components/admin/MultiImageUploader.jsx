'use client';
import { useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Олон зураг байршуулах / удирдах (admin).
 * - images: string[]
 * - onChange: (newArray) => void
 * - prefix: storage файлын нэрийн угтвар (жишээ: 'service')
 * - showToast, fallbackEmoji
 */
export default function MultiImageUploader({ images = [], onChange, prefix = 'img', showToast, fallbackEmoji = '🖼️' }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver]   = useState(false);
  const [urlInput, setUrlInput]   = useState('');
  const fileRef = useRef(null);
  const list = Array.isArray(images) ? images : [];

  const addUrl = () => { const u = urlInput.trim(); if (!u) return; onChange([...list, u]); setUrlInput(''); };
  const removeAt = (idx) => onChange(list.filter((_, i) => i !== idx));
  const move = (idx, dir) => {
    const j = idx + dir; if (j < 0 || j >= list.length) return;
    const copy = [...list]; [copy[idx], copy[j]] = [copy[j], copy[idx]]; onChange(copy);
  };

  const handleFiles = async (files) => {
    const arr = Array.from(files || []).filter(f => f.type.startsWith('image/'));
    if (!arr.length) return;
    setUploading(true);
    const uploaded = [];
    for (const file of arr) {
      const fname = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,7)}.${file.name.split('.').pop()}`;
      const { error } = await supabase.storage.from('hero-images').upload(fname, file, { upsert: true });
      if (error) { showToast?.('Зураг байршуулахад алдаа: ' + error.message, 'err'); continue; }
      uploaded.push(supabase.storage.from('hero-images').getPublicUrl(fname).data.publicUrl);
    }
    setUploading(false);
    if (uploaded.length) { onChange([...list, ...uploaded]); showToast?.(`${uploaded.length} зураг нэмэгдлээ ✓`, 'ok'); }
  };

  const inp = { width:'100%', padding:'9px 12px', borderRadius:10, border:'1.5px solid var(--gray-200)', fontSize:13, fontFamily:'Inter,sans-serif', outline:'none', color:'var(--dark)', background:'#fff', boxSizing:'border-box' };

  return (
    <div>
      <label style={{ fontSize:12, fontWeight:600, color:'var(--gray-500)', display:'block', marginBottom:10, textTransform:'uppercase', letterSpacing:.8 }}>
        🖼️ Зурагнууд <span style={{ textTransform:'none', fontWeight:400, color:'var(--gray-400)' }}>({list.length}) — ээлжлэн солигдоно</span>
      </label>

      {/* Thumbnails */}
      {list.length > 0 && (
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:12 }}>
          {list.map((src, idx) => (
            <div key={src + idx} style={{ position:'relative', width:92, height:92, borderRadius:12, overflow:'hidden', border:'1.5px solid var(--gray-200)', flexShrink:0, background:'var(--gray-100)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              {idx === 0 && (
                <span style={{ position:'absolute', top:4, left:4, background:'var(--gold)', color:'#fff', fontSize:8, fontWeight:700, padding:'1px 5px', borderRadius:50 }}>1-р</span>
              )}
              <button type="button" onClick={() => removeAt(idx)}
                style={{ position:'absolute', top:4, right:4, width:20, height:20, borderRadius:'50%', border:'none', background:'rgba(229,62,62,.92)', color:'#fff', fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1 }}>✕</button>
              <div style={{ position:'absolute', bottom:0, left:0, right:0, display:'flex', justifyContent:'space-between', background:'rgba(0,0,0,.35)' }}>
                <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0}
                  style={{ flex:1, border:'none', background:'none', color:'#fff', fontSize:12, cursor: idx===0?'default':'pointer', opacity: idx===0?.3:1, padding:'2px 0' }}>‹</button>
                <button type="button" onClick={() => move(idx, 1)} disabled={idx === list.length-1}
                  style={{ flex:1, border:'none', background:'none', color:'#fff', fontSize:12, cursor: idx===list.length-1?'default':'pointer', opacity: idx===list.length-1?.3:1, padding:'2px 0' }}>›</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* URL нэмэх */}
      <div style={{ display:'flex', gap:8, marginBottom:8 }}>
        <input type="url" value={urlInput} onChange={e => setUrlInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } }}
          placeholder="https://... (зургийн URL)" style={{ ...inp, flex:1 }} />
        <button type="button" onClick={addUrl} disabled={!urlInput.trim()}
          style={{ padding:'9px 16px', borderRadius:10, border:'1.5px solid var(--gold)', background:'var(--gold-light)', color:'var(--gold-dark)', fontSize:13, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>+ Нэмэх</button>
      </div>

      {/* Drop zone (олон зэрэг) */}
      <div
        onClick={() => !uploading && fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        style={{ border:`2px dashed ${dragOver ? 'var(--gold)' : 'var(--gray-200)'}`, borderRadius:10, padding:'16px', textAlign:'center', cursor: uploading ? 'not-allowed' : 'pointer', background: dragOver ? 'var(--gold-light)' : '#fff', transition:'all .2s' }}>
        <span style={{ fontSize:13, color:'var(--gray-500)' }}>{uploading ? '⏳ Байршуулж байна...' : '📁 Олон зураг сонгох / чирж тавих'}</span>
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display:'none' }}
          onChange={e => { handleFiles(e.target.files); e.target.value=''; }} />
      </div>
    </div>
  );
}
