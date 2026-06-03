# Datacom хостинг дээр байршуулах заавар

Энэ апп нь **Next.js (Node.js сервер)** — QPay төлбөр (`/api/qpay/*`), нууц үг сэргээх зэрэг
серверийн хэсэгтэй тул **Node.js орчин шаардана**.

---

## 0. Эхлээд хостингоо ШАЛГА

cPanel-д нэвтрээд (https://таны-домэйн:2083 эсвэл Datacom-ийн өгсөн хаяг) дараахыг хар:

- **"Software" хэсэгт `Setup Node.js App` эсвэл `Application Manager` байна уу?**
  - ✅ Байвал → **A хувилбар** (доор). QPay бүрэн ажиллана.
  - ❌ Байхгүй, зөвхөн PHP/файл менежер бол → **C хувилбар** (статик, QPay ажиллахгүй).
- VPS / SSH хандалттай бол → **B хувилбар**.

Мэдэхгүй бол cPanel-ийн дэлгэцийн зургийг авч надад илгээ.

---

## A. cPanel + Node.js (хамгийн магадлалтай)

1. **Код байршуулах:** GitHub-аас татах эсвэл cPanel File Manager-аар `public_html`-д (эсвэл тусдаа фолдер) бүх файлыг хуулна. `node_modules`, `.next`, `.env.local`-ийг хуулахгүй.

2. **Setup Node.js App** → **Create Application**:
   - Node.js version: **20.x** (эсвэл 18.x)
   - Application mode: **Production**
   - Application root: код байгаа фолдер (ж: `salon`)
   - Application URL: домэйн
   - **Application startup file: `server.js`**

3. **Environment Variables** (тэр хэсэгт нэмнэ):

   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   NEXT_PUBLIC_ADMIN_EMAIL=jaamaaj26@gmail.com
   SUPABASE_SERVICE_ROLE_KEY=...
   QPAY_USERNAME=HATANTSETSEG_MN
   QPAY_PASSWORD=nEHEDq9K
   QPAY_INVOICE_CODE=HATANTSETSEG_MN_INVOICE
   NEXT_PUBLIC_SITE_URL=https://таны-домэйн
   ```

4. **Terminal нээх** (cPanel Terminal эсвэл "Run NPM Install" дараад дараа нь):

   ```bash
   cd ~/salon
   source /home/ХЭРЭГЛЭГЧ/nodevenv/salon/20/bin/activate   # cPanel-ийн заасан activate мөр
   npm install
   npm run build
   ```

5. **Restart** дарж аппликейшнаа дахин асаа.

6. **Supabase → Auth → URL Configuration → Redirect URLs**-д
   `https://таны-домэйн/reset-password` нэмэх.

7. **QPay merchant**-д callback домэйнаа бүртгүүлэх шаардлагатай бол Datacom домэйнаа өг.

> Хэрэв "Passenger" 503 өгвөл: build хийгдсэн эсэх (`.next` фолдер үүссэн эсэх), Node version,
> startup file `server.js` мөн эсэхийг шалга.

---

## B. VPS / Cloud сервер (SSH-тэй)

```bash
# Node 20 суулгасан гэж үзвэл
git clone <repo> salon && cd salon
npm install
npm run build
# Орчны хувьсагчдыг .env.local-д хийх (дээрхтэй ижил)
npm install -g pm2
PORT=3000 pm2 start server.js --name salon
pm2 save && pm2 startup
```

Дараа нь **nginx** reverse proxy:

```nginx
server {
  server_name таны-домэйн;
  location / { proxy_pass http://127.0.0.1:3000; proxy_set_header Host $host; }
}
```

SSL: `certbot --nginx`.

---

## C. Зөвхөн static/PHP hosting (Node БАЙХГҮЙ)

⚠️ Энэ тохиолдолд **QPay төлбөр, нууц үг сэргээх, admin-ийн серверийн үйлдлүүд АЖИЛЛАХГҮЙ**
(API routes Node шаарддаг). Сонголтууд:

1. **Зөвлөмж:** Node дэмждэг багц руу шилжих (Datacom-д Node hosting/VPS асуу), эсвэл Vercel дээр үлдээх.
2. Эсвэл зөвхөн **статик front** тавиад QPay-г өөр Node сервер дээр (Vercel functions) байршуулж холбох — нэмэлт тохиргоо шаардана.
3. Хэрэв статик хувилбар хүсвэл `next.config.mjs`-д `output: 'export'` болгож, `/api/*`-ийг түр салгана (QPay-гүй).

> Аль нь болохыг хэлбэл тохирох тохиргоог хийж өгье.

---

## Анхаарах

- `.env.local`, `node_modules`, `.next` -ийг GitHub/хостингд **бүү commit/upload** хий (build дээр нь хийгдэнэ).
- `NEXT_PUBLIC_SITE_URL`-ийг шинэ домэйнаараа солихоо мартуузай (QPay callback ашиглана).
