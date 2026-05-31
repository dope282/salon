'use client';
import { useEffect, useState } from 'react';
import { useUI } from '@/contexts/UIContext';
import { supabase } from '@/lib/supabase';

const DEFAULT_IMG = 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=700&q=85&auto=format&fit=crop';

export default function Hero() {
  const { openBooking } = useUI();
  const [heroImg, setHeroImg] = useState(DEFAULT_IMG);

  useEffect(() => {
    supabase.from('site_settings').select('value').eq('key', 'hero_image_url').single()
      .then(({ data }) => { if (data?.value) setHeroImg(data.value); });
  }, []);

  return (
    <section id="home" className="min-h-screen flex items-center justify-center px-12 pt-[100px] pb-[60px] relative overflow-hidden bg-[#FFFAF5] max-[900px]:px-5 max-[900px]:pt-20 max-[640px]:px-4 max-[640px]:pt-[68px] max-[640px]:pb-9">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-200px] right-[-80px] w-[680px] h-[680px] rounded-full hero-blob" style={{background:'linear-gradient(135deg,rgba(201,168,76,.10),rgba(184,150,12,.05))'}} />
        <div className="absolute bottom-[-80px] left-[140px] w-[300px] h-[300px] rounded-full hero-blob" style={{background:'linear-gradient(135deg,rgba(201,168,76,.08),rgba(245,230,200,.12))'}} />
        {/* Elegant grid lines */}
        <div className="absolute inset-0" style={{backgroundImage:'radial-gradient(ellipse at 1px 1px,rgba(201,168,76,.04) 1px,transparent 0)',backgroundSize:'28px 28px'}} />
      </div>

      <div className="flex items-center gap-[72px] max-w-[1240px] w-full relative z-[2] max-[900px]:flex-col-reverse max-[900px]:text-center max-[900px]:gap-7">

        {/* Content */}
        <div className="flex-none w-[min(520px,48%)] relative fade-up max-[900px]:w-full">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-gold-light border border-gold/30 text-gold-dark px-5 py-2 rounded-full text-[11px] font-bold tracking-[2.5px] uppercase mb-7 max-[640px]:mb-5">
            <span className="hero-badge-dot w-2 h-2 rounded-full bg-gold flex-shrink-0" />
            LASH · BROW LAMI · NAIL · WAX
          </div>

          <h1 className="font-serif text-[clamp(38px,4vw,64px)] font-semibold leading-[1.08] mb-5 tracking-tight text-dark max-[900px]:text-[clamp(32px,7vw,50px)] max-[640px]:text-[clamp(28px,8.5vw,42px)]">
            Таны{' '}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-[#B8960C] via-[#D4AF37] to-[#C9A84C] bg-clip-text text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]">Гоо Сайхны</span>
              <span className="absolute -bottom-1 left-0 right-0 h-[1px] bg-gradient-to-r from-[#B8960C] via-[#D4AF37] to-transparent" />
            </span>{' '}
            Туршлагыг Дээшлүүлэе
          </h1>

          <p className="text-[16px] text-gray-500 leading-[1.8] mb-9 max-w-[440px] max-[900px]:mx-auto max-[900px]:mb-7 max-[640px]:text-sm max-[640px]:mb-6">
            Мэргэжлийн уран бүтээлчидтэйгээ цаг захиалж, зөвхөн танд зориулсан тансаг салоны үйлчилгээг мэдрээрэй.
          </p>

          <div className="flex gap-4 mb-12 flex-wrap max-[900px]:justify-center max-[640px]:flex-col max-[640px]:items-center max-[640px]:gap-2.5 max-[640px]:mb-8">
            <button onClick={openBooking}
              className="bg-gradient-to-r from-[#B8960C] via-[#D4AF37] to-[#C9A84C] text-white border-none px-8 py-3.5 rounded-full text-sm font-semibold cursor-pointer transition-all shadow-[0_6px_24px_rgba(201,168,76,.45)] hover:-translate-y-0.5 hover:shadow-[0_10px_36px_rgba(201,168,76,.60)] tracking-wide max-[640px]:w-full max-[640px]:max-w-[300px] max-[640px]:min-h-[50px]">
              Цаг захиалах →
            </button>
            <button onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-transparent text-dark border border-dark/20 px-7 py-3.5 rounded-full text-sm font-medium cursor-pointer transition-all hover:border-gold hover:text-gold-dark tracking-wide max-[640px]:w-full max-[640px]:max-w-[300px] max-[640px]:min-h-[50px]">
              Үйлчилгээ үзэх
            </button>
          </div>

          {/* Stats */}
          <div className="flex gap-10 flex-wrap max-[900px]:justify-center max-[900px]:gap-6 max-[640px]:justify-around max-[640px]:gap-4">
            {[['2,500+','Баяртай үйлчлүүлэгч'],['15+','Мэргэжлийн уран бүтээлч'],['4.9★','Дундаж үнэлгээ']].map(([n,l]) => (
              <div key={l} className="relative">
                <span className="font-display text-[28px] font-bold block text-dark mb-0.5 max-[640px]:text-[22px]">{n}</span>
                <span className="text-[11px] text-gray-500 uppercase tracking-[1px]">{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Visual */}
        <div className="flex-1 flex justify-center items-center relative min-w-0">
          <div className="hero-img-wrap relative w-[clamp(340px,32vw,460px)] h-[clamp(420px,40vw,560px)] rounded-[32px] overflow-hidden shadow-[0_20px_80px_rgba(201,168,76,.20),0_8px_40px_rgba(0,0,0,.12)] bg-gold-light flex items-center justify-center flex-shrink-0 border border-gold/20 max-[900px]:w-[clamp(260px,52vw,340px)] max-[900px]:h-[clamp(310px,62vw,420px)] max-[640px]:w-[min(78vw,280px)] max-[640px]:h-[min(93vw,340px)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroImg} alt="Hatantsetsey lash Beauty Salon" className="absolute inset-0 w-full h-full object-cover block" />
            {/* Gold overlay at bottom */}
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[rgba(26,26,46,.4)] to-transparent z-[1]" />
          </div>

          {/* Float cards */}
          <div className="float-card-1 absolute bottom-11 left-[-20px] bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-3.5 shadow-[0_8px_32px_rgba(0,0,0,.12)] whitespace-nowrap z-[3] border border-gold/15 max-[900px]:left-1 max-[900px]:bottom-3 max-[640px]:left-[-4px] max-[640px]:bottom-2 max-[640px]:px-3 max-[640px]:py-2">
            <div className="text-[10px] text-gray-400 mb-0.5 uppercase tracking-[1px]">Дараагийн цаг</div>
            <div className="text-[15px] font-bold text-dark max-[640px]:text-[13px]">5-р сар 15, 10:00</div>
            <div className="text-[11px] text-gold-dark mt-0.5 font-medium">Үс будах · Алис Жонсон</div>
          </div>

          <div className="float-card-2 absolute top-11 right-[-20px] bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-3.5 shadow-[0_8px_32px_rgba(0,0,0,.12)] whitespace-nowrap z-[3] border border-gold/15 max-[900px]:right-1 max-[900px]:top-3 max-[640px]:right-[-4px] max-[640px]:top-2 max-[640px]:px-3 max-[640px]:py-2">
            <div className="text-[10px] text-gray-400 mb-0.5 uppercase tracking-[1px]">Үнэлгээ</div>
            <div className="text-[15px] font-bold text-dark max-[640px]:text-[13px]">⭐ 4.9 / 5.0</div>
            <div className="text-[11px] text-gold-dark mt-0.5 font-medium">2,500+ сэтгэгдэл</div>
          </div>
        </div>
      </div>
    </section>
  );
}
