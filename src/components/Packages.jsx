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
        <h2 className="font-serif text-[36px] font-semibold tracking-tight text-dark max-[900px]:text-[28px] max-[640px]:text-2xl">
          Гоо Сайхны <span className="gold-shimmer">Багц</span> Үйлчилгээ
        </h2>
      </div>
      <div className="grid grid-cols-5 gap-4 max-[1200px]:grid-cols-4 max-[900px]:grid-cols-3 max-[900px]:gap-3.5 max-[640px]:grid-cols-3 max-[640px]:gap-2.5">
        {packages.map(p => {
          const imgs = p.images?.length ? p.images : (p.image_url ? [p.image_url] : []);
          return (
            <div key={p.id} onClick={() => openBookingForPackage(p)}
              className="lux-card group bg-white rounded-2xl overflow-hidden transition-all duration-300 flex flex-col cursor-pointer hover:-translate-y-1">
              <div className="relative">
                {imgs.length
                  ? <RotatingImage images={imgs} alt={p.name} className="w-full aspect-[4/3]" dots />
                  : <div className="w-full aspect-[4/3] bg-gradient-to-br from-gold-light to-[#EDD98A]/20 flex items-center justify-center text-[52px]">{p.emoji}</div>}
                {savings(p) > 0 && (
                  <div className="absolute top-2 right-2 bg-gradient-to-r from-[#38A169] to-[#276749] text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md">
                    ₮{savings(p).toLocaleString()} хэмнэлт
                  </div>
                )}
              </div>
              <div className="px-3 py-3 flex-1 flex flex-col">
                <div className="text-[13px] font-semibold text-dark mb-1 leading-[1.3]">{p.name}</div>
                {p.description && (
                  <div className="text-[11px] text-gray-400 leading-[1.5] mb-1.5 overflow-hidden max-[640px]:hidden" style={{ display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                    {p.description}
                  </div>
                )}
                {p.services.length > 0 && (
                  <div className="text-[10px] text-gold-dark/70 mb-2.5 truncate">
                    ✓ {p.services.map(s => s.name).join(' · ')}
                  </div>
                )}
                <div className="flex items-center justify-between gap-2 mt-auto">
                  <div className="flex flex-col leading-tight">
                    {p.original_price > p.price && (
                      <span className="text-[10px] text-gray-400 line-through">₮{p.original_price.toLocaleString()}</span>
                    )}
                    <span className="font-display text-[15px] font-bold text-gold-dark max-[640px]:text-sm">₮{p.price.toLocaleString()}</span>
                  </div>
                  <button onClick={() => openBookingForPackage(p)}
                    className="bg-gradient-to-r from-[#B8960C] to-[#C9A84C] text-white border-none px-3.5 py-1.5 rounded-full text-[11px] font-bold cursor-pointer transition-all hover:shadow-[0_4px_16px_rgba(201,168,76,.40)] hover:-translate-y-0.5 max-[640px]:px-3 max-[640px]:text-[10px]">
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
