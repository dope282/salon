'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useUI }    from '@/contexts/UIContext';
import RotatingImage from '@/components/RotatingImage';

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
        <h2 className="font-serif text-[36px] font-semibold tracking-tight text-pink-200 max-[900px]:text-[28px] max-[640px]:text-2xl">
          Гоо Сайхны <span className="gold-shimmer">Багц</span> Үйлчилгээ
        </h2>
      </div>
      <div className="grid grid-cols-5 gap-4 max-[1200px]:grid-cols-4 max-[900px]:grid-cols-3 max-[900px]:gap-3.5 max-[640px]:grid-cols-3 max-[640px]:gap-2.5">
        {packages.map(p => {
          const imgs = p.images?.length ? p.images : (p.image_url ? [p.image_url] : []);
          return (
            <div key={p.id} onClick={() => openBookingForPackage(p)}
              className="lux-card group bg-[#404040] rounded-2xl overflow-hidden transition-all duration-300 flex flex-col cursor-pointer hover:-translate-y-1">
              <div className="relative">
                {imgs.length
                  ? <RotatingImage images={imgs} alt={p.name} className="w-full aspect-[4/3]" dots />
                  : <div className="w-full aspect-[4/3] bg-gradient-to-br from-gold-light to-[#FFD0E6]/20 flex items-center justify-center text-[52px]">{p.emoji}</div>}
                {savings(p) > 0 && (
                  <div className="absolute top-2 right-2 bg-gradient-to-r from-[#38A169] to-[#276749] text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md">
                    ₮{savings(p).toLocaleString()} хэмнэлт
                  </div>
                )}
              </div>
              <div className="px-3 py-3 flex-1 flex flex-col max-[640px]:px-2 max-[640px]:py-2.5">
                <div className="text-[13px] font-semibold text-pink-200 mb-1 leading-[1.3] max-[640px]:text-[11px] max-[640px]:leading-tight">{p.name}</div>
                {p.description && (
                  <div className="text-[11px] text-pink-200 leading-[1.5] mb-1.5 overflow-hidden max-[640px]:hidden" style={{ display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                    {p.description}
                  </div>
                )}
                {p.services.length > 0 && (
                  <div className="text-[10px] text-[#FF3399]/70 mb-2.5 truncate max-[640px]:hidden">
                    ✓ {p.services.map(s => s.name).join(' · ')}
                  </div>
                )}
                <div className="flex items-center justify-between gap-2 mt-auto max-[640px]:flex-col max-[640px]:items-stretch max-[640px]:gap-1.5">
                  <div className="flex flex-col leading-tight max-[640px]:flex-row max-[640px]:items-baseline max-[640px]:gap-1.5">
                    {p.original_price > p.price && (
                      <span className="text-[10px] text-pink-400 line-through">₮{p.original_price.toLocaleString()}</span>
                    )}
                    <span className="font-display text-[15px] font-bold text-[#FF3399] max-[640px]:text-[13px]">₮{p.price.toLocaleString()}</span>
                  </div>
                  <button onClick={() => openBookingForPackage(p)}
                    className="bg-gradient-to-r from-[#FF3399] to-[#FF3399] text-white border-none px-3.5 py-1.5 rounded-full text-[11px] font-bold cursor-pointer transition-all hover:shadow-[0_4px_16px_rgba(255,51,153,.40)] hover:-translate-y-0.5 max-[640px]:w-full max-[640px]:px-2 max-[640px]:py-2 max-[640px]:text-[10px]">
                    Захиалах
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
