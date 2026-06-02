import { NextResponse } from 'next/server';
import { checkPayment } from '@/lib/qpay';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Клиент энэ route-аар төлбөр төлөгдсөн эсэхийг тогтмол шалгана (polling)
export async function POST(req) {
  try {
    const { bookingId } = await req.json();
    if (!bookingId) return NextResponse.json({ error: 'bookingId шаардлагатай' }, { status: 400 });

    const { data: bk } = await supabaseAdmin.from('bookings')
      .select('qpay_invoice_id, paid').eq('id', bookingId).single();
    if (!bk?.qpay_invoice_id) return NextResponse.json({ paid: false });
    if (bk.paid) return NextResponse.json({ paid: true });

    const result = await checkPayment(bk.qpay_invoice_id);
    if (result.paid) {
      await supabaseAdmin.from('bookings')
        .update({ paid: true, status: 'confirmed' }).eq('id', bookingId);
    }
    return NextResponse.json({ paid: result.paid });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
