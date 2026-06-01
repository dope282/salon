'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import RotatingImage from '@/components/RotatingImage';

export default function Trainings() {
  const [trainings, setTrainings] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState(null);

  useEffect(() => {
    supabase.from('trainings').select('*').eq('active', true).order('sort_order').order('id')
      .then(({ data }) => { setTrainings(data || []); setLoading(false); });
  }, []);

  if (!loading && trainings.length === 0) return null;

  return (
    <section id="trainings" className="py-[70px] px-12 bg-[#606060] max-[900px]:px-5 max-[900px]:py-12 max-[640px]:px-4 max-[640px]:py-9">
      {/* Header */}
      <div className="flex justify-between items-end mb-12 max-[640px]:mb-7">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[3px] text-gold mb-2">Мэргэжлийн сургалт</p>
          <h2 className="font-serif text-[36px] font-semibold tracking-tight text-pink-200 max-[900px]:text-[28px] max-[640px]:text-2xl">
            Манай <span className="gold-shimmer">Сургалтууд</span>
          </h2>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-pink-200">
          <div className="text-4xl mb-3">🎓</div>
          <div className="text-sm">Ачааллаж байна...</div>
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-4 max-[1200px]:grid-cols-4 max-[900px]:grid-cols-3 max-[900px]:gap-3.5 max-[640px]:grid-cols-3 max-[640px]:gap-2.5">
          {trainings.map(t => {
            const imgs = t.images?.length ? t.images : (t.image_url ? [t.image_url] : []);
            return (
              <div key={t.id} onClick={() => setSelected(t)}
                className="lux-card group bg-[#404040] rounded-2xl overflow-hidden transition-all duration-300 flex flex-col cursor-pointer hover:-translate-y-1">
                <div className="relative">
                  {imgs.length
                    ? <RotatingImage images={imgs} alt={t.title} className="w-full aspect-[4/3]" dots />
                    : <div className="w-full aspect-[4/3] bg-gradient-to-br from-gold-light to-[#FFD0E6]/20 flex items-center justify-center text-[52px]">🎓</div>}
                  {t.level && (
                    <span className="absolute top-2 left-2 bg-gold/90 text-white px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide shadow">
                      {t.level}
                    </span>
                  )}
                </div>
                <div className="px-3 py-3 flex-1 flex flex-col max-[640px]:px-2 max-[640px]:py-2.5">
                  <div className="text-[13px] font-semibold text-pink-200 mb-1 leading-[1.3] max-[640px]:text-[11px] max-[640px]:leading-tight">{t.title}</div>
                  {t.description && (
                    <div className="text-[11px] text-pink-200 leading-[1.5] mb-1.5 overflow-hidden max-[640px]:hidden" style={{ display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                      {t.description}
                    </div>
                  )}
                  {(t.duration || t.schedule) && (
                    <div className="text-[10px] text-pink-400 mb-2.5 truncate max-[640px]:hidden">
                      {[t.duration && `⏱ ${t.duration}`, t.schedule && `📅 ${t.schedule}`].filter(Boolean).join(' · ')}
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2 mt-auto max-[640px]:flex-col max-[640px]:items-stretch max-[640px]:gap-1.5">
                    {t.price > 0
                      ? <span className="font-display text-[15px] font-bold text-[#FF3399] max-[640px]:text-[13px]">₮{t.price.toLocaleString()}</span>
                      : <span className="text-[11px] text-pink-400 max-[640px]:text-[10px]">Үнэ тохиролцоно</span>}
                    <button onClick={e => { e.stopPropagation(); setSelected(t); }}
                      className="bg-gradient-to-r from-[#FF3399] to-[#FF3399] text-white border-none px-3.5 py-1.5 rounded-full text-[11px] font-bold cursor-pointer transition-all hover:shadow-[0_4px_16px_rgba(255,51,153,.40)] hover:-translate-y-0.5 max-[640px]:w-full max-[640px]:px-2 max-[640px]:py-2 max-[640px]:text-[10px]">
                      Дэлгэрэнгүй
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="overlay active" onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div className="modal modal-sheet bg-[#606060] rounded-[28px] w-full max-w-[640px] max-h-[90vh] overflow-y-auto relative border border-gold/15 shadow-[0_32px_80px_rgba(0,0,0,.18)]" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#FF3399] via-[#FF66B2] to-[#FF3399] rounded-t-[28px]" />
            <button onClick={() => setSelected(null)}
              className="absolute top-5 right-5 w-9 h-9 rounded-full border border-gold/20 bg-gold/8 cursor-pointer text-base text-pink-200/40 flex items-center justify-center hover:bg-gold/20 z-10">
              ✕
            </button>

            {(() => {
              const imgs = selected.images?.length ? selected.images : (selected.image_url ? [selected.image_url] : []);
              return imgs.length ? <RotatingImage images={imgs} alt={selected.title} className="w-full aspect-[16/7]" dots interval={4000} /> : null;
            })()}

            <div className="p-8 max-[640px]:p-5">
              {selected.level && (
                <span className="inline-block bg-gold/10 text-[#FF3399] border border-gold/20 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide mb-3">
                  {selected.level}
                </span>
              )}
              <h2 className="font-serif text-[26px] font-semibold text-pink-200 mb-4 max-[640px]:text-[22px]">{selected.title}</h2>

              {/* Мэдээллийн хэсэг */}
              <div className="grid grid-cols-2 gap-3 mb-6 max-[480px]:grid-cols-1">
                {[
                  selected.price > 0    && { ico:'💰', lbl:'Үнэ',      val: `₮${selected.price.toLocaleString()}` },
                  selected.duration     && { ico:'⏱',  lbl:'Хугацаа',  val: selected.duration },
                  selected.schedule     && { ico:'📅',  lbl:'Хуваарь',  val: selected.schedule },
                  selected.level        && { ico:'📊',  lbl:'Түвшин',   val: selected.level },
                ].filter(Boolean).map(({ ico, lbl, val }) => (
                  <div key={lbl} className="flex items-center gap-3 bg-gold-light/40 border border-gold/15 rounded-xl px-3 py-2.5">
                    <span className="text-lg">{ico}</span>
                    <div>
                      <div className="text-[10px] text-pink-400 uppercase tracking-wide">{lbl}</div>
                      <div className="text-[13px] font-semibold text-pink-200">{val}</div>
                    </div>
                  </div>
                ))}
              </div>

              {selected.description && (
                <div className="text-[14px] text-pink-300 leading-[1.85] mb-6 whitespace-pre-wrap">{selected.description}</div>
              )}

              <a href="#contact" onClick={() => setSelected(null)}
                className="btn-shine block w-full bg-gradient-to-r from-[#FF3399] via-[#FF66B2] to-[#FF3399] text-white text-center border-none py-3.5 rounded-full text-[14px] font-bold cursor-pointer transition-all shadow-[0_4px_18px_rgba(255,51,153,.40)] hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(255,51,153,.55)] no-underline">
                Бүртгүүлэх / Холбоо барих
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
