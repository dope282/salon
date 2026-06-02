// QPay V2 сервер талын туслах модуль (зөвхөн серверт ажиллана)
const QPAY_HOST = 'https://merchant.qpay.mn/v2';

// Token-ийг модуль түвшинд кэшлэнэ (timestamp хүртэл дахин авахгүй)
let cached = { token: null, exp: 0 };

export async function getToken() {
  const now = Math.floor(Date.now() / 1000);
  if (cached.token && cached.exp - 60 > now) return cached.token;

  const username = process.env.QPAY_USERNAME;
  const password = process.env.QPAY_PASSWORD;
  if (!username || !password) throw new Error('QPay тохиргоо дутуу (QPAY_USERNAME/QPAY_PASSWORD)');

  const basic = Buffer.from(`${username}:${password}`).toString('base64');
  const res = await fetch(`${QPAY_HOST}/auth/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/json' },
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) throw new Error('QPay token алдаа: ' + JSON.stringify(data));

  // expires_in нь ихэвчлэн ирээдүйн unix timestamp; хэрэв богино тоо бол одооноос нэмнэ
  const exp = data.expires_in > now ? data.expires_in : now + (data.expires_in || 3600);
  cached = { token: data.access_token, exp };
  return cached.token;
}

export async function createInvoice({ amount, description, senderInvoiceNo, callbackUrl }) {
  const token = await getToken();
  const body = {
    invoice_code: process.env.QPAY_INVOICE_CODE,
    sender_invoice_no: String(senderInvoiceNo),
    invoice_receiver_code: 'terminal',
    invoice_description: description || 'Beauty salon захиалга',
    amount,
    callback_url: callbackUrl,
  };
  const res = await fetch(`${QPAY_HOST}/invoice`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || !data.invoice_id) throw new Error('QPay invoice алдаа: ' + JSON.stringify(data));
  return data; // { invoice_id, qr_text, qr_image, qPay_shortUrl, urls: [{name, logo, link}] }
}

// Нэхэмжлэлийн төлбөр төлөгдсөн эсэхийг шалгана → { paid: bool, amount }
export async function checkPayment(invoiceId) {
  const token = await getToken();
  const res = await fetch(`${QPAY_HOST}/payment/check`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      object_type: 'INVOICE',
      object_id: invoiceId,
      offset: { page_number: 1, page_limit: 100 },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error('QPay check алдаа: ' + JSON.stringify(data));
  const rows = data.rows || [];
  const paidAmount = rows
    .filter(r => (r.payment_status === 'PAID'))
    .reduce((s, r) => s + Number(r.payment_amount || 0), 0);
  return { paid: paidAmount > 0, amount: paidAmount, raw: data };
}
