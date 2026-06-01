'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useUI } from '@/contexts/UIContext';
import RotatingImage from '@/components/RotatingImage';

const FALLBACK = [
  { id:1, name_mn:'Lash Extension',   description_mn:'Classic, Volume, Mega Volume lash',   price_from:45000, emoji:'👁️' },
  { id:2, name_mn:'Brow Lamination',  description_mn:'Хөмсөгний засал, lamination',          price_from:35000, emoji:'✨' },
  { id:3, name_mn:'Маникюр & Гель',   description_mn:'Хумсны засал, гель, дизайн',           price_from:28000, emoji:'💅' },
  { id:4, name_mn:'Педикюр',          description_mn:'Хөлийн хумсны засал, массаж',          price_from:35000, emoji:'🦶' },
  { id:5, name_mn:'Нүүрний будалт',   description_mn:'Урлалт гоо будалт, арилжааны будалт',  price_from:70000, emoji:'💄' },
  { id:6, name_mn:'Wax үйлчилгээ',    description_mn:'Бие засах, хөмсөг, lip wax',           price_from:18000, emoji:'🌿' },
];

export default function Services() {
  const { openBooking } = useUI();
  const [services, setServices] = useState(FALLBACK);

  useEffect(() => {
    supabase.from('services').select('*').eq('active', true).order('id')
      .then(({ data }) => { if (data?.length) setServices(data); });
  }, []);

  return (
    <section id="services" className="py-[70px] px-12 bg-[#404040] max-[900px]:px-5 max-[900px]:py-12 max-[640px]:px-4 max-[640px]:py-9">
      {/* Section header */}
      <div className="flex justify-between items-end mb-12 max-[900px]:mb-8 max-[640px]:mb-7">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[3px] text-gold mb-2">Манай үйлчилгээ</p>
          <h2 className="font-serif text-[36px] font-semibold tracking-tight text-pink-200 max-[900px]:text-[28px] max-[640px]:text-2xl">
            Тансаг <span className="gold-shimmer">Гоо Сайхны</span> Үйлчилгээ
          </h2>
        </div>
        <button onClick={openBooking}
          className="hidden md:block bg-[#606060] text-[#FF3399] border border-gold/30 px-6 py-2.5 rounded-full text-[13px] font-semibold cursor-pointer transition-all hover:bg-gradient-to-r hover:from-[#FF3399] hover:to-[#FF3399] hover:text-white hover:border-transparent whitespace-nowrap">
          Бүгдийг захиалах →
        </button>
      </div>

      <div className="grid grid-cols-5 gap-4 max-[1200px]:grid-cols-4 max-[900px]:grid-cols-3 max-[900px]:gap-3.5 max-[640px]:grid-cols-3 max-[640px]:gap-2.5">
        {services.map((s) => {
          const imgs = s.images?.length ? s.images : (s.image_url ? [s.image_url] : []);
          return (
            <div key={s.id} onClick={openBooking}
              className="lux-card group bg-[#606060] rounded-2xl overflow-hidden transition-all duration-300 flex flex-col cursor-pointer hover:-translate-y-1">
              {imgs.length
                ? <RotatingImage images={imgs} alt={s.name_mn} className="w-full aspect-[4/3]" dots />
                : <div className="w-full aspect-[4/3] bg-gradient-to-br from-gold-light to-[#FFD0E6]/20 flex items-center justify-center text-[52px]">{s.emoji}</div>}
              <div className="px-3 py-3 flex-1 flex flex-col max-[640px]:px-2 max-[640px]:py-2.5">
                <div className="text-[13px] font-semibold text-pink-200 mb-1 leading-[1.3] max-[640px]:text-[11px] max-[640px]:leading-tight">{s.name_mn}</div>
                {s.description_mn && (
                  <div className="text-[11px] text-pink-200 leading-[1.5] mb-2.5 flex-1 overflow-hidden max-[640px]:hidden" style={{ display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                    {s.description_mn}
                  </div>
                )}
                <div className="flex items-center justify-between gap-2 mt-auto max-[640px]:flex-col max-[640px]:items-stretch max-[640px]:gap-1.5">
                  <span className="font-display text-[15px] font-bold text-[#FF3399] max-[640px]:text-[13px]">₮{(s.price_from ?? 0).toLocaleString()}+</span>
                  <button onClick={openBooking}
                    className="bg-gradient-to-r from-[#FF3399] to-[#FF3399] text-white border-none px-3.5 py-1.5 rounded-full text-[11px] font-bold cursor-pointer transition-all hover:shadow-[0_4px_16px_rgba(255,51,153,.40)] hover:-translate-y-0.5 max-[640px]:w-full max-[640px]:px-2 max-[640px]:py-2 max-[640px]:text-[10px]">
                    Захиалах
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 text-center md:hidden">
        <button onClick={openBooking}
          className="bg-gradient-to-r from-[#FF3399] via-[#FF66B2] to-[#FF3399] text-white border-none px-8 py-3 rounded-full text-sm font-semibold cursor-pointer shadow-[0_4px_16px_rgba(255,51,153,.35)]">
          Бүгдийг захиалах →
        </button>
      </div>
    </section>
  );
}
