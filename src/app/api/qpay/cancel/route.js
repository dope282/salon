import { NextResponse } from 'next/server';
import { cancelInvoice, checkPayment } from '@/lib/qpay';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TBL = (t) => (t === 'product_orders' ? 'product_orders' : 'bookings');

// Төлбөр төлөгдөөгүй захиалга/захиалгыг цуцлах
export async function POST(req) {
  try {
    const body = await req.json();
    const recordId = body.recordId || body.bookingId;
    const tbl = TBL(body.table);
    if (!recordId) return NextResponse.json({ error: 'recordId шаардлагатай' }, { status: 400 });

    const { data: rec } = await supabaseAdmin.from(tbl)
      .select('qpay_invoice_id, paid').eq('id', recordId).single();
    if (!rec) return NextResponse.json({ ok: true });
    if (rec.paid) return NextResponse.json({ paid: true });

    if (rec.qpay_invoice_id) {
      const result = await checkPayment(rec.qpay_invoice_id).catch(() => ({ paid: false }));
      if (result.paid) {
        const upd = { paid: true, paid_at: new Date().toISOString() };
        upd.status = tbl === 'bookings' ? 'confirmed' : 'paid';
        await supabaseAdmin.from(tbl).update(upd).eq('id', recordId);
        return NextResponse.json({ paid: true });
      }
      await cancelInvoice(rec.qpay_invoice_id);
    }

    await supabaseAdmin.from(tbl).delete().eq('id', recordId);
    return NextResponse.json({ ok: true, cancelled: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
