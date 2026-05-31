'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useUI }    from '@/contexts/UIContext';

export default function PackagesSection() {
  const { openBooking } = useUI();
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
      <div className="sec-header">
        
        <h2 className="sec-title">Манай <span>Багц Үйлчилгээ</span></h2>
        <button className="btn-ghost" onClick={openBooking}>Захиалах →</button>
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

            {/* Icon */}
            <div className="pkg-icon">{p.emoji}</div>

            {/* Name */}
            <div className="pkg-name">{p.name}</div>

            {/* Description */}
            {p.description && <div className="pkg-desc">{p.description}</div>}

            {/* Included services */}
            {p.services.length > 0 && (
              <div className="pkg-services">
                {p.services.map((s, i) => (
                  <div key={i} className="pkg-svc-item">
                    <span className="pkg-svc-ico">{s.emoji}</span> {s.name}
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

            <button className="btn-book pkg-btn" onClick={openBooking}>
              🎁 Багцаар захиалах
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
