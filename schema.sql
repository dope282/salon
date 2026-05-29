-- ================================================================
-- Hatantsetsey lash Beauty Salon — Supabase Database Schema
-- Supabase SQL Editor дээр энэ файлыг ажиллуулна уу
-- ================================================================

-- 1. SERVICES TABLE
CREATE TABLE IF NOT EXISTS public.services (
  id          SERIAL PRIMARY KEY,
  name_mn     TEXT NOT NULL,
  description_mn TEXT,
  price_from  INTEGER NOT NULL DEFAULT 0,
  duration_min INTEGER DEFAULT 60,
  emoji       TEXT DEFAULT '✂️',
  active      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ARTISTS TABLE
CREATE TABLE IF NOT EXISTS public.artists (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  specialty_mn TEXT,
  rating       NUMERIC(3,1) DEFAULT 5.0,
  review_count INTEGER DEFAULT 0,
  avatar_emoji TEXT DEFAULT '👩',
  active       BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.bookings (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name    TEXT NOT NULL,
  customer_phone   TEXT NOT NULL,
  customer_email   TEXT,
  service_name     TEXT NOT NULL,
  artist_name      TEXT NOT NULL,
  booking_date     DATE NOT NULL,
  booking_time     TEXT NOT NULL,
  payment_method   TEXT DEFAULT 'cash',
  status           TEXT DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','completed','cancelled')),
  total_price      INTEGER DEFAULT 0,
  notes            TEXT,
  user_id          UUID REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================

ALTER TABLE public.services  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artists   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings  ENABLE ROW LEVEL SECURITY;

-- SERVICES: anyone can read
CREATE POLICY "services_public_read"  ON public.services  FOR SELECT USING (true);

-- ARTISTS: anyone can read
CREATE POLICY "artists_public_read" ON public.artists FOR SELECT USING (true);

-- ARTISTS: admin can write
CREATE POLICY "artists_admin_write" ON public.artists FOR ALL
  USING (auth.email() = 'jaamaaj26@gmail.com')
  WITH CHECK (auth.email() = 'jaamaaj26@gmail.com');

-- ARTISTS: add image_url column (run separately if table already exists)
ALTER TABLE public.artists ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '';

-- GRANT
GRANT SELECT ON public.artists TO anon;
GRANT ALL    ON public.artists TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- BOOKINGS: anyone can insert (no auth required to book)
CREATE POLICY "bookings_public_insert" ON public.bookings  FOR INSERT WITH CHECK (true);

-- BOOKINGS: anyone can read their own booking (by email match or user_id)
CREATE POLICY "bookings_self_read" ON public.bookings FOR SELECT
  USING (
    auth.uid() = user_id
    OR auth.email() = customer_email
    OR auth.email() = 'jaamaaj26@gmail.com'
  );

-- BOOKINGS: admin can update status
CREATE POLICY "bookings_admin_update" ON public.bookings FOR UPDATE
  USING (auth.email() = 'jaamaaj26@gmail.com');

-- BOOKINGS: allow anon read for confirmation page (all policies are OR-based)
-- Simpler approach: also allow reading by created_at desc for admin
CREATE POLICY "bookings_anon_own" ON public.bookings FOR SELECT
  USING (customer_email IS NULL OR customer_email = '');

-- ================================================================
-- SEED DATA — Үйлчилгээнүүд
-- ================================================================

INSERT INTO public.services (name_mn, description_mn, price_from, duration_min, emoji) VALUES
  ('Үс тайрах & Засах',   'Мэргэжлийн үсчин таны хүссэн загвараар үс засна',        35000, 60,  '✂️'),
  ('Үс будах',             'Олон өнгийн будалт, омбрэ, балайаж',                      65000, 120, '🎨'),
  ('Үсний эмчилгээ',      'Кератин, хатаалт, тэжээлт эмчилгээ',                       45000, 90,  '💆'),
  ('Маникюр',             'Хугасны засал, гель, дизайн',                               28000, 60,  '💅'),
  ('Педикюр',             'Хөлийн хугасны засал, массаж',                              35000, 75,  '🦶'),
  ('Нүүрний будалт',      'Урлалт гоо будалт, тусгай арга хэмжээний будалт',          70000, 90,  '💄')
ON CONFLICT DO NOTHING;

-- ================================================================
-- SEED DATA — Уран бүтээлчид
-- ================================================================

INSERT INTO public.artists (name, specialty_mn, rating, review_count, avatar_emoji) VALUES
  ('Алис Жонсон',    'Үсчин',   4.9, 128, '👩‍🦱'),
  ('Sophia Ли',      'Будагч',  4.8, 96,  '👩‍🦰'),
  ('Эмма Браун',     'Үсчин',   4.8, 84,  '👩'),
  ('Оливиа',         'Гримчин', 4.8, 72,  '👩‍🦳')
ON CONFLICT DO NOTHING;

-- ================================================================
-- 4. PRODUCTS TABLE
-- ================================================================

CREATE TABLE IF NOT EXISTS public.products (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  price       INTEGER NOT NULL DEFAULT 0,
  image_url   TEXT DEFAULT '',
  category    TEXT DEFAULT '',
  in_stock    BOOLEAN DEFAULT true,
  active      BOOLEAN DEFAULT true,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Anyone can read active products
CREATE POLICY "products_public_read" ON public.products
  FOR SELECT USING (active = true);

-- Admin can do everything
CREATE POLICY "products_admin_all" ON public.products
  FOR ALL USING (auth.email() = 'jaamaaj26@gmail.com')
  WITH CHECK (auth.email() = 'jaamaaj26@gmail.com');

-- ================================================================
-- 5. SITE SETTINGS TABLE (hero image, etc.)
-- ================================================================

CREATE TABLE IF NOT EXISTS public.site_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (hero image URL, etc.)
CREATE POLICY "settings_public_read" ON public.site_settings FOR SELECT USING (true);

-- Only admin can insert / update
CREATE POLICY "settings_admin_write" ON public.site_settings FOR INSERT
  WITH CHECK (auth.email() = 'jaamaaj26@gmail.com');

CREATE POLICY "settings_admin_update" ON public.site_settings FOR UPDATE
  USING (auth.email() = 'jaamaaj26@gmail.com');

-- Default hero image
INSERT INTO public.site_settings (key, value) VALUES
  ('hero_image_url', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=700&q=85&auto=format&fit=crop')
ON CONFLICT DO NOTHING;

-- Default promo banner config
INSERT INTO public.site_settings (key, value) VALUES
  ('promo_config', '{"active":true,"tag":"⚡ ОНЦГОЙ САНАЛ","title":"Анхны захиалгадаа","pct":"20%","all":"Бүх үйлчилгээнд","btn":"Одоо захиалах →","badge":"ОНЦГОЙ · САНАЛ · ЗӨВХӨН · ТАНД","emoji":"💇‍♀️"}')
ON CONFLICT DO NOTHING;

-- ================================================================
-- 5. SUPABASE STORAGE — hero-images bucket policies
-- Storage > New bucket дээр "hero-images" PUBLIC bucket үүсгэсний дараа
-- доорх SQL-ийг SQL Editor дээр ажиллуулна уу
-- ================================================================

-- Нийтэд зураг харах боломжтой
CREATE POLICY "hero_images_public_read"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'hero-images');

-- Зөвхөн admin зураг байршуулах боломжтой
CREATE POLICY "hero_images_admin_upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'hero-images' AND auth.email() = 'jaamaaj26@gmail.com');

-- Admin зургийг шинэчлэх боломжтой
CREATE POLICY "hero_images_admin_update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'hero-images' AND auth.email() = 'jaamaaj26@gmail.com');
--
-- ================================================================
-- DONE! Суурь мэдээллийг амжилттай оруулав.
-- ================================================================
