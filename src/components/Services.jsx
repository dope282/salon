'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useUI } from '@/contexts/UIContext';

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
    <section id="services" className="py-[70px] px-12 bg-white max-[900px]:px-5 max-[900px]:py-12 max-[640px]:px-4 max-[640px]:py-9">
      {/* Section header */}
      <div className="flex justify-between items-end mb-12 max-[900px]:mb-8 max-[640px]:mb-7">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[3px] text-gold mb-2">Манай үйлчилгээ</p>
          <h2 className="font-serif text-[36px] font-semibold tracking-tight text-dark max-[900px]:text-[28px] max-[640px]:text-2xl">
            Тансаг <span className="bg-gradient-to-r from-[#B8960C] to-[#C9A84C] bg-clip-text text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]">Гоо Сайхны</span> Үйлчилгээ
          </h2>
        </div>
        <button onClick={openBooking}
          className="hidden md:block bg-gold-light text-gold-dark border border-gold/30 px-6 py-2.5 rounded-full text-[13px] font-semibold cursor-pointer transition-all hover:bg-gradient-to-r hover:from-[#B8960C] hover:to-[#C9A84C] hover:text-white hover:border-transparent whitespace-nowrap">
          Бүгдийг захиалах →
        </button>
      </div>

      <div className="grid grid-cols-4 gap-5 max-[1200px]:grid-cols-2 max-[640px]:grid-cols-1 max-[640px]:gap-3 max-[380px]:grid-cols-1">
        {services.map((s) => (
          <div key={s.id} onClick={openBooking}
            className="group bg-[#FEFCF8] rounded-2xl px-6 py-6 flex items-center gap-4 transition-all duration-300 cursor-pointer border border-gold/10 hover:border-gold/40 hover:bg-gradient-to-br hover:from-[#FFFDF5] hover:to-[#FFF8E8] hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(201,168,76,.15)] max-[640px]:px-4 max-[640px]:py-4 max-[640px]:gap-3.5"
            style={{ opacity: 1 }}>
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-[26px] flex-shrink-0 bg-gradient-to-br from-gold-light to-[#EDD98A]/30 group-hover:from-gold-light group-hover:to-gold/20 transition-all max-[640px]:w-12 max-[640px]:h-12 max-[640px]:text-xl border border-gold/15">
              {s.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[14px] text-dark mb-0.5 group-hover:text-dark truncate">{s.name_mn}</div>
              <div className="text-xs text-gray-400 mb-2 leading-[1.4] line-clamp-1">{s.description_mn}</div>
              <div className="text-[13px] font-bold text-gold-dark">₮{s.price_from?.toLocaleString()}+</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center md:hidden">
        <button onClick={openBooking}
          className="bg-gradient-to-r from-[#B8960C] via-[#D4AF37] to-[#C9A84C] text-white border-none px-8 py-3 rounded-full text-sm font-semibold cursor-pointer shadow-[0_4px_16px_rgba(201,168,76,.35)]">
          Бүгдийг захиалах →
        </button>
      </div>
    </section>
  );
}
