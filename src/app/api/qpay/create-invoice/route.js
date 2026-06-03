import { NextResponse } from 'next/server';
import { createInvoice } from '@/lib/qpay';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TBL = (t) => (t === 'product_orders' ? 'product_orders' : 'bookings');

export async function POST(req) {
  try {
    const body = await req.json();
    const { amount, description, table } = body;
    const recordId = body.recordId || body.bookingId;
    if (!recordId || !amount) {
      return NextResponse.json({ error: 'recordId, amount шаардлагатай' }, { status: 400 });
    }
    const tbl = TBL(table);
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
    const callbackUrl = `${baseUrl}/api/qpay/callback?id=${recordId}&table=${tbl}`;

    const invoice = await createInvoice({
      amount: Number(amount),
      description,
      senderInvoiceNo: recordId,
      callbackUrl,
    });

    await supabaseAdmin.from(tbl).update({ qpay_invoice_id: invoice.invoice_id }).eq('id', recordId);

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
