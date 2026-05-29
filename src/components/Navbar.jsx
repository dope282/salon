'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useUI }   from '@/contexts/UIContext';

export default function Navbar() {
  const { user, signOut, isAdmin } = useAuth();
  const { openBooking, openAuth }  = useUI();
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
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLogout = async () => {
    await signOut();
    setMobOpen(false);
  };

  return (
    <>
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
        <div className="logo">
          <Image src="/logo.jpg" alt="Hatantsetsey lash Beauty Salon" className="logo-img" width={120} height={48} style={{ height: 48, width: 'auto' }} priority />
        </div>
        <ul className="nav-links">
          {['home','services','products','artists','about','contact'].map((id, i) => (
            <li key={id}><a href={`#${id}`} onClick={e => { e.preventDefault(); scrollTo(id); }}>
              {['Нүүр','Үйлчилгээ','Бүтээгдэхүүн','Уран бүтээлчид','Бидний тухай','Холбоо барих'][i]}
            </a></li>
          ))}
        </ul>
        <div className="nav-actions">
          {user ? (
            <div className="nav-user-chip">
              <div className="nav-user-av">{user.email[0].toUpperCase()}</div>
              <span className="nav-user-email">{user.email}</span>
              {isAdmin && (
                <a href="/admin" style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 700, textDecoration: 'none', marginRight: 4 }}>Админ</a>
              )}
              <button className="nav-logout-btn" onClick={handleLogout}>Гарах</button>
            </div>
          ) : (
            <button className="btn-outline" onClick={openAuth}>Нэвтрэх</button>
          )}
          <button className="btn-primary" onClick={openBooking}>Цаг захиалах</button>
          <button className={`hamburger${mobOpen ? ' open' : ''}`} onClick={() => setMobOpen(o => !o)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* Mobile backdrop */}
      <div className={`mob-backdrop${mobOpen ? ' open' : ''}`} onClick={() => setMobOpen(false)} />

      {/* Mobile menu */}
      <div className={`mob-menu${mobOpen ? ' open' : ''}`}>
        {[
          ['home','🏠','Нүүр'],['services','✂️','Үйлчилгээ'],['products','🛍️','Бүтээгдэхүүн'],
          ['artists','👩‍🎨','Уран бүтээлчид'],['about','💫','Бидний тухай'],['contact','📞','Холбоо барих'],
        ].map(([id, icon, label]) => (
          <a key={id} href={`#${id}`} onClick={e => { e.preventDefault(); scrollTo(id); }}>
            <span>{icon}</span>{label}
          </a>
        ))}

        <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:16, paddingTop:16, borderTop:'1px solid var(--gray-100)' }}>
          {user ? (
            <>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', background:'var(--gold-light)', borderRadius:12, border:'1px solid var(--gold)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div className="nav-user-av">{user.email[0].toUpperCase()}</div>
                  <span style={{ fontSize:13, fontWeight:500, color:'var(--dark)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:160 }}>{user.email}</span>
                </div>
                <button style={{ background:'none', border:'none', color:'var(--red)', fontSize:12, cursor:'pointer', fontWeight:600, padding:'4px 8px' }} onClick={handleLogout}>Гарах</button>
              </div>
              {isAdmin && (
                <a href="/admin" style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 12px', background:'var(--pink-light)', borderRadius:12, color:'var(--pink-dark)', fontWeight:700, fontSize:14, textDecoration:'none', border:'none' }} onClick={() => setMobOpen(false)}>
                  ⚙️ Админ панель
                </a>
              )}
            </>
          ) : (
            <button className="btn-outline" style={{ width:'100%', minHeight:48, fontSize:15 }} onClick={() => { openAuth(); setMobOpen(false); }}>
              Нэвтрэх
            </button>
          )}
          <button className="btn-primary" style={{ width:'100%', minHeight:50, fontSize:15 }} onClick={() => { openBooking(); setMobOpen(false); }}>
            📅 Цаг захиалах
          </button>
        </div>
      </div>
    </>
  );
}
