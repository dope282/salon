'use client';
import { useEffect, useState } from 'react';
import { useUI } from '@/contexts/UIContext';
import { supabase } from '@/lib/supabase';

const DEFAULT_IMG =
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=700&q=85&auto=format&fit=crop';

export default function Hero() {
  const { openBooking } = useUI();
  const [heroImg, setHeroImg] = useState(DEFAULT_IMG);

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'hero_image_url')
      .single()
      .then(({ data }) => {
        if (data?.value) setHeroImg(data.value);
      });
  }, []);

  return (
    <section className="hero" id="home">
      <div className="hero-blob" />
      <div className="hero-blob" />
      <div className="hero-inner">
        <div className="hero-content fade-up">
          <div className="hero-badge">
            <span style={{ fontSize: 16, letterSpacing: 1 }}>Beauty · Trust · You</span>
          </div>
          <h1>Таны <span className="grad">Гоо Сайхны</span> Туршлагыг Дээшлүүлэе</h1>
          <p>Мэргэжлийн уран бүтээлчидтэйгээ цаг захиалж, зөвхөн танд зориулсан тансаг салоны үйлчилгээг мэдрээрэй.</p>
          <div className="hero-btns">
            <button className="btn-primary" onClick={openBooking}>Цаг захиалах &nbsp;→</button>
            <button className="btn-outline" onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}>
              Үйлчилгээ үзэх
            </button>
          </div>
          <div className="hero-stats">
            <div><span className="stat-num">2,500+</span><span className="stat-lbl">Баяртай үйлчлүүлэгч</span></div>
            <div><span className="stat-num">15+</span><span className="stat-lbl">Мэргэжлийн уран бүтээлч</span></div>
            <div><span className="stat-num">4.9★</span><span className="stat-lbl">Дундаж үнэлгээ</span></div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-img-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroImg}
              alt="Hatantsetsey lash Beauty Salon"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
          <div className="float-card float-card-1">
            <div className="fc-lbl">Дараагийн цаг</div>
            <div className="fc-val">5-р сар 15, 10:00</div>
            <div className="fc-sub">Үс будах · Алис Жонсон</div>
          </div>
          <div className="float-card float-card-2">
            <div className="fc-lbl">Үнэлгээ</div>
            <div className="fc-val">⭐ 4.9 / 5.0</div>
            <div className="fc-sub">2,500+ сэтгэгдэл</div>
          </div>
        </div>
      </div>
    </section>
  );
}
