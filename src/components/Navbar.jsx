'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useUI }   from '@/contexts/UIContext';

export default function Navbar() {
  const { user, signOut, isAdmin } = useAuth();
  const { openBooking, openAuth, openMyBookings }  = useUI();
  const [scrolled, setScrolled] = useState(false);
  const [mobOpen, setMobOpen]   = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      if (window.scrollY > 80) setMobOpen(false);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    setMobOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    else window.location.href = `/#${id}`;
  };
  const handleLogout = async () => { await signOut(); setMobOpen(false); };

  const GoldBtn = ({ children, onClick, className = '' }) => (
    <button onClick={onClick}
      className={`btn-shine bg-gradient-to-r from-[#FF3399] via-[#FF3399] to-[#FF3399] text-pink-50 border-none px-6 py-2.5 rounded-full text-sm font-semibold cursor-pointer transition-all shadow-[0_4px_16px_rgba(255,51,153,.35)] hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(255,51,153,.55)] disabled:opacity-60 tracking-wide ${className}`}>
      {children}
    </button>
  );

  const OutlineBtn = ({ children, onClick, className = '' }) => (
    <button onClick={onClick}
      className={`bg-transparent text-pink-100 border border-pink-200 px-5 py-2.5 rounded-full text-sm font-medium cursor-pointer transition-all hover:border-gold hover:text-[#FF3399] tracking-wide ${className}`}>
      {children}
    </button>
  );

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-[1000] px-12 py-4 flex items-center justify-between transition-all duration-300 max-[900px]:px-5 max-[640px]:px-4 max-[640px]:py-3 ${scrolled ? 'bg-pink-300 backdrop-blur-2xl shadow-[0_2px_20px_rgba(255,51,153,.18)] border-b border-gold/15' : 'bg-pink-300 backdrop-blur-xl'}`}>

        <div className="flex-shrink-0">
          <Image src="/logo.png" alt="Hatantsetsey lash Beauty Salon" width={130} height={52} className="h-[52px] w-auto max-[640px]:h-10" priority />
        </div>

        {/* Desktop links */}
        <ul className="hidden lg:flex list-none gap-9 max-[1100px]:gap-6">
          {[['home','НҮҮР'],['services','Үйлчилгээ'],['packages','Багц'],['products','Бүтээгдэхүүн'],['artists','Артистууд'],['trainings','Сургалт'],['about','Бидний тухай'],['contact','Холбоо барих']].map(([id,label]) => (
            <li key={id}>
              <a href={`#${id}`} className="nav-link text-[13px] font-medium text-pink-200 hover:text-[#FF3399] tracking-wide"
                onClick={e => { e.preventDefault(); scrollTo(id); }}>
                {label}
              </a>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="hidden lg:flex items-center gap-2">
              <OutlineBtn onClick={openMyBookings}>📅 Захиалгууд</OutlineBtn>
              <div className="flex items-center gap-2 bg-gold-light/60 border border-gold/25 rounded-full py-1.5 pl-2 pr-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FF3399] to-[#FF66B2] text-white text-xs font-bold flex items-center justify-center shadow-sm">
                  {(user.user_metadata?.full_name || user.email)[0].toUpperCase()}
                </div>
                <span className="text-xs font-medium text-pink-700 max-w-[110px] truncate">
                  {user.user_metadata?.full_name || user.email}
                </span>
                {isAdmin && <a href="/admin" className="text-[10px] text-[#FF3399] font-bold no-underline uppercase tracking-wider">Admin</a>}
                <button className="border-none bg-none text-pink-400 text-[11px] cursor-pointer hover:text-salon-red transition-colors ml-0.5" onClick={handleLogout}>✕</button>
              </div>
            </div>
          ) : (
            <OutlineBtn className="hidden lg:block" onClick={openAuth}>Нэвтрэх</OutlineBtn>
          )}
          <GoldBtn className="max-[480px]:!px-4 max-[480px]:!text-[13px]" onClick={openBooking}>Цаг захиалах</GoldBtn>

          <button
            className={`hamburger lg:hidden flex flex-col gap-[5px] cursor-pointer p-1.5 bg-none border-none min-w-[44px] min-h-[44px] items-center justify-center${mobOpen ? ' open' : ''}`}
            onClick={() => setMobOpen(o => !o)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      <div className={`mob-backdrop fixed inset-0 top-[84px] max-[640px]:top-[64px] bg-[#606060]/30 z-[998] backdrop-blur-sm${mobOpen ? ' open' : ''}`} onClick={() => setMobOpen(false)} />

      <div className={`mob-menu fixed top-[84px] max-[640px]:top-[64px] left-0 right-0 bg-[#606060] px-5 pb-6 shadow-[0_16px_48px_rgba(0,0,0,.12)] z-[999] flex-col gap-0 border-t border-pink-100 max-h-[calc(100vh-64px)] overflow-y-auto${mobOpen ? ' open' : ''}`}>
        {[['home','Нүүр'],['services','Үйлчилгээ'],['packages','Багц'],['products','Бүтээгдэхүүн'],['artists','Уран бүтээлчид'],['trainings','Сургалт'],['about','Бидний тухай'],['contact','Холбоо барих']].map(([id,label]) => (
          <a key={id} href={`#${id}`}
            className="group flex items-center justify-between py-3.5 px-2 border-b border-pink-100 last:border-0 no-underline text-pink-100 text-[15px] font-medium tracking-wide hover:text-[#FF3399] transition-colors"
            onClick={e => { e.preventDefault(); scrollTo(id); }}>
            {label}
            <span className="text-gold/35 text-lg leading-none group-hover:text-[#FF3399] group-hover:translate-x-0.5 transition-all">›</span>
          </a>
        ))}
        <div className="flex flex-col gap-2.5 mt-4 pt-4 border-t border-gold/15">
          {user ? (
            <>
              <div className="flex items-center justify-between px-3 py-2.5 bg-gold-light/60 rounded-xl border border-gold/20">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FF3399] to-[#FF66B2] text-white text-xs font-bold flex items-center justify-center">
                    {(user.user_metadata?.full_name || user.email)[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-pink-200 truncate max-w-[160px]">
                    {user.user_metadata?.full_name || user.email}
                  </span>
                </div>
                <button className="border-none bg-none text-salon-red text-xs font-semibold cursor-pointer" onClick={handleLogout}>Гарах</button>
              </div>
              <button onClick={() => { openMyBookings(); setMobOpen(false); }}
                className="px-3 py-3 bg-pink-400 rounded-xl text-white font-semibold text-sm border border-gold/15 cursor-pointer w-full text-center tracking-wide hover:border-gold/40 transition-colors">
                Миний захиалгууд
              </button>
              {isAdmin && (
                <a href="/admin" className="px-3 py-3 bg-gold-light/80 rounded-xl text-[#FF3399] font-bold text-sm no-underline border border-gold/20 text-center tracking-wide" onClick={() => setMobOpen(false)}>
                  Админ панель
                </a>
              )}
            </>
          ) : (
            <OutlineBtn className="w-full min-h-[48px] !text-[15px]" onClick={() => { openAuth(); setMobOpen(false); }}>Нэвтрэх</OutlineBtn>
          )}
          <GoldBtn className="w-full min-h-[50px] !text-[15px]" onClick={() => { openBooking(); setMobOpen(false); }}>Цаг захиалах</GoldBtn>
        </div>
      </div>
    </>
  );
}
