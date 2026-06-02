import { NextResponse } from 'next/server';
import { checkPayment } from '@/lib/qpay';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// QPay төлбөр төлөгдсөний дараа энэ URL рүү дуудна (callback_url).
// booking_id-г query-д өгсөн тул түүгээр захиалгаа олж, төлбөрөө шалгаад баталгаажуулна.
export async function GET(req) {
  try {
    const bookingId = req.nextUrl.searchParams.get('booking_id');
    if (!bookingId) return NextResponse.json({ error: 'booking_id алга' }, { status: 400 });

    const { data: bk } = await supabaseAdmin.from('bookings')
      .select('qpay_invoice_id').eq('id', bookingId).single();
    if (!bk?.qpay_invoice_id) return NextResponse.json({ error: 'invoice олдсонгүй' }, { status: 404 });

    const result = await checkPayment(bk.qpay_invoice_id);
    if (result.paid) {
      await supabaseAdmin.from('bookings')
        .update({ paid: true, status: 'confirmed' }).eq('id', bookingId);
    }
    // QPay-д амжилттай хүлээж авсныг мэдэгдэнэ
    return NextResponse.json({ message: 'SUCCESS' });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Зарим тохиолдолд QPay POST-оор дуудаж болзошгүй
export async function POST(req) {
  return GET(req);
}
