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
      className={`bg-gradient-to-r from-[#B8960C] via-[#D4AF37] to-[#C9A84C] text-white border-none px-6 py-2.5 rounded-full text-sm font-semibold cursor-pointer transition-all shadow-[0_4px_16px_rgba(201,168,76,.35)] hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(201,168,76,.55)] disabled:opacity-60 tracking-wide ${className}`}>
      {children}
    </button>
  );

  const OutlineBtn = ({ children, onClick, className = '' }) => (
    <button onClick={onClick}
      className={`bg-transparent text-dark border border-dark/20 px-5 py-2.5 rounded-full text-sm font-medium cursor-pointer transition-all hover:border-gold hover:text-gold-dark tracking-wide ${className}`}>
      {children}
    </button>
  );

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-[1000] px-12 py-4 flex items-center justify-between transition-all duration-300 max-[900px]:px-5 max-[640px]:px-4 ${scrolled ? 'bg-[rgba(255,250,245,.98)] backdrop-blur-2xl shadow-[0_2px_20px_rgba(201,168,76,.12)] border-b border-gold/10' : 'bg-[rgba(255,250,245,.92)] backdrop-blur-xl'}`}>

        <div className="flex-shrink-0">
          <Image src="/logo.png" alt="Hatantsetsey lash Beauty Salon" width={130} height={52} style={{ height: 52, width: 'auto' }} priority />
        </div>

        {/* Desktop links */}
        <ul className="hidden md:flex list-none gap-9">
          {[['home','Нүүр'],['services','Үйлчилгээ'],['packages','Багц'],['products','Бүтээгдэхүүн'],['artists','Уран бүтээлчид'],['about','Бидний тухай'],['contact','Холбоо барих']].map(([id,label]) => (
            <li key={id}>
              <a href={`#${id}`} className="nav-link text-[13px] font-medium text-dark/70 hover:text-gold-dark tracking-wide"
                onClick={e => { e.preventDefault(); scrollTo(id); }}>
                {label}
              </a>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="hidden md:flex items-center gap-2">
              <OutlineBtn onClick={openMyBookings}>📅 Захиалгууд</OutlineBtn>
              <div className="flex items-center gap-2 bg-gold-light/60 border border-gold/25 rounded-full py-1.5 pl-2 pr-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#B8960C] to-[#D4AF37] text-white text-xs font-bold flex items-center justify-center shadow-sm">
                  {user.email[0].toUpperCase()}
                </div>
                <span className="text-xs font-medium text-dark max-w-[110px] truncate">{user.email}</span>
                {isAdmin && <a href="/admin" className="text-[10px] text-gold-dark font-bold no-underline uppercase tracking-wider">Admin</a>}
                <button className="border-none bg-none text-gray-400 text-[11px] cursor-pointer hover:text-salon-red transition-colors ml-0.5" onClick={handleLogout}>✕</button>
              </div>
            </div>
          ) : (
            <OutlineBtn className="hidden md:block" onClick={openAuth}>Нэвтрэх</OutlineBtn>
          )}
          <GoldBtn onClick={openBooking}>Цаг захиалах</GoldBtn>

          <button
            className={`hamburger md:hidden flex flex-col gap-[5px] cursor-pointer p-1.5 bg-none border-none min-w-[44px] min-h-[44px] items-center justify-center${mobOpen ? ' open' : ''}`}
            onClick={() => setMobOpen(o => !o)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      <div className={`mob-backdrop fixed inset-0 top-[60px] bg-dark/30 z-[998] backdrop-blur-sm${mobOpen ? ' open' : ''}`} onClick={() => setMobOpen(false)} />

      <div className={`mob-menu fixed top-[60px] left-0 right-0 bg-[#FFFAF5] px-5 pb-6 shadow-[0_16px_48px_rgba(0,0,0,.12)] z-[999] flex-col gap-0 border-t border-gold/15${mobOpen ? ' open' : ''}`}>
        {[['home','🏠','Нүүр'],['services','✂️','Үйлчилгээ'],['packages','🎁','Багц'],['products','🛍️','Бүтээгдэхүүн'],['artists','👩‍🎨','Уран бүтээлчид'],['about','💫','Бидний тухай'],['contact','📞','Холбоо барих']].map(([id,icon,label]) => (
          <a key={id} href={`#${id}`}
            className="flex items-center gap-3 text-dark/80 text-[15px] font-medium py-3.5 px-2 border-b border-gold/10 last:border-0 no-underline hover:text-gold-dark transition-colors"
            onClick={e => { e.preventDefault(); scrollTo(id); }}>
            <span className="text-base">{icon}</span>{label}
          </a>
        ))}
        <div className="flex flex-col gap-2.5 mt-4 pt-4 border-t border-gold/15">
          {user ? (
            <>
              <div className="flex items-center justify-between px-3 py-2.5 bg-gold-light/60 rounded-xl border border-gold/20">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#B8960C] to-[#D4AF37] text-white text-xs font-bold flex items-center justify-center">{user.email[0].toUpperCase()}</div>
                  <span className="text-sm font-medium text-dark truncate max-w-[160px]">{user.email}</span>
                </div>
                <button className="border-none bg-none text-salon-red text-xs font-semibold cursor-pointer" onClick={handleLogout}>Гарах</button>
              </div>
              <button onClick={() => { openMyBookings(); setMobOpen(false); }}
                className="flex items-center gap-2 px-3 py-3 bg-white rounded-xl text-dark font-semibold text-sm border border-gray-200 cursor-pointer w-full text-left">
                📅 Миний захиалгууд
              </button>
              {isAdmin && (
                <a href="/admin" className="flex items-center gap-2 px-3 py-3 bg-gold-light/80 rounded-xl text-gold-dark font-bold text-sm no-underline border border-gold/20" onClick={() => setMobOpen(false)}>
                  ⚙️ Админ панель
                </a>
              )}
            </>
          ) : (
            <OutlineBtn className="w-full min-h-[48px] !text-[15px]" onClick={() => { openAuth(); setMobOpen(false); }}>Нэвтрэх</OutlineBtn>
          )}
          <GoldBtn className="w-full min-h-[50px] !text-[15px]" onClick={() => { openBooking(); setMobOpen(false); }}>📅 Цаг захиалах</GoldBtn>
        </div>
      </div>
    </>
  );
}
