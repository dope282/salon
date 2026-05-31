'use client';
import { useEffect, useState } from 'react';
import { useUI }    from '@/contexts/UIContext';
import { supabase } from '@/lib/supabase';

const DEFAULT = {
  active: true, mode: 'text', _loaded: false,
  tag: '⚡ ОНЦГОЙ САНАЛ', title: 'Анхны захиалгадаа',
  pct: '20%', all: 'Бүх үйлчилгээнд', btn: 'Одоо захиалах →',
  badge: 'ОНЦГОЙ · САНАЛ · ЗӨВХӨН · ТАНД', emoji: '💇‍♀️', img: '',
};

export default function PromoSection() {
  const { openBooking } = useUI();
  const [promo, setPromo] = useState(DEFAULT);

  useEffect(() => {
    supabase.from('site_settings').select('value').eq('key', 'promo_config').single()
      .then(({ data }) => {
        if (data?.value) { try { setPromo({ ...DEFAULT, ...JSON.parse(data.value), _loaded: true }); } catch {} }
        else { setPromo(p => ({ ...p, _loaded: true })); }
      });
  }, []);

  if (promo._loaded && !promo.active) return null;

  if (promo.mode === 'image') {
    if (!promo.img) return null;
    return (
      <section className="py-12 px-12 max-[900px]:px-5 max-[640px]:py-5 max-[640px]:px-4">
        <div className="rounded-[28px] overflow-hidden border border-gold/20 shadow-[0_8px_40px_rgba(201,168,76,.12)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={promo.img} alt="Промо баннер" className="w-full max-h-[420px] object-cover block" />
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 px-12 max-[900px]:py-8 max-[900px]:px-5 max-[640px]:py-5 max-[640px]:px-4">
      <div className="relative overflow-hidden rounded-[28px] bg-dark border border-gold/15 shadow-[0_16px_64px_rgba(0,0,0,.25)]">
        {/* Gold shimmer overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{background:'radial-gradient(ellipse at 20% 50%,rgba(201,168,76,.12),transparent 60%),radial-gradient(ellipse at 80% 20%,rgba(212,175,55,.08),transparent 50%)'}} />
        {/* Subtle grid */}
        <div className="absolute inset-0 pointer-events-none opacity-20" style={{backgroundImage:'radial-gradient(ellipse at 1px 1px,rgba(201,168,76,.15) 1px,transparent 0)',backgroundSize:'24px 24px'}} />

        <div className="relative z-[2] flex items-center justify-between gap-8 px-16 py-14 max-[900px]:px-8 max-[900px]:py-10 max-[640px]:flex-col max-[640px]:px-6 max-[640px]:py-8 max-[640px]:text-center max-[640px]:gap-5">
          <div className="flex-1">
            <div className="inline-block bg-gold/15 text-gold border border-gold/25 px-4 py-1.5 rounded-full text-[10px] font-bold tracking-[2.5px] uppercase mb-4">
              {promo.tag}
            </div>
            <div className="font-display text-[38px] font-bold text-white leading-[1.1] mb-2 max-[900px]:text-[30px] max-[640px]:text-[22px]">
              {promo.title}
            </div>
            <div className="font-display text-[80px] font-black leading-none mb-2 max-[900px]:text-[64px] max-[640px]:text-[52px]"
              style={{background:'linear-gradient(135deg,#D4AF37,#F0C060,#D4AF37)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>
              {promo.pct}
            </div>
            <div className="font-display text-[22px] text-white/60 italic mb-8 max-[900px]:text-[18px] max-[640px]:text-base max-[640px]:mb-6">
              {promo.all}
            </div>
            <button onClick={openBooking}
              className="bg-gradient-to-r from-[#B8960C] via-[#D4AF37] to-[#C9A84C] text-dark border-none px-9 py-3.5 rounded-full text-[14px] font-bold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(201,168,76,.50)] tracking-wide max-[640px]:px-7 max-[640px]:text-sm">
              {promo.btn}
            </button>
          </div>

          <div className="relative z-[2] flex-shrink-0 max-[640px]:hidden">
            <div className="promo-badge-spin w-[100px] h-[100px] rounded-full border-2 border-gold/30 flex flex-col items-center justify-center text-[9px] font-extrabold text-center leading-[1.5] tracking-[.5px] text-gold bg-gold/10">
              {promo.badge}
            </div>
          </div>

          <div className="w-[240px] h-[220px] rounded-2xl bg-white/5 border border-gold/15 flex items-center justify-center text-[80px] relative z-[2] flex-shrink-0 max-[900px]:w-[180px] max-[900px]:h-[160px] max-[900px]:text-[60px] max-[640px]:hidden">
            {promo.emoji}
          </div>
        </div>
      </div>
    </section>
  );
}
