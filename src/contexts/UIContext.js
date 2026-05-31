'use client';
import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

const UIContext = createContext(null);

export function UIProvider({ children }) {
  const [bookingOpen, setBookingOpen]   = useState(false);
  const [bookingArtist, setBookingArtist] = useState(null);
  const [authOpen, setAuthOpen]         = useState(false);
  const [myBookingsOpen, setMyBookingsOpen] = useState(false);
  const [toast, setToast]               = useState({ show: false, msg: '', type: 'ok' });
  const timerRef = useRef(null);

  const showToast = useCallback((msg, type = 'ok') => {
    clearTimeout(timerRef.current);
    setToast({ show: true, msg, type });
    timerRef.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 3400);
  }, []);

  const openBooking = () => { setBookingArtist(null); setBookingOpen(true);  document.body.style.overflow = 'hidden'; };
  const closeBooking = () => { setBookingOpen(false); setBookingArtist(null); document.body.style.overflow = ''; };
  const openBookingForArtist = (artistName) => { setBookingArtist(artistName); setBookingOpen(true); document.body.style.overflow = 'hidden'; };
  const openAuth    = () => { setAuthOpen(true);     document.body.style.overflow = 'hidden'; };
  const closeAuth   = () => { setAuthOpen(false);    document.body.style.overflow = ''; };
  const openMyBookings  = () => { setMyBookingsOpen(true);  document.body.style.overflow = 'hidden'; };
  const closeMyBookings = () => { setMyBookingsOpen(false); document.body.style.overflow = ''; };

  // Navigate хийхэд overflow:hidden арилгана
  useEffect(() => {
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <UIContext.Provider value={{ bookingOpen, bookingArtist, authOpen, myBookingsOpen, toast, showToast, openBooking, closeBooking, openBookingForArtist, openAuth, closeAuth, openMyBookings, closeMyBookings }}>
      {children}
    </UIContext.Provider>
  );
}

export const useUI = () => useContext(UIContext);
