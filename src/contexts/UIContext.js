'use client';
import { createContext, useContext, useState, useCallback, useRef } from 'react';

const UIContext = createContext(null);

export function UIProvider({ children }) {
  const [bookingOpen, setBookingOpen]   = useState(false);
  const [authOpen, setAuthOpen]         = useState(false);
  const [toast, setToast]               = useState({ show: false, msg: '', type: 'ok' });
  const timerRef = useRef(null);

  const showToast = useCallback((msg, type = 'ok') => {
    clearTimeout(timerRef.current);
    setToast({ show: true, msg, type });
    timerRef.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 3400);
  }, []);

  const openBooking = () => { setBookingOpen(true);  document.body.style.overflow = 'hidden'; };
  const closeBooking = () => { setBookingOpen(false); document.body.style.overflow = ''; };
  const openAuth    = () => { setAuthOpen(true);     document.body.style.overflow = 'hidden'; };
  const closeAuth   = () => { setAuthOpen(false);    document.body.style.overflow = ''; };

  return (
    <UIContext.Provider value={{ bookingOpen, authOpen, toast, showToast, openBooking, closeBooking, openAuth, closeAuth }}>
      {children}
    </UIContext.Provider>
  );
}

export const useUI = () => useContext(UIContext);
