'use client';
import { useEffect, useState } from 'react';
import { useUI } from '@/contexts/UIContext';
import { supabase } from '@/lib/supabase';

const DEFAULT_IMG = 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=700&q=85&auto=format&fit=crop';
const TIMES_DEFAULT = ['09:00','10:00','11:00','12:00','13:00','14:00','16:00','17:00'];

const generateSlots = (start, end, stepMin = 60) => {
  const slots = [];
  let [h, m] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  while (h * 60 + m < eh * 60 + em) {
    slots.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
    m += stepMin; h += Math.floor(m / 60); m %= 60;
  }
  return slots;
};

// Хамгийн ойр сул цагийг бүх артистаас тооцоолох (14 хоногийн дотор)
const findNearestSlot = (artists, schedMap, booked) => {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  for (let off = 0; off < 14; off++) {
    const d = new Date(now); d.setDate(now.getDate() + off);
    const dow = d.getDay();
    const ds  = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const isToday = off === 0;
    let best = null; // { time, artist }
    for (const a of artists) {
      const sched = schedMap[a.id]?.find(s => s.day_of_week === dow);
      if (sched && !sched.is_active) continue;
      const slots = sched ? generateSlots(sched.start_time, sched.end_time, 60) : TIMES_DEFAULT;
      for (const t of slots) {
        const [h, mn] = t.split(':').map(Number);
        if (isToday && h * 60 + mn <= nowMins) continue;
        if (booked[`${a.name}|${ds}`]?.has(t)) continue;
        if (!best || t < best.time) best = { time: t, artist: a.name };
      }
    }
    if (best) return { date: d, time: best.time, artist: best.artist };
  }
  return null;
};

export default function Hero() {
  const { openBooking } = useUI();
  const [heroImg, setHeroImg] = useState(DEFAULT_IMG);
  const [nextSlot, setNextSlot] = useState(null);

  useEffect(() => {
    supabase.from('site_settings').select('value').eq('key', 'hero_image_url').single()
      .then(({ data }) => { if (data?.value) setHeroImg(data.value); });

    // Хамгийн ойр сул цаг
    (async () => {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
      const maxDay = new Date(today); maxDay.setDate(today.getDate() + 14);
      const maxStr = `${maxDay.getFullYear()}-${String(maxDay.getMonth()+1).padStart(2,'0')}-${String(maxDay.getDate()).padStart(2,'0')}`;

      const [{ data: aData }, { data: schedData }, { data: bkData }] = await Promise.all([
        supabase.from('artists').select('id, name').eq('active', true).order('id'),
        supabase.from('artist_schedules').select('*'),
        supabase.from('bookings').select('artist_name, booking_date, booking_time')
          .neq('status', 'cancelled').gte('booking_date', todayStr).lte('booking_date', maxStr),
      ]);
      if (!aData?.length) return;

      const schedMap = {};
      (schedData || []).forEach(r => { if (!schedMap[r.artist_id]) schedMap[r.artist_id] = []; schedMap[r.artist_id].push(r); });
      const booked = {};
      (bkData || []).forEach(b => { const k = `${b.artist_name}|${b.booking_date}`; if (!booked[k]) booked[k] = new Set(); booked[k].add(b.booking_time); });

      setNextSlot(findNearestSlot(aData, schedMap, booked));
    })();
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

      <div className="flex items-center gap-[72px] max-w-[1240px] w-full relative z-[2] max-[900px]:flex-col max-[900px]:text-center max-[900px]:gap-9">

        {/* Content */}
        <div className="flex-none w-[min(520px,48%)] relative fade-up max-[900px]:w-full">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-gold-light border border-gold/30 text-gold-dark px-5 py-2 rounded-full text-[11px] font-bold tracking-[2.5px] uppercase mb-7 max-[640px]:mb-5">
            <span className="hero-badge-dot w-2 h-2 rounded-full bg-gold flex-shrink-0" />
            LASH · BROW LAMI · NAIL · WAX · PIERCING
          </div>

          <h1 className="font-serif text-[clamp(38px,4vw,64px)] font-semibold leading-[1.08] mb-5 tracking-tight text-dark max-[900px]:text-[clamp(32px,7vw,50px)] max-[640px]:text-[clamp(28px,8.5vw,42px)]">
            Таны{' '}
            <span className="relative inline-block">
              <span className="gold-shimmer">Гоо Сайхны</span>
              <span className="absolute -bottom-1 left-0 right-0 h-[1px] bg-gradient-to-r from-[#B8960C] via-[#D4AF37] to-transparent" />
            </span>{' '}
            Туршлагыг Дээшлүүлэе
          </h1>

          <p className="text-[16px] text-gray-500 leading-[1.8] mb-9 max-w-[440px] max-[900px]:mx-auto max-[900px]:mb-7 max-[640px]:text-sm max-[640px]:mb-6">
            Мэргэжлийн уран бүтээлчидтэйгээ цаг захиалж, зөвхөн танд зориулсан тансаг салоны үйлчилгээг мэдрээрэй.
          </p>

          <div className="flex gap-4 mb-12 flex-wrap max-[900px]:justify-center max-[640px]:flex-nowrap max-[640px]:gap-2.5 max-[640px]:mb-8">
            <button onClick={openBooking}
              className="btn-shine bg-gradient-to-r from-[#B8960C] via-[#D4AF37] to-[#C9A84C] text-white border-none px-8 py-3.5 rounded-full text-sm font-semibold cursor-pointer transition-all shadow-[0_6px_24px_rgba(201,168,76,.45)] hover:-translate-y-0.5 hover:shadow-[0_10px_36px_rgba(201,168,76,.60)] tracking-wide whitespace-nowrap max-[640px]:flex-1 max-[640px]:px-4 max-[640px]:min-h-[50px]">
              Цаг захиалах →
            </button>
            <button onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-transparent text-dark border border-dark/20 px-7 py-3.5 rounded-full text-sm font-medium cursor-pointer transition-all hover:border-gold hover:text-gold-dark tracking-wide whitespace-nowrap max-[640px]:flex-1 max-[640px]:px-4 max-[640px]:min-h-[50px]">
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
          <div onClick={openBooking}
            className="float-card-1 absolute bottom-11 left-[-20px] bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-3.5 shadow-[0_8px_32px_rgba(0,0,0,.12)] whitespace-nowrap z-[3] border border-gold/15 cursor-pointer hover:shadow-[0_12px_40px_rgba(201,168,76,.25)] hover:border-gold/40 transition-all max-[900px]:left-1 max-[900px]:bottom-3 max-[640px]:left-[-4px] max-[640px]:bottom-2 max-[640px]:px-3 max-[640px]:py-2">
            <div className="text-[10px] text-gray-400 mb-0.5 uppercase tracking-[1px] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              Хамгийн ойр сул цаг
            </div>
            {nextSlot ? (
              <>
                <div className="text-[15px] font-bold text-dark max-[640px]:text-[13px]">{nextSlot.date.getMonth()+1}-р сар {nextSlot.date.getDate()}, {nextSlot.time}</div>
                <div className="text-[11px] text-gold-dark mt-0.5 font-medium">Сул байна · {nextSlot.artist}</div>
              </>
            ) : (
              <>
                <div className="text-[15px] font-bold text-dark max-[640px]:text-[13px]">Цаг захиалах</div>
                <div className="text-[11px] text-gold-dark mt-0.5 font-medium">Боломжтой цагаа сонгоно уу</div>
              </>
            )}
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
