-- ================================================================
-- Артист өөрийн захиалгаа "Дууссан / Төлсөн" болгох эрх (UPDATE)
-- Supabase → SQL Editor дээр ажиллуулна.
-- (add-artist-portal.sql-ийг ӨМНӨ нь ажиллуулсан байх ёстой — my_artist_name() хэрэгтэй)
-- ================================================================

DROP POLICY IF EXISTS "bookings_artist_update" ON public.bookings;
CREATE POLICY "bookings_artist_update" ON public.bookings FOR UPDATE
  USING (artist_name = public.my_artist_name())
  WITH CHECK (artist_name = public.my_artist_name());
