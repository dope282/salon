# Datacom (cPanel) дээр байршуулах заавар — MySQL хувилбар

Энэ апп нь **Next.js (Node.js сервер) + MySQL/MariaDB** дээр ажиллана.
Бүх backend (database, нэвтрэх/Auth, зураг байршуулах, QPay) нь Datacom доторх Node сервер
дээр ажиллах тул **Supabase шаардлагагүй** боллоо.

> Танай Datacom үйлчилгээ: **Node.js Hosting** (домэйн `hatantsetseglash.mn`) + cPanel + MySQL.

---

## 1. MySQL database үүсгэх (cPanel)

1. cPanel → **MySQL® Databases**:
   - **Create New Database**: ж. `hatantse_salon` → бүтэн нэр нь `hatantse_salon`.
   - **Add New User**: ж. `hatantse_salon` + хүчтэй нууц үг.
   - **Add User To Database** → бүх эрх (ALL PRIVILEGES).
2. cPanel → **phpMyAdmin** → зүүн талаас database-ээ сонго → дээд талын **Import** →
   `schema.mysql.sql` файлыг сонгож **Go**. (12 хүснэгт + `users`, `password_resets` үүснэ.)

---

## 2. Код байршуулах

**Git (зөвлөмж):** cPanel → **Git™ Version Control** → Create → Clone URL
`https://github.com/dope282/salon.git` → `repositories/salon`.
Эсвэл **File Manager**-аар бүх файлыг хуулна (`node_modules`, `.next`, `.env.local`-ийг **хуулахгүй**).

---

## 3. Setup Node.js App

cPanel → **Setup Node.js App** → **Create Application**:
- Node.js version: **20.x**
- Application mode: **Production**
- Application root: код байгаа фолдер (ж. `repositories/salon`)
- Application URL: `hatantsetseglash.mn`
- **Application startup file: `server.js`**

**Environment Variables** (тэр хэсэгт нэмнэ — `.env.local.example`-г хар):

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=hatantse_salon
DB_PASSWORD=<MySQL нууц үг>
DB_NAME=hatantse_salon
AUTH_SECRET=<урт санамсаргүй тэмдэгт>
NEXT_PUBLIC_ADMIN_EMAILS=jaamaaj26@gmail.com,bdolmoosuren@gmail.com
NEXT_PUBLIC_SITE_URL=https://hatantsetseglash.mn
SMTP_HOST=mail.hatantsetseglash.mn
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=noreply@hatantsetseglash.mn
SMTP_PASS=<мэйл хайрцгийн нууц үг>
SMTP_FROM=noreply@hatantsetseglash.mn
QPAY_USERNAME=HATANTSETSEG_MN
QPAY_PASSWORD=<QPay нууц үг>
QPAY_INVOICE_CODE=HATANTSETSEG_MN_INVOICE
```

> `AUTH_SECRET` үүсгэх: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## 4. Суулгах ба build

cPanel Terminal (эсвэл "Run NPM Install" → дараа нь):

```bash
cd ~/repositories/salon
source /home/hatantse/nodevenv/repositories/salon/20/bin/activate   # cPanel-ийн заасан activate мөр
npm install
npm run build
mkdir -p uploads        # зураг байршуулах фолдер (бичигдэх эрхтэй)
```

Дараа нь **Restart** дарж аппликейшнаа дахин асаа.

---

## 5. Нууц үг сэргээх имэйл (SMTP)

cPanel → **Email Accounts** → `noreply@hatantsetseglash.mn` үүсгэ → нууц үгийг
`SMTP_PASS`-д бич. (Имэйл хүрэлтийг сайжруулахад cPanel → **Email Deliverability**-д
SPF/DKIM-г идэвхжүүл.)

---

## 6. Хуучин дата зөөх (Supabase → MySQL)

**Арга A — JSON экспорт (Supabase API хязгаарлагдсан үед ч ажилладаг):**
1. Supabase Dashboard → **SQL Editor** → бүх хүснэгтийг нэг JSON болгох асуулга ажиллуулна
   (төслийн `README`/чат дахь `json_build_object(...)` асуулгыг хар) → үр дүнг
   `supabase-export.json` нэрээр хадгална.
2. Файлыг сервер дээрх `~/repositories/salon`-д байршуул (File Manager/scp).
3. Импортол:
   ```bash
   cd ~/repositories/salon
   DB_HOST=localhost DB_USER=hatantse_salon DB_PASSWORD=<...> DB_NAME=hatantse_salon \
   node scripts/import-from-json.mjs supabase-export.json
   ```
   (Энэ нь seed-ийг цэвэрлээд бодит датаг оруулна.)

**Арга B — Supabase API шууд (project идэвхтэй бол):**
```bash
SUPABASE_URL=<...> SUPABASE_SERVICE_ROLE_KEY=<...> \
DB_HOST=localhost DB_USER=hatantse_salon DB_PASSWORD=<...> DB_NAME=hatantse_salon \
node scripts/migrate-from-supabase.mjs
```

> **Анхаар:** Үйлчлүүлэгчдийн нууц үг зөөгдөхгүй — тэд **дахин бүртгүүлнэ** (захиалга нь
> имэйлээр харагдсан хэвээр). **Admin** шинээр `/`-д бүртгүүлэхэд `NEXT_PUBLIC_ADMIN_EMAILS`
> дотор байвал автоматаар админ болно. `supabase-export.json`-д хувийн мэдээлэл байгаа тул
> зөөж дууссаны дараа серверээс **устга**.

---

## 7. Эцсийн шалгалт

- Сайт нээгдэх (`https://hatantsetseglash.mn`) — үйлчилгээ/артист/багц харагдана.
- Admin имэйлээр бүртгүүлж нэвтэр → `/admin` руу шилжинэ → CRUD ажиллана.
- Захиалга үүсгэх → QPay QR гарна. **QPay merchant**-д callback домэйнаа
  `https://hatantsetseglash.mn` болгож бүртгүүл.

> "Passenger" 503 өгвөл: `.next` үүссэн эсэх, Node version, startup `server.js`,
> DB env зөв эсэхийг шалга. Логийг cPanel → Setup Node.js App → "Open Log" дотроос хар.

---

## Анхаарах

- `.env.local`, `node_modules`, `.next`, `public/uploads`-ийг GitHub-д **commit ХИЙХГҮЙ**.
- DB нууц үг, `AUTH_SECRET`, QPay/SMTP нууц үгийг зөвхөн Environment Variables-д хадгал.
- `NEXT_PUBLIC_SITE_URL`-ийг домэйнаараа тааруул (имэйл/QPay callback ашиглана).
