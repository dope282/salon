'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useUI }    from '@/contexts/UIContext';

export default function PackagesSection() {
  const { openBookingForPackage } = useUI();
  const [packages, setPackages] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('packages').select('*').eq('active', true).order('sort_order').order('id'),
      supabase.from('package_services').select('package_id, service_id, services(name_mn, emoji)'),
    ]).then(([{ data: pkgData }, { data: psData }]) => {
      const svcMap = {};
      (psData || []).forEach(ps => {
        if (!svcMap[ps.package_id]) svcMap[ps.package_id] = [];
        if (ps.services) svcMap[ps.package_id].push({ name: ps.services.name_mn, emoji: ps.services.emoji });
      });
      setPackages((pkgData || []).map(p => ({ ...p, services: svcMap[p.id] || [] })));
      setLoading(false);
    });
  }, []);

  if (loading || packages.length === 0) return null;

  const savings = (p) => p.original_price > p.price ? p.original_price - p.price : 0;

  return (
    <section className="packages-section" id="packages">
      <div className="mb-12 max-[900px]:mb-8 max-[640px]:mb-7">
        <p className="text-[11px] font-bold uppercase tracking-[3px] text-gold mb-2">Манай үйлчилгээ</p>
        <h2 className="font-serif text-[36px] font-semibold tracking-tight text-dark max-[900px]:text-[28px] max-[640px]:text-2xl">
          Гоо Сайхны <span className="gold-shimmer">Багц</span> Үйлчилгээ
        </h2>
      </div>
      <div className="packages-grid">
        {packages.map(p => (
          <div key={p.id} className="pkg-card">
            {/* Savings badge */}
            {savings(p) > 0 && (
              <div className="pkg-badge">
                ₮{savings(p).toLocaleString()} хэмнэлт
              </div>
            )}

            {/* Icon / image */}
            <div className="pkg-icon">
              {p.image_url
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={p.image_url} alt={p.name} style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover' }} />
                : p.emoji}
            </div>

            {/* Name */}
            <div className="pkg-name">{p.name}</div>

            {/* Description */}
            {p.description && <div className="pkg-desc">{p.description}</div>}

            {/* Included services */}
            {p.services.length > 0 && (
              <div className="pkg-services">
                {p.services.map((s, i) => (
                  <div key={i} className="pkg-svc-item">
                    <span className="pkg-svc-ico" style={{ color: 'var(--gold)' }}>✓</span> {s.name}
                  </div>
                ))}
              </div>
            )}

            {/* Price */}
            <div className="pkg-footer">
              <div className="pkg-price-wrap">
                {p.original_price > p.price && (
                  <span className="pkg-orig-price">₮{p.original_price.toLocaleString()}</span>
                )}
                <span className="pkg-price">₮{p.price.toLocaleString()}</span>
              </div>
              {p.duration_min > 0 && (
                <span className="pkg-duration">⏱ {p.duration_min} мин</span>
              )}
            </div>

            <button onClick={() => openBookingForPackage(p)}
              className="btn-shine w-full mt-1 bg-gradient-to-r from-[#B8960C] via-[#D4AF37] to-[#C9A84C] text-white border-none py-2.5 rounded-full text-[13px] font-bold cursor-pointer transition-all shadow-[0_4px_16px_rgba(201,168,76,.35)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(201,168,76,.55)] tracking-wide">
              🎁 Багцаар захиалах
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
