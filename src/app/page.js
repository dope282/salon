'use client';
import { useEffect } from 'react';
import Navbar        from '@/components/Navbar';
import Hero          from '@/components/Hero';
import Services      from '@/components/Services';
import Artists       from '@/components/Artists';
import Features      from '@/components/Features';
import Footer        from '@/components/Footer';
import PromoSection  from '@/components/PromoSection';
import Products      from '@/components/Products';
import PackagesSection from '@/components/Packages';
import BookingModal  from '@/components/BookingModal';
import AuthModal     from '@/components/AuthModal';
import MyBookings    from '@/components/MyBookings';
import Trainings     from '@/components/Trainings';
import Toast         from '@/components/Toast';

export default function HomePage() {
  // Fade-up scroll observer
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('vis'); }),
      { threshold: 0.1 }
    );
    document.querySelectorAll('.fade-up').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <Navbar />

      <Hero />

      <PromoSection />

      <Services />
      <PackagesSection />
      <Products />
      <Artists />
      <Trainings />
      <Features />
      <Footer />

      {/* Modals */}
      <BookingModal />
      <AuthModal />
      <MyBookings />
      <Toast />
    </>
  );
}
