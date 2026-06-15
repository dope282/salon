-- ================================================================
-- Hatantsetseg lash — MySQL / MariaDB Database Schema
-- Datacom cPanel → phpMyAdmin → Import, эсвэл:
--   mysql -u USER -p DBNAME < schema.mysql.sql
-- (PostgreSQL/Supabase схемээс хөрвүүлсэн. RLS политикийг API давхаргад шилжүүлэв.)
-- ================================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ================================================================
-- 0. AUTH — хэрэглэгч ба нууц үг сэргээх (Supabase Auth-г орлоно)
-- ================================================================
CREATE TABLE IF NOT EXISTS users (
  id            CHAR(36)     NOT NULL PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone         VARCHAR(32)  DEFAULT NULL,
  role          VARCHAR(20)  NOT NULL DEFAULT 'customer',  -- 'customer' | 'admin'
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS password_resets (
  token      CHAR(64)  NOT NULL PRIMARY KEY,
  user_id    CHAR(36)  NOT NULL,
  expires_at DATETIME  NOT NULL,
  created_at DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pr_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================
-- 1. SERVICES
-- ================================================================
CREATE TABLE IF NOT EXISTS services (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name_mn       VARCHAR(255) NOT NULL,
  description_mn TEXT,
  price_from    INT NOT NULL DEFAULT 0,
  duration_min  INT DEFAULT 60,
  emoji         VARCHAR(32)   DEFAULT '✂️',
  image_url     VARCHAR(1024) DEFAULT '',
  images        LONGTEXT,                    -- JSON массив (string-ээр хадгална)
  deposit       INT DEFAULT 0,
  active        TINYINT(1) DEFAULT 1,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================
-- 2. ARTISTS
-- ================================================================
CREATE TABLE IF NOT EXISTS artists (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(255) NOT NULL,
  specialty_mn VARCHAR(255),
  rating       DECIMAL(3,1) DEFAULT 5.0,
  review_count INT DEFAULT 0,
  avatar_emoji VARCHAR(32)   DEFAULT '👩',
  image_url    VARCHAR(1024) DEFAULT '',
  email        VARCHAR(255)  DEFAULT NULL,   -- артист энэ мэйлээр /artist-д нэвтэрнэ
  deposit      INT DEFAULT 0,
  pay_qpay     TINYINT(1) NOT NULL DEFAULT 1,
  pay_cash     TINYINT(1) NOT NULL DEFAULT 0,
  active       TINYINT(1) DEFAULT 1,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================
-- 3. BOOKINGS
-- ================================================================
CREATE TABLE IF NOT EXISTS bookings (
  id               CHAR(36) NOT NULL PRIMARY KEY,
  customer_name    VARCHAR(255) NOT NULL,
  customer_phone   VARCHAR(32)  NOT NULL,
  customer_email   VARCHAR(255),
  service_name     VARCHAR(255) NOT NULL,
  artist_name      VARCHAR(255) NOT NULL,
  booking_date     DATE NOT NULL,
  booking_time     VARCHAR(8)  NOT NULL,
  payment_method   VARCHAR(16) DEFAULT 'cash',
  status           VARCHAR(16) DEFAULT 'pending',   -- pending|confirmed|completed|cancelled
  total_price      INT DEFAULT 0,
  duration_min     INT DEFAULT 60,
  notes            TEXT,
  user_id          CHAR(36) DEFAULT NULL,
  qpay_invoice_id  VARCHAR(255) DEFAULT NULL,
  paid             TINYINT(1) DEFAULT 0,
  paid_at          DATETIME DEFAULT NULL,
  deposit_amount   INT DEFAULT 0,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_bk_date (booking_date),
  INDEX idx_bk_artist (artist_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================
-- 4. PRODUCTS
-- ================================================================
CREATE TABLE IF NOT EXISTS products (
  id          CHAR(36) NOT NULL PRIMARY KEY,
  name        VARCHAR(1024) NOT NULL,
  description TEXT,
  price       INT NOT NULL DEFAULT 0,
  image_url   VARCHAR(1024) DEFAULT '',
  images      LONGTEXT,
  category    VARCHAR(128) DEFAULT '',
  in_stock    TINYINT(1) DEFAULT 1,
  active      TINYINT(1) DEFAULT 1,
  sort_order  INT DEFAULT 0,
  deposit     INT DEFAULT 0,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================
-- 5. SITE SETTINGS (hero зураг, промо тохиргоо г.м.)
-- `value` нь string — JSON-г апп өөрөө parse хийдэг тул хэвээр үлдээнэ.
-- ================================================================
CREATE TABLE IF NOT EXISTS site_settings (
  `key`      VARCHAR(191) NOT NULL PRIMARY KEY,
  `value`    LONGTEXT NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================
-- 6. PACKAGES + холбоосууд
-- ================================================================
CREATE TABLE IF NOT EXISTS packages (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(255) NOT NULL,
  description    TEXT,
  price          INT NOT NULL DEFAULT 0,
  original_price INT DEFAULT 0,
  emoji          VARCHAR(32)   DEFAULT '🎁',
  image_url      VARCHAR(1024) DEFAULT '',
  images         LONGTEXT,
  duration_min   INT DEFAULT 120,
  deposit        INT DEFAULT 0,
  active         TINYINT(1) DEFAULT 1,
  sort_order     INT DEFAULT 0,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS package_services (
  package_id INT NOT NULL,
  service_id INT NOT NULL,
  PRIMARY KEY (package_id, service_id),
  CONSTRAINT fk_ps_pkg FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE,
  CONSTRAINT fk_ps_svc FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS artist_packages (
  artist_id  INT NOT NULL,
  package_id INT NOT NULL,
  PRIMARY KEY (artist_id, package_id),
  CONSTRAINT fk_ap_art FOREIGN KEY (artist_id)  REFERENCES artists(id)  ON DELETE CASCADE,
  CONSTRAINT fk_ap_pkg FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================
-- 7. ARTIST SCHEDULE
-- ================================================================
CREATE TABLE IF NOT EXISTS artist_schedules (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  artist_id   INT NOT NULL,
  day_of_week TINYINT NOT NULL,            -- 0..6 (Ням..Бямба)
  start_time  VARCHAR(8) NOT NULL DEFAULT '09:00',
  end_time    VARCHAR(8) NOT NULL DEFAULT '18:00',
  is_active   TINYINT(1) DEFAULT 1,
  UNIQUE KEY uq_sched (artist_id, day_of_week),
  CONSTRAINT fk_sched_art FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================
-- 8. ARTIST <-> SERVICE (many-to-many)
-- ================================================================
CREATE TABLE IF NOT EXISTS artist_services (
  artist_id  INT NOT NULL,
  service_id INT NOT NULL,
  PRIMARY KEY (artist_id, service_id),
  CONSTRAINT fk_as_art FOREIGN KEY (artist_id)  REFERENCES artists(id)  ON DELETE CASCADE,
  CONSTRAINT fk_as_svc FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================
-- 9. TRAININGS
-- ================================================================
CREATE TABLE IF NOT EXISTS trainings (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  image_url   VARCHAR(1024) DEFAULT '',
  images      LONGTEXT,
  price       INT DEFAULT 0,
  duration    VARCHAR(64)  DEFAULT '',
  level       VARCHAR(64)  DEFAULT '',
  schedule    VARCHAR(255) DEFAULT '',
  deposit     INT DEFAULT 0,
  active      TINYINT(1) DEFAULT 1,
  sort_order  INT DEFAULT 0,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================
-- 10. PRODUCT ORDERS (QPay шууд худалдан авалт)
-- ================================================================
CREATE TABLE IF NOT EXISTS product_orders (
  id              CHAR(36) NOT NULL PRIMARY KEY,
  item_type       VARCHAR(16) DEFAULT 'product',  -- 'product' | 'training'
  product_id      CHAR(36) DEFAULT NULL,
  product_name    VARCHAR(255) NOT NULL,
  quantity        INT DEFAULT 1,
  price           INT NOT NULL DEFAULT 0,
  customer_phone  VARCHAR(32),
  customer_email  VARCHAR(255),
  qpay_invoice_id VARCHAR(255),
  paid            TINYINT(1) DEFAULT 0,
  paid_at         DATETIME DEFAULT NULL,
  status          VARCHAR(16) DEFAULT 'pending',
  user_id         CHAR(36) DEFAULT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================
-- SEED — Үндсэн жишээ дата (бодит дата зөөвөл migration script-аар дарагдана)
-- ================================================================
INSERT IGNORE INTO services (name_mn, description_mn, price_from, duration_min, emoji) VALUES
  ('Үс тайрах & Засах', 'Мэргэжлийн үсчин таны хүссэн загвараар үс засна', 35000, 60,  '✂️'),
  ('Үс будах',          'Олон өнгийн будалт, омбрэ, балайаж',              65000, 120, '🎨'),
  ('Үсний эмчилгээ',   'Кератин, хатаалт, тэжээлт эмчилгээ',               45000, 90,  '💆'),
  ('Маникюр',          'Хугасны засал, гель, дизайн',                      28000, 60,  '💅'),
  ('Педикюр',          'Хөлийн хугасны засал, массаж',                     35000, 75,  '🦶'),
  ('Нүүрний будалт',   'Урлалт гоо будалт, тусгай арга хэмжээний будалт',  70000, 90,  '💄');

INSERT IGNORE INTO artists (name, specialty_mn, rating, review_count, avatar_emoji) VALUES
  ('Алис Жонсон', 'Үсчин',   4.9, 128, '👩‍🦱'),
  ('Sophia Ли',   'Будагч',  4.8, 96,  '👩‍🦰'),
  ('Эмма Браун',  'Үсчин',   4.8, 84,  '👩'),
  ('Оливиа',      'Гримчин', 4.8, 72,  '👩‍🦳');

INSERT IGNORE INTO site_settings (`key`, `value`) VALUES
  ('hero_image_url', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=700&q=85&auto=format&fit=crop'),
  ('promo_config', '{"active":true,"tag":"⚡ ОНЦГОЙ САНАЛ","title":"Анхны захиалгадаа","pct":"20%","all":"Бүх үйлчилгээнд","btn":"Одоо захиалах →","badge":"ОНЦГОЙ · САНАЛ · ЗӨВХӨН · ТАНД","emoji":"💇‍♀️"}');

-- ================================================================
-- DONE!
-- ================================================================
