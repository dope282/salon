'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth }   from '@/contexts/AuthContext';
import { supabase }  from '@/lib/supabase';
import Sidebar        from '@/components/admin/Sidebar';
import Dashboard      from '@/components/admin/Dashboard';
import BookingsTable  from '@/components/admin/BookingsTable';
import HeroSettings    from '@/components/admin/HeroSettings';
import PromoSettings   from '@/components/admin/PromoSettings';
import ProductsManager from '@/components/admin/ProductsManager';
import ArtistsManager  from '@/components/admin/ArtistsManager';

const VIEW_TITLES = {
  dashboard:'Хяналтын самбар', appointments:'Захиалгууд', products:'Бүтээгдэхүүн', customers:'Үйлчлүүлэгчид',
  artists:'Уран бүтээлчид',    services:'Үйлчилгээнүүд', payments:'Төлбөрүүд',
  reports:'Тайлан',            settings:'Тохиргоо',
};

export default function AdminPage() {
  const { user, loading, isAdmin, signOut } = useAuth();
  const router = useRouter();

  const [view, setView]           = useState('dashboard');
  const [settingsTab, setStab]    = useState('hero');
  const [bookings, setBookings]   = useState([]);
  const [toast, setToast]         = useState({ show:false, msg:'', type:'ok' });
  const [sbOpen, setSbOpen]       = useState(false);

  // Auth guard
  useEffect(() => {
    if (!loading && !user)    router.replace('/');
    if (!loading && !isAdmin) router.replace('/');
  }, [user, loading, isAdmin, router]);

  // Load bookings
  const loadBookings = useCallback(async () => {
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });
    setBookings(data || []);
  }, []);

  useEffect(() => { if (isAdmin) loadBookings(); }, [isAdmin, loadBookings]);

  const showToast = (msg, type='ok') => {
    setToast({ show:true, msg, type });
    setTimeout(() => setToast(t => ({ ...t, show:false })), 3400);
  };

  const handleLogout = async () => { await signOut(); router.replace('/'); };

  if (loading || !isAdmin) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:'Inter,sans-serif' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:40, marginBottom:16 }}>💇‍♀️</div>
          <div>Ачааллаж байна...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-body">
      {/* Sidebar overlay (mobile) */}
      <div className={`sb-overlay${sbOpen ? ' active' : ''}`} onClick={() => setSbOpen(false)} />

      <Sidebar
        view={view}
        onSwitch={(v) => { setView(v); setSbOpen(false); }}
        adminEmail={user?.email}
        onLogout={handleLogout}
        isOpen={sbOpen}
        onClose={() => setSbOpen(false)}
      />

      <main className="admin-main">
        {/* Top bar */}
        <div className="topbar">
          <div className="topbar-left" style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button className="mob-sb-btn" onClick={() => setSbOpen(o => !o)}>
              <i className="fas fa-bars" />
            </button>
            <div>
              <h2>{VIEW_TITLES[view] || view}</h2>
              <div className="breadcrumb">Hatantsetsey lash › <span>{VIEW_TITLES[view] || view}</span></div>
            </div>
          </div>
          <div className="topbar-right">
            <div className="search-box">
              <i className="fas fa-search" />
              <input type="text" placeholder="Хайх..." />
            </div>
            <div className="topbar-icon-btn" onClick={() => showToast('Мэдэгдэл байхгүй байна', 'ok')}>
              <i className="fas fa-bell" />
              <div className="notif-dot" />
            </div>
          </div>
        </div>

        {/* Views */}
        {view === 'dashboard' && (
          <Dashboard bookings={bookings} onSwitchView={setView} />
        )}

        {view === 'appointments' && (
          <BookingsTable bookings={bookings} onRefresh={loadBookings} showToast={showToast} />
        )}

        {view === 'products' && (
          <ProductsManager showToast={showToast} />
        )}

        {view === 'artists' && (
          <ArtistsManager showToast={showToast} />
        )}

        {view === 'settings' && (
          <div>
            {/* Settings sub-tabs */}
            <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
              {[
                { id:'hero',  icon:'🖼️', label:'Hero зураг' },
                { id:'promo', icon:'📢', label:'Промо баннер' },
              ].map(t => (
                <button key={t.id} onClick={() => setStab(t.id)}
                  style={{
                    padding:'9px 20px', borderRadius:50, fontSize:13, fontWeight:600, cursor:'pointer', border:'2px solid',
                    borderColor: settingsTab === t.id ? 'var(--pink)' : 'var(--gray-200)',
                    background:  settingsTab === t.id ? 'var(--pink-light)' : '#fff',
                    color:       settingsTab === t.id ? 'var(--pink-dark)' : 'var(--gray-500)',
                    transition:'all .2s',
                  }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
            {settingsTab === 'hero'  && <HeroSettings  showToast={showToast} />}
            {settingsTab === 'promo' && <PromoSettings showToast={showToast} />}
          </div>
        )}

        {!['dashboard','appointments','products','artists','settings'].includes(view) && (
          <div className="card" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:300, gap:16, color:'var(--gray-500)' }}>
            <div style={{ fontSize:48 }}>🚧</div>
            <div style={{ fontSize:16, fontWeight:600 }}>{VIEW_TITLES[view]} — Удахгүй нэмэгдэнэ</div>
            <div style={{ fontSize:13 }}>Энэ хэсгийг хөгжүүлж байна</div>
          </div>
        )}
      </main>

      {/* Toast */}
      <div className={`toast ${toast.type}${toast.show ? ' show' : ''}`}>
        <span>{toast.type === 'ok' ? '✓' : '✕'}</span>
        <span>{toast.msg}</span>
      </div>
    </div>
  );
}
