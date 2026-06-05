-- ================================================================
-- АРТИСТЫН ПОРТАЛ — артист өөрийн мэйлээр нэвтэрч,
-- өөрийн цагийн хуваарь тохируулах + өөрт ирсэн захиалгаа харах
-- Supabase → SQL Editor дээр ажиллуулна.
-- ================================================================

-- 1) Артистад мэйл багана
ALTER TABLE public.artists ADD COLUMN IF NOT EXISTS email TEXT;

-- 2) Нэвтэрсэн хэрэглэгчийн мэйлтэй тохирох артистыг олох туслах функцууд
CREATE OR REPLACE FUNCTION public.my_artist_id()
RETURNS bigint
LANGUAGE sql STABLE
AS $$
  SELECT id FROM public.artists
  WHERE email IS NOT NULL AND lower(email) = lower(auth.email())
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.my_artist_name()
RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT name FROM public.artists
  WHERE email IS NOT NULL AND lower(email) = lower(auth.email())
  LIMIT 1;
$$;

-- 3) RLS — артист зөвхөн ӨӨРИЙН хуваарийг удирдана
DROP POLICY IF EXISTS "schedules_artist_own" ON public.artist_schedules;
CREATE POLICY "schedules_artist_own" ON public.artist_schedules FOR ALL
  USING (artist_id = public.my_artist_id())
  WITH CHECK (artist_id = public.my_artist_id());

-- 4) RLS — артист зөвхөн ӨӨРТ ирсэн захиалгыг харна
DROP POLICY IF EXISTS "bookings_artist_read" ON public.bookings;
CREATE POLICY "bookings_artist_read" ON public.bookings FOR SELECT
  USING (artist_name = public.my_artist_name());

-- ================================================================
-- DONE! Админ → Артистууд хэсэгт артистад мэйл бичиж бүртгэнэ.
-- Тэр мэйлээр бүртгүүлсэн/нэвтэрсэн хэрэглэгч /artist хуудсаар
-- хуваариа тохируулж, захиалгаа харна.
-- ================================================================
