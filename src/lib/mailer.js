// Нууц үг сэргээх имэйл (cPanel SMTP). SMTP тохируулаагүй бол алдаагүй degrade хийнэ.
import nodemailer from 'nodemailer';

let _transport;
function getTransport() {
  if (_transport !== undefined) return _transport;
  const host = process.env.SMTP_HOST;
  if (!host) { _transport = null; return null; }
  const port = Number(process.env.SMTP_PORT || 587);
  _transport = nodemailer.createTransport({
    host,
    port,
    secure: String(process.env.SMTP_SECURE || '') === 'true' || port === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  return _transport;
}

export async function sendResetEmail(to, link) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@hatantsetseglash.mn';
  const t = getTransport();
  if (!t) {
    console.warn('[mailer] SMTP тохируулаагүй байна. Нууц үг сэргээх холбоос:', link);
    return;
  }
  await t.sendMail({
    from,
    to,
    subject: 'Нууц үг сэргээх — Hatantsetseg lash',
    html: `<div style="font-family:sans-serif;font-size:14px;color:#333">
      <p>Сайн байна уу,</p>
      <p>Нууц үгээ сэргээхийн тулд доорх холбоос дээр дарна уу. Холбоос <b>1 цаг</b> хүчинтэй:</p>
      <p><a href="${link}" style="color:#FF3399">${link}</a></p>
      <p>Хэрэв та энэ хүсэлтийг гаргаагүй бол энэ имэйлийг үл тоомсорлоно уу.</p>
      <p style="color:#999">— Hatantsetseg lash</p>
    </div>`,
  });
}
