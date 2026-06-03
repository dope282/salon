'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase }  from '@/lib/supabase';
import { useUI }     from '@/contexts/UIContext';
import { useAuth }   from '@/contexts/AuthContext';
import RotatingImage from '@/components/RotatingImage';
import QPayQR        from '@/components/QPayQR';

export default function Products() {
  const { showToast, openBooking } = useUI();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [dbError,  setDbError]  = useState('');
  const [filter,   setFilter]   = useState('');
  const [buyProduct, setBuyProduct] = useState(null); // утас оруулах modal
  const [placing, setPlacing] = useState(false);
  const [qr, setQr] = useState(null); // QPayQR
  const buyPhoneRef = useRef();

  useEffect(() => {
    supabase.from('products').select('*').eq('active', true)
      .order('sort_order').order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) { console.error('[Products]', error); setDbError(error.message); }
        setProducts(data || []);
        setLoading(false);
      });
  }, []);

  const cats    = ['Бүгд', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];
  const visible = filter && filter !== 'Бүгд' ? products.filter(p => p.category === filter) : products;
  const handleBuy = (p) => { if (!p.in_stock) return; setBuyProduct(p); };

  const placeOrder = async () => {
    const phone = buyPhoneRef.current?.value.trim();
    if (!/^[0-9]{8}$/.test(phone || '')) { showToast('Утасны дугаар 8 оронтой байх ёстой', 'err'); return; }
    setPlacing(true);
    const p = buyProduct;
    const { data: order, error } = await supabase.from('product_orders').insert([{
      product_id: p.id, product_name: p.name, quantity: 1, price: p.price || 0,
      customer_phone: phone, customer_email: user?.email || null,
      status: 'pending', user_id: user?.id || null,
    }]).select('id').single();
    if (error) { setPlacing(false); showToast('Алдаа гарлаа. Дахин оролдоно уу.', 'err'); return; }
    try {
      const res = await fetch('/api/qpay/create-invoice', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId: order.id, table: 'product_orders', amount: p.price || 0, description: `🛍️ ${p.name}` }),
      });
      const data = await res.json();
      setPlacing(false);
      if (!res.ok) { showToast('QPay алдаа: ' + (data.error || ''), 'err'); return; }
      setBuyProduct(null);
      setQr({ ...data, recordId: order.id, table: 'product_orders', amount: p.price || 0, title: `🛍️ ${p.name}` });
    } catch {
      setPlacing(false);
      showToast('QPay-тэй холбогдсонгүй', 'err');
    }
  };

  const onQrClose = ({ paid }) => {
    setQr(null);
    showToast(paid ? 'Худалдан авалт амжилттай! 🎉' : 'Худалдан авалт цуцлагдлаа.', paid ? 'ok' : 'err');
  };

  return (
    <section id="products" className="py-[70px] px-12 bg-[#404040] max-[900px]:px-5 max-[900px]:py-12 max-[640px]:px-4 max-[640px]:py-9">
      <div className="flex justify-between items-end mb-12 max-[900px]:mb-8 max-[640px]:mb-7">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[3px] text-gold mb-2">Манай бүтээгдэхүүн</p>
          <h2 className="font-serif text-[36px] font-semibold tracking-tight text-pink-200 max-[900px]:text-[28px] max-[640px]:text-2xl">
            Онцгой <span className="gold-shimmer">Бүтээгдэхүүн</span>
          </h2>
        </div>
        <button onClick={openBooking}
          className="hidden md:block bg-[#606060] text-[#FF3399] border border-gold/30 px-6 py-2.5 rounded-full text-[13px] font-semibold cursor-pointer transition-all hover:bg-gradient-to-r hover:from-[#FF3399] hover:to-[#FF3399] hover:text-white hover:border-transparent whitespace-nowrap">
          Захиалах →
        </button>
      </div>

      {loading && (
        <div className="text-center py-16 text-pink-400">
          <div className="text-[36px] mb-3">✨</div>
          <div className="text-sm tracking-wide">Ачааллаж байна...</div>
        </div>
      )}

      {!loading && dbError && (
        <div className="bg-[#fff5f5] border border-[#fecaca] rounded-2xl px-7 py-5 text-salon-red text-sm">
          <strong>Алдаа:</strong> {dbError}
        </div>
      )}

      {!loading && !dbError && products.length === 0 && (
        <div className="text-center py-16 text-pink-400">
          <div className="text-[44px] mb-3">📦</div>
          <div className="font-semibold mb-1">Бүтээгдэхүүн байхгүй байна</div>
          <div className="text-sm">Admin панелиас бүтээгдэхүүн нэмнэ үү</div>
        </div>
      )}

      {!loading && !dbError && products.length > 0 && (
        <>
          {cats.length > 2 && (
            <div className="flex gap-2 flex-wrap mb-8">
              {cats.map(c => {
                const active = filter === c || (!filter && c === 'Бүгд');
                return (
                  <button key={c} onClick={() => setFilter(c === 'Бүгд' ? '' : c)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer border transition-all tracking-wide ${active ? 'border-gold bg-[#606060] text-[#FF3399]' : 'border-gold/15 bg-[#606060] text-pink-400 hover:border-gold/30 hover:text-[#FF3399]'}`}>
                    {c}
                  </button>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-5 gap-4 max-[1200px]:grid-cols-4 max-[900px]:grid-cols-3 max-[900px]:gap-3.5 max-[640px]:grid-cols-3 max-[640px]:gap-2.5">
            {visible.map((p) => (
              <div key={p.id} className="lux-card group bg-[#606060] rounded-2xl overflow-hidden transition-all duration-300 flex flex-col hover:-translate-y-1">
                {(() => {
                  const imgs = p.images?.length ? p.images : (p.image_url ? [p.image_url] : []);
                  return imgs.length
                    ? <RotatingImage images={imgs} alt={p.name} className="w-full aspect-[4/3]" dots />
                    : <div className="w-full aspect-[4/3] bg-gradient-to-br from-gold-light to-[#FFD0E6]/20 flex items-center justify-center text-[52px]">🛒</div>;
                })()}
                <div className="px-3 py-3 flex-1 flex flex-col max-[640px]:px-2 max-[640px]:py-2.5">
                  {p.category && (
                    <span className="inline-block bg-gold/10 text-[#FF3399] border border-gold/15 px-2 py-0.5 rounded-full text-[8px] font-bold tracking-[.6px] uppercase mb-1.5 self-start max-[640px]:hidden">
                      {p.category}
                    </span>
                  )}
                  <div className="text-[13px] font-semibold text-pink-200 mb-1 leading-[1.3] max-[640px]:text-[11px] max-[640px]:leading-tight">{p.name}</div>
                  {p.description && (
                    <div className="text-[11px] text-pink-200 leading-[1.5] mb-2.5 flex-1 overflow-hidden max-[640px]:hidden" style={{display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>
                      {p.description}
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2 mt-auto max-[640px]:flex-col max-[640px]:items-stretch max-[640px]:gap-1.5">
                    <span className="font-display text-[15px] font-bold text-[#FF3399] max-[640px]:text-[13px]">{(p.price ?? 0).toLocaleString()}₮</span>
                    <button disabled={!p.in_stock} onClick={() => handleBuy(p)}
                      className="bg-gradient-to-r from-[#FF3399] to-[#FF3399] text-white border-none px-3.5 py-1.5 rounded-full text-[11px] font-bold cursor-pointer transition-all hover:shadow-[0_4px_16px_rgba(255,51,153,.40)] hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0 max-[640px]:w-full max-[640px]:px-2 max-[640px]:py-2 max-[640px]:text-[10px]">
                      {p.in_stock ? 'Авах' : 'Дууссан'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Худалдан авах — утас оруулах modal */}
      {buyProduct && (
        <div className="overlay active" style={{ zIndex: 2100 }} onClick={e => { if (e.target === e.currentTarget) setBuyProduct(null); }}>
          <div className="modal bg-[#606060] rounded-[28px] w-full max-w-[400px] p-8 relative border border-gold/15 shadow-[0_32px_80px_rgba(0,0,0,.25)] max-[640px]:p-5" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#FF3399] via-[#FF66B2] to-[#FF3399] rounded-t-[28px]" />
            <button onClick={() => setBuyProduct(null)}
              className="absolute top-5 right-5 w-9 h-9 rounded-full border border-gold/20 bg-gold/8 cursor-pointer text-base text-pink-200 flex items-center justify-center hover:bg-gold/20 z-10">✕</button>

            <h3 className="font-serif text-[20px] font-semibold text-pink-200 mb-1">🛍️ Худалдан авах</h3>
            <div className="text-sm text-pink-200 font-semibold mb-1">{buyProduct.name}</div>
            <div className="text-pink font-bold text-lg mb-5">₮{(buyProduct.price ?? 0).toLocaleString()}</div>

            <label className="block text-xs font-semibold mb-1.5 text-pink-200 uppercase tracking-wide">Утасны дугаар</label>
            <input ref={buyPhoneRef} type="tel" placeholder="99xxxxxx" defaultValue={user?.user_metadata?.phone || ''}
              className="w-full text-pink-200 px-3 py-2.5 border-[1.5px] border-gold/20 rounded-xl text-sm font-sans outline-none focus:border-gold transition-all bg-[#707070] placeholder:text-pink-400 mb-4" />

            <button disabled={placing} onClick={placeOrder}
              className="w-full bg-gradient-to-r from-[#FF3399] via-[#FF66B2] to-[#FF3399] text-white border-none py-3 rounded-full text-sm font-bold cursor-pointer disabled:opacity-60">
              {placing ? 'Түр хүлээнэ үү...' : '📱 QPay-ээр төлж авах'}
            </button>
          </div>
        </div>
      )}

      {qr && <QPayQR qr={qr} onClose={onQrClose} />}
    </section>
  );
}
