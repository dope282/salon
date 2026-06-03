-- ================================================================
-- ТЕСТ ДАТА ЦЭВЭРЛЭХ — Supabase SQL Editor дээр ажиллуулна
-- (Supabase → SQL Editor → New query → доорхыг хуулж Run)
-- ⚠️ Эдгээр нь БУЦААГДАХГҮЙ. Эхлээд доорх SELECT-ээр шалгаарай.
-- ================================================================

-- ── 1. Захиалга / худалдан авалт (гүйлгээний бүх тест дата) ──
-- Эхлээд хараарай:
SELECT count(*) FROM public.bookings;
SELECT count(*) FROM public.product_orders;

-- Бүгдийг устгах (нээлтийн өмнөх тест тул аюулгүй):
DELETE FROM public.bookings;
DELETE FROM public.product_orders;

-- ================================================================
-- ── 2. Каталогийн хог бичлэгүүд (dsa, sadasd гэх мэт) ──
-- Эхлээд жагсаалтыг хараад, ХЭРЭГГҮЙ-г нь id-гаар нь устга.
-- ================================================================

-- Үйлчилгээнүүд харах:
SELECT id, name_mn, price_from, active FROM public.services ORDER BY id;
-- Жишээ: DELETE FROM public.services WHERE id IN (5, 6);

-- Багцууд:
SELECT id, name, price, active FROM public.packages ORDER BY id;
-- Жишээ: DELETE FROM public.packages WHERE id IN (3, 4);

-- Бүтээгдэхүүн:
SELECT id, name, price, active FROM public.products ORDER BY created_at;
-- Жишээ: DELETE FROM public.products WHERE name ILIKE '%dsa%' OR name ILIKE '%sad%';

-- Сургалт:
SELECT id, title, price FROM public.trainings ORDER BY id;
-- Жишээ: DELETE FROM public.trainings WHERE id IN (1);

-- Артистууд:
SELECT id, name, active FROM public.artists ORDER BY id;
-- Жишээ: DELETE FROM public.artists WHERE id IN (2);

-- ================================================================
-- ── 3. Цэвэрлэсний дараа sequence-ийг тэглэх (заавал биш) ──
-- ID-г 1-ээс эхлүүлэхийг хүсвэл:
-- ================================================================
-- ALTER SEQUENCE services_id_seq RESTART WITH 1;
-- ALTER SEQUENCE packages_id_seq RESTART WITH 1;
-- ALTER SEQUENCE trainings_id_seq RESTART WITH 1;
-- ALTER SEQUENCE artists_id_seq RESTART WITH 1;

-- ================================================================
-- ── 4. Тест хэрэглэгчид (auth) ──
-- Эдгээрийг SQL-ээр биш, Supabase → Authentication → Users хэсгээс
-- гараар устгана. ⚠️ Админ имэйл (jaamaaj26@gmail.com)-ийг БҮҮ устга.
-- ================================================================
