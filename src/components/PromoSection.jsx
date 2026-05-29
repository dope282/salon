'use client';
import { useEffect, useState } from 'react';
import { useUI }    from '@/contexts/UIContext';
import { supabase } from '@/lib/supabase';

const DEFAULT = {
  active : true,
  mode   : 'text',
  tag    : '⚡ ОНЦГОЙ САНАЛ',
  title  : 'Анхны захиалгадаа',
  pct    : '20%',
  all    : 'Бүх үйлчилгээнд',
  btn    : 'Одоо захиалах →',
  badge  : 'ОНЦГОЙ · САНАЛ · ЗӨВХӨН · ТАНД',
  emoji  : '💇‍♀️',
  img    : '',
};

export default function PromoSection() {
  const { openBooking } = useUI();
  const [promo, setPromo] = useState(DEFAULT);

  useEffect(() => {
    supabase
      .from('site_settings').select('value').eq('key', 'promo_config').single()
      .then(({ data }) => {
        if (data?.value) {
          try { setPromo({ ...DEFAULT, ...JSON.parse(data.value) }); } catch {}
        }
      });
  }, []);

  if (!promo.active) return null;

  /* ── IMAGE mode: баннер зургаа бүтэн харуулна ── */
  if (promo.mode === 'image') {
    if (!promo.img) return null;
    return (
      <section className="promo-section">
        <div className="promo-banner" style={{ padding: 0, overflow: 'hidden', background: 'none', display: 'block' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={promo.img}
            alt="Промо баннер"
            style={{ width: '100%', height: '100%', maxHeight: 420, objectFit: 'cover', display: 'block' }}
          />
        </div>
      </section>
    );
  }

  /* ── TEXT mode: текст агуулгатай баннер ── */
  return (
    <section className="promo-section">
      <div className="promo-banner">
        <div className="promo-content">
          <div className="promo-tag">{promo.tag}</div>
          <div className="promo-title">{promo.title}</div>
          <div className="promo-pct">{promo.pct}</div>
          <div className="promo-all">{promo.all}</div>
          <button className="btn-white" onClick={openBooking}>{promo.btn}</button>
        </div>
        <div className="promo-badge-wrap">
          <div className="promo-badge">{promo.badge}</div>
        </div>
        <div className="promo-img-box">
          {promo.emoji}
        </div>
      </div>
    </section>
  );
}
