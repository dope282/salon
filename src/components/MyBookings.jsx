'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUI }   from '@/contexts/UIContext';
import { supabase } from '@/lib/supabase';

const STATUS_LABEL = {
  pending:   { label: 'Хүлээгдэж буй', color: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Баталгаажсан',  color: 'bg-green-100 text-green-700'  },
  cancelled: { label: 'Цуцлагдсан',    color: 'bg-red-100 text-red-500'      },
  completed: { label: 'Дууссан',        color: 'bg-gray-100 text-pink-400'    },
};

export default function MyBookings() {
  const { user } = useAuth();
  const { myBookingsOpen, closeMyBookings, openBooking } = useUI();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', user.id)
      .order('booking_date', { ascending: false })
      .order('booking_time', { ascending: false });
    setBookings(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (myBookingsOpen) load();
  }, [myBookingsOpen, load]);

  if (!myBookingsOpen) return null;

  const upcoming = bookings.filter(b => b.status !== 'cancelled' && b.booking_date >= new Date().toISOString().split('T')[0]);
  const past     = bookings.filter(b => b.status === 'cancelled' || b.booking_date < new Date().toISOString().split('T')[0]);

  const BookingCard = ({ b }) => {
    const st = STATUS_LABEL[b.status] || STATUS_LABEL.pending;
    return (
      <div className="border border-gray-200 rounded-2xl p-4 bg-[#606060] hover:shadow-sm transition-all">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-pink-200 leading-snug">{b.service_name}</div>
            <div className="text-xs text-pink-400 mt-0.5">👩‍🦱 {b.artist_name}</div>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${st.color}`}>{st.label}</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-pink-400 flex-wrap">
          <span>📅 {b.booking_date}</span>
          <span>🕐 {b.booking_time}</span>
          {b.total_price > 0 && <span className="text-pink font-semibold ml-auto">₮{b.total_price.toLocaleString()}</span>}
        </div>
      </div>
    );
  };

  return (
    <div className="overlay active" onClick={e => { if (e.target === e.currentTarget) closeMyBookings(); }}>
      <div className="modal modal-sheet bg-[#606060] rounded-[28px] w-full max-w-[560px] max-h-[88vh] overflow-y-auto p-8 relative border border-gold/15 shadow-[0_32px_80px_rgba(0,0,0,.18)] max-[640px]:p-5" onClick={e => e.stopPropagation()}>
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#FF3399] via-[#FF66B2] to-[#FF3399] rounded-t-[28px]" />
        <button onClick={closeMyBookings}
          className="absolute top-5 right-5 w-9 h-9 rounded-full border border-gold/20 bg-gold/8 cursor-pointer text-base text-pink-200/40 flex items-center justify-center transition-all hover:bg-gold/20 hover:text-pink-200 z-10">
          ✕
        </button>

        <h2 className="font-serif text-[22px] font-semibold text-pink-200 mb-1 max-[640px]:text-lg">Миний захиалгууд</h2>
        <p className="text-sm text-pink-400 mb-6">{user?.email}</p>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16 text-pink-400">
            <div className="text-5xl mb-4">📅</div>
            <div className="text-sm font-medium mb-4">Одоохондоо захиалга байхгүй байна</div>
            <button onClick={() => { closeMyBookings(); openBooking(); }}
              className="bg-gradient-to-r from-[#FF3399] via-[#FF66B2] to-[#FF3399] text-white border-none px-6 py-2.5 rounded-full text-sm font-semibold cursor-pointer">
              Цаг захиалах
            </button>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <div className="mb-6">
                <div className="text-xs font-bold text-pink-400 uppercase tracking-wider mb-3">Удахгүй болох ({upcoming.length})</div>
                <div className="flex flex-col gap-2.5">
                  {upcoming.map(b => <BookingCard key={b.id} b={b} />)}
                </div>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <div className="text-xs font-bold text-pink-400 uppercase tracking-wider mb-3">Өнгөрсөн / Цуцлагдсан ({past.length})</div>
                <div className="flex flex-col gap-2.5 opacity-60">
                  {past.map(b => <BookingCard key={b.id} b={b} />)}
                </div>
              </div>
            )}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <button onClick={() => { closeMyBookings(); openBooking(); }}
                className="w-full bg-gradient-to-r from-[#FF3399] via-[#FF66B2] to-[#FF3399] text-white border-none py-3 rounded-full text-sm font-semibold cursor-pointer">
                + Шинэ захиалга
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
