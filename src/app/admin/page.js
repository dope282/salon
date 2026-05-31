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
import ServicesManager  from '@/components/admin/ServicesManager';
import CustomersManager from '@/components/admin/CustomersManager';

const VIEW_TITLES = {
  dashboard:'Хяналтын самбар', appointments:'Захиалгууд', products:'Бүтээгдэхүүн',
  customers:'Үйлчлүүлэгчид',  artists:'Уран бүтээлчид', services:'Үйлчилгээнүүд',
  payments:'Төлбөрүүд',        reports:'Тайлан',          settings:'Тохиргоо',
};

export default function AdminPage() {
  const { user, loading, isAdmin, signOut } = useAuth();
  const router = useRouter();
  const [view, setView]        = useState('dashboard');
  const [settingsTab, setStab] = useState('hero');
  const [bookings, setBookings] = useState([]);
  const [toast, setToast]      = useState({ show:false, msg:'', type:'ok' });
  const [sbOpen, setSbOpen]    = useState(false);

  useEffect(() => {
    if (!loading && !user)    router.replace('/');
    if (!loading && !isAdmin) router.replace('/');
  }, [user, loading, isAdmin, router]);

  const loadBookings = useCallback(async () => {
    const { data } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
    setBookings(data || []);
  }, []);

  useEffect(() => { if (isAdmin) loadBookings(); }, [isAdmin, loadBookings]);

  const showToast = (msg, type='ok') => {
    setToast({ show:true, msg, type });
    setTimeout(() => setToast(t => ({ ...t, show:false })), 3400);
  };

  const handleLogout = async () => { await signOut(); router.replace('/'); };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen font-sans">
        <div className="text-center">
          <div className="text-[40px] mb-4">💇‍♀️</div>
          <div>Ачааллаж байна...</div>
        </div>
      </div>
    );
  }
  if (!isAdmin) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAFAFA] font-sans text-dark">
      {/* Overlay */}
      <div className={`sb-overlay fixed inset-0 z-[899]${sbOpen ? ' active' : ''}`} onClick={() => setSbOpen(false)} />

      <Sidebar
        view={view}
        onSwitch={(v) => { setView(v); setSbOpen(false); }}
        adminEmail={user?.email}
        onLogout={handleLogout}
        isOpen={sbOpen}
        onClose={() => setSbOpen(false)}
      />

      <main className="flex-1 overflow-y-auto px-8 py-7 max-[900px]:px-3.5 max-[640px]:px-3">
        {/* Topbar */}
        <div className="flex justify-between items-center mb-7 max-[900px]:mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setSbOpen(o => !o)}
              className="hidden max-[900px]:flex w-10 h-10 rounded-2xl border border-gray-200 bg-white cursor-pointer text-lg items-center justify-center text-gray-500">
              <i className="fas fa-bars" />
            </button>
            <div>
              <h2 className="font-display text-2xl font-bold max-[900px]:text-lg max-[640px]:text-base">{VIEW_TITLES[view] || view}</h2>
              <div className="text-xs text-gray-500 mt-0.5 max-[640px]:hidden">
                Hatantsetsey lash › <span className="text-pink">{VIEW_TITLES[view] || view}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 w-[220px] max-[900px]:hidden focus-within:border-pink transition-all">
              <i className="fas fa-search text-gray-300 text-[13px]" />
              <input type="text" placeholder="Хайх..." className="border-none outline-none text-[13px] w-full bg-transparent" />
            </div>
            <div onClick={() => showToast('Мэдэгдэл байхгүй байна', 'ok')}
              className="w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center cursor-pointer text-gray-500 relative transition-all hover:border-pink hover:text-pink">
              <i className="fas fa-bell" />
              <div className="absolute top-2 right-2 w-2 h-2 bg-pink rounded-full border-2 border-white" />
            </div>
          </div>
        </div>

        {/* Views */}
        {view === 'dashboard'    && <Dashboard bookings={bookings} onSwitchView={setView} />}
        {view === 'appointments' && <BookingsTable bookings={bookings} onRefresh={loadBookings} showToast={showToast} />}
        {view === 'products'     && <ProductsManager showToast={showToast} />}
        {view === 'artists'      && <ArtistsManager showToast={showToast} />}
        {view === 'services'     && <ServicesManager showToast={showToast} />}
        {view === 'customers'    && <CustomersManager showToast={showToast} />}

        {view === 'settings' && (
          <div>
            <div className="flex gap-2 mb-5 flex-wrap">
              {[{id:'hero',icon:'🖼️',label:'Hero зураг'},{id:'promo',icon:'📢',label:'Промо баннер'}].map(t => (
                <button key={t.id} onClick={() => setStab(t.id)}
                  className={`px-5 py-2 rounded-full text-[13px] font-semibold cursor-pointer border-2 transition-all ${settingsTab===t.id ? 'border-pink bg-pink-light text-pink-dark' : 'border-gray-200 bg-white text-gray-500'}`}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
            {settingsTab === 'hero'  && <HeroSettings  showToast={showToast} />}
            {settingsTab === 'promo' && <PromoSettings showToast={showToast} />}
          </div>
        )}

        {!['dashboard','appointments','products','artists','services','customers','settings'].includes(view) && (
          <div className="bg-white rounded-[24px] p-6 shadow-sm flex flex-col items-center justify-center min-h-[300px] gap-4 text-gray-500">
            <div className="text-5xl">🚧</div>
            <div className="text-base font-semibold">{VIEW_TITLES[view]} — Удахгүй нэмэгдэнэ</div>
            <div className="text-[13px]">Энэ хэсгийг хөгжүүлж байна</div>
          </div>
        )}
      </main>

      {/* Toast */}
      <div className={`toast fixed bottom-8 right-8 text-white px-5 py-4 rounded-2xl text-sm font-medium z-[9999] flex items-center gap-2.5 shadow-lg max-[640px]:bottom-0 max-[640px]:left-0 max-[640px]:right-0 max-[640px]:rounded-none ${toast.type === 'ok' ? 'bg-gradient-to-br from-[#38A169] to-[#276749]' : 'bg-gradient-to-br from-[#E53E3E] to-[#C53030]'}${toast.show ? ' show' : ''}`}>
        <span>{toast.type === 'ok' ? '✓' : '✕'}</span>
        <span>{toast.msg}</span>
      </div>
    </div>
  );
}
