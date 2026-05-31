'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useUI }    from '@/contexts/UIContext';

const FALLBACK = [
  { id:1, name:'Хатанцэцэг',  specialty_mn:'Lash мэргэжилтэн',  rating:4.9, review_count:128, avatar_emoji:'👩‍🦱', image_url:'', active:true },
  { id:2, name:'Дэлгэрцэцэг', specialty_mn:'Brow & Lash',        rating:4.8, review_count:96,  avatar_emoji:'👩‍🦰', image_url:'', active:true },
  { id:3, name:'Өнөржаргал',  specialty_mn:'Nails мэргэжилтэн',  rating:4.8, review_count:84,  avatar_emoji:'👩',   image_url:'', active:true },
  { id:4, name:'Номин',        specialty_mn:'Будалт & Wax',       rating:4.8, review_count:72,  avatar_emoji:'👩‍🦳', image_url:'', active:true },
  { id:5, name:'Анхзул',       specialty_mn:'Нүүрний засал',      rating:4.9, review_count:60,  avatar_emoji:'🧑‍🎨', image_url:'', active:true },
];

export default function Artists() {
  const { openBooking, openBookingForArtist } = useUI();
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('artists').select('*').order('id')
      .then(({ data, error }) => {
        if (error) console.error('[Artists]', error.message);
        setArtists(data?.length ? data : FALLBACK);
        setLoading(false);
      });
  }, []);

  if (loading) return null;

  return (
    <section id="artists" className="py-[70px] px-12 bg-[#FEFCF8] max-[900px]:px-5 max-[900px]:py-12 max-[640px]:px-4 max-[640px]:py-9">
      <div className="flex justify-between items-end mb-12 max-[900px]:mb-8 max-[640px]:mb-7">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[3px] text-gold mb-2">Манай баг</p>
          <h2 className="font-serif text-[36px] font-semibold tracking-tight text-dark max-[900px]:text-[28px] max-[640px]:text-2xl">
            Манай <span className="bg-gradient-to-r from-[#B8960C] to-[#C9A84C] bg-clip-text text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]">Артистууд</span>
          </h2>
        </div>
        <button onClick={openBooking}
          className="hidden md:block bg-gold-light text-gold-dark border border-gold/30 px-6 py-2.5 rounded-full text-[13px] font-semibold cursor-pointer transition-all hover:bg-gradient-to-r hover:from-[#B8960C] hover:to-[#C9A84C] hover:text-white hover:border-transparent whitespace-nowrap">
          Цаг захиалах →
        </button>
      </div>

      <div className="grid grid-cols-5 gap-5 max-[1200px]:grid-cols-3 max-[900px]:grid-cols-3 max-[900px]:gap-4 max-[640px]:grid-cols-2 max-[640px]:gap-3 max-[480px]:gap-2.5">
        {artists.map(a => (
          <div key={a.id}
            className="group bg-white rounded-2xl px-5 py-7 text-center transition-all duration-300 cursor-pointer border border-gold/10 relative hover:-translate-y-2 hover:border-gold/35 hover:shadow-[0_12px_48px_rgba(201,168,76,.18)] max-[640px]:px-3 max-[640px]:py-5 max-[480px]:px-2.5 max-[480px]:py-4"
            style={{ opacity: a.active ? 1 : 0.55 }}>

            {!a.active && (
              <div className="absolute top-3 right-3 bg-[#FFF3E0] text-[#B8860B] text-[9px] font-bold px-2 py-0.5 rounded-full tracking-[.4px] z-[1] border border-[#C9A84C]/20">
                Ажиллахгүй
              </div>
            )}

            {/* Avatar with gold ring */}
            <div className="relative w-[88px] h-[88px] mx-auto mb-4 max-[640px]:w-[70px] max-[640px]:h-[70px] max-[480px]:w-16 max-[480px]:h-16">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#B8960C] via-[#D4AF37] to-[#C9A84C] p-[2px]">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-[36px] overflow-hidden max-[640px]:text-[28px] max-[480px]:text-[24px]">
                  {a.image_url
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={a.image_url} alt={a.name} className="w-full h-full object-cover rounded-full" />
                    : (a.avatar_emoji || '👩')}
                </div>
              </div>
            </div>

            <div className="font-semibold text-[14px] text-dark mb-0.5 max-[640px]:text-[13px]">{a.name}</div>
            <div className="text-[11px] text-gray-400 mb-3 uppercase tracking-[.8px] max-[640px]:text-[10px]">{a.specialty_mn}</div>
            <div className="flex items-center justify-center gap-1 text-[12px] text-gold-dark font-semibold mb-4">
              ⭐ {Number(a.rating).toFixed(1)} <span className="text-gray-300 font-normal text-[11px]">({a.review_count})</span>
            </div>

            {a.active ? (
              <button onClick={() => openBookingForArtist(a.name)}
                className="w-full bg-gradient-to-r from-[#B8960C] via-[#D4AF37] to-[#C9A84C] text-white border-none py-2.5 rounded-full text-[12px] font-semibold cursor-pointer transition-all group-hover:shadow-[0_4px_16px_rgba(201,168,76,.40)] tracking-wide max-[640px]:py-2 max-[640px]:text-[11px]">
                Цаг захиалах
              </button>
            ) : (
              <button disabled className="w-full py-2.5 rounded-full text-[12px] font-medium cursor-not-allowed bg-gray-100 text-gray-300 border border-gray-200 max-[640px]:py-2">
                Захиалах боломжгүй
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
