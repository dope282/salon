import { NextResponse } from 'next/server';
import { checkPayment } from '@/lib/qpay';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TBL = (t) => (t === 'product_orders' ? 'product_orders' : 'bookings');

// QPay төлбөр төлөгдсөний дараа энэ URL рүү дуудна (callback_url).
export async function GET(req) {
  try {
    const sp = req.nextUrl.searchParams;
    const recordId = sp.get('id') || sp.get('booking_id');
    const tbl = TBL(sp.get('table'));
    if (!recordId) return NextResponse.json({ error: 'id алга' }, { status: 400 });

    const { data: rec } = await supabaseAdmin.from(tbl)
      .select('qpay_invoice_id').eq('id', recordId).single();
    if (!rec?.qpay_invoice_id) return NextResponse.json({ error: 'invoice олдсонгүй' }, { status: 404 });

    const result = await checkPayment(rec.qpay_invoice_id);
    if (result.paid) {
      const upd = { paid: true, paid_at: new Date().toISOString() };
      upd.status = tbl === 'bookings' ? 'confirmed' : 'paid';
      await supabaseAdmin.from(tbl).update(upd).eq('id', recordId);
    }
    return NextResponse.json({ message: 'SUCCESS' });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  return GET(req);
}
