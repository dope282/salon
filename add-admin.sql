-- ================================================================
-- ОЛОН АДМИН — bdolmoosuren@gmail.com-г админ болгох
-- Supabase → SQL Editor дээр ажиллуулна.
-- Цаашид админ нэмэх бол зөвхөн доорх is_admin() функцийн жагсаалтад нэмнэ.
-- ================================================================

-- 1) Админ эсэхийг шалгах нэг төв функц
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT auth.email() IN (
    'jaamaaj26@gmail.com',
    'bdolmoosuren@gmail.com'
  );
$$;

-- 2) Бүх админ дүрмийг is_admin() ашиглахаар дахин үүсгэх

-- SERVICES
DROP POLICY IF EXISTS "services_admin_write" ON public.services;
CREATE POLICY "services_admin_write" ON public.services FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ARTISTS
DROP POLICY IF EXISTS "artists_admin_write" ON public.artists;
CREATE POLICY "artists_admin_write" ON public.artists FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- PRODUCTS
DROP POLICY IF EXISTS "products_admin_all" ON public.products;
CREATE POLICY "products_admin_all" ON public.products FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- SITE SETTINGS
DROP POLICY IF EXISTS "settings_admin_write" ON public.site_settings;
CREATE POLICY "settings_admin_write" ON public.site_settings FOR INSERT
  WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "settings_admin_update" ON public.site_settings;
CREATE POLICY "settings_admin_update" ON public.site_settings FOR UPDATE
  USING (public.is_admin());

-- PACKAGES
DROP POLICY IF EXISTS "packages_admin_all" ON public.packages;
CREATE POLICY "packages_admin_all" ON public.packages FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- PACKAGE_SERVICES
DROP POLICY IF EXISTS "pkg_svc_admin_all" ON public.package_services;
CREATE POLICY "pkg_svc_admin_all" ON public.package_services FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ARTIST_PACKAGES
DROP POLICY IF EXISTS "art_pkg_admin_all" ON public.artist_packages;
CREATE POLICY "art_pkg_admin_all" ON public.artist_packages FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ARTIST_SCHEDULES
DROP POLICY IF EXISTS "schedules_admin_all" ON public.artist_schedules;
CREATE POLICY "schedules_admin_all" ON public.artist_schedules FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ARTIST_SERVICES
DROP POLICY IF EXISTS "artist_services_admin_all" ON public.artist_services;
CREATE POLICY "artist_services_admin_all" ON public.artist_services FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- TRAININGS
DROP POLICY IF EXISTS "trainings_admin_all" ON public.trainings;
CREATE POLICY "trainings_admin_all" ON public.trainings FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- BOOKINGS — админ бүх захиалга харах + засах
DROP POLICY IF EXISTS "bookings_admin_update" ON public.bookings;
CREATE POLICY "bookings_admin_update" ON public.bookings FOR UPDATE
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "bookings_self_read" ON public.bookings;
CREATE POLICY "bookings_self_read" ON public.bookings FOR SELECT
  USING (auth.uid() = user_id OR auth.email() = customer_email OR public.is_admin());

-- админ захиалга устгах (хэрэгцээтэй бол)
DROP POLICY IF EXISTS "bookings_admin_delete" ON public.bookings;
CREATE POLICY "bookings_admin_delete" ON public.bookings FOR DELETE
  USING (public.is_admin());

-- PRODUCT_ORDERS
DROP POLICY IF EXISTS "porders_admin_all" ON public.product_orders;
CREATE POLICY "porders_admin_all" ON public.product_orders FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "porders_self_read" ON public.product_orders;
CREATE POLICY "porders_self_read" ON public.product_orders FOR SELECT
  USING (auth.uid() = user_id OR auth.email() = customer_email OR public.is_admin());

-- STORAGE (зураг байршуулах) — hero-images bucket
DROP POLICY IF EXISTS "hero_images_admin_upload" ON storage.objects;
CREATE POLICY "hero_images_admin_upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'hero-images' AND public.is_admin());
DROP POLICY IF EXISTS "hero_images_admin_update" ON storage.objects;
CREATE POLICY "hero_images_admin_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'hero-images' AND public.is_admin());

-- ================================================================
-- DONE! Одоо jaamaaj26@gmail.com БА bdolmoosuren@gmail.com хоёулаа админ.
-- ================================================================
