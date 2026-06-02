import { NextResponse } from 'next/server';
import { createInvoice } from '@/lib/qpay';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { bookingId, amount, description } = await req.json();
    if (!bookingId || !amount) {
      return NextResponse.json({ error: 'bookingId, amount шаардлагатай' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
    const callbackUrl = `${baseUrl}/api/qpay/callback?booking_id=${bookingId}`;

    const invoice = await createInvoice({
      amount: Number(amount),
      description,
      senderInvoiceNo: bookingId,
      callbackUrl,
    });

    // Захиалга дээр qpay invoice_id-г хадгална
    await supabaseAdmin.from('bookings')
      .update({ qpay_invoice_id: invoice.invoice_id })
      .eq('id', bookingId);

    return NextResponse.json({
      invoice_id: invoice.invoice_id,
      qr_text: invoice.qr_text,
      qr_image: invoice.qr_image,
      short_url: invoice.qPay_shortUrl,
      urls: invoice.urls || [],
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
