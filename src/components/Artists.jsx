'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useUI }    from '@/contexts/UIContext';

/* Fallback — Supabase алдаа гарвал эдгээрийг харуулна */
const FALLBACK = [
  { id:1, name:'Хатанцэцэг', specialty_mn:'Lash мэргэжилтэн',  rating:4.9, review_count:128, avatar_emoji:'👩‍🦱', image_url:'' },
  { id:2, name:'Дэлгэрцэцэг', specialty_mn:'Brow & Lash',       rating:4.8, review_count:96,  avatar_emoji:'👩‍🦰', image_url:'' },
  { id:3, name:'Өнөржаргал',  specialty_mn:'Nails мэргэжилтэн', rating:4.8, review_count:84,  avatar_emoji:'👩',   image_url:'' },
  { id:4, name:'Номин',       specialty_mn:'Будалт & Wax',       rating:4.8, review_count:72,  avatar_emoji:'👩‍🦳', image_url:'' },
  { id:5, name:'Анхзул',      specialty_mn:'Нүүрний засал',      rating:4.9, review_count:60,  avatar_emoji:'🧑‍🎨', image_url:'' },
];

export default function Artists() {
  const { openBooking } = useUI();
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('artists')
      .select('*')
      .eq('active', true)
      .order('id')
      .then(({ data, error }) => {
        if (error) console.error('[Artists]', error.message);
        setArtists(data?.length ? data : FALLBACK);
        setLoading(false);
      });
  }, []);

  if (loading) return null;

  return (
    <section className="artists-section" id="artists">
      <div className="sec-header fade-up">
        <h2 className="sec-title">Манай <span>Уран Бүтээлчид</span></h2>
        <button className="btn-ghost" onClick={openBooking}>Цаг захиалах</button>
      </div>
      <div className="artists-grid">
        {artists.map(a => (
          <div key={a.id} className="artist-card">
            <div className="artist-av" style={a.image_url ? { padding: 0, overflow: 'hidden' } : {}}>
              {a.image_url
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={a.image_url} alt={a.name} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} />
                : (a.avatar_emoji || '👩')}
            </div>
            <div className="artist-name">{a.name}</div>
            <div className="artist-role">{a.specialty_mn}</div>
            <div className="artist-stars">
              ⭐ {Number(a.rating).toFixed(1)} <span>({a.review_count})</span>
            </div>
            <button className="btn-book" onClick={openBooking}>Цаг захиалах</button>
          </div>
        ))}
      </div>
    </section>
  );
}
