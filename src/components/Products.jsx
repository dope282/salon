'use client';
import { useEffect, useState } from 'react';
import { supabase }  from '@/lib/supabase';
import { useUI }     from '@/contexts/UIContext';

export default function Products() {
  const { showToast, openBooking } = useUI();
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [dbError,  setDbError]  = useState('');
  const [filter,   setFilter]   = useState('');

  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('sort_order')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error('[Products]', error);
          setDbError(error.message);
        }
        setProducts(data || []);
        setLoading(false);
      });
  }, []);

  const cats    = ['Бүгд', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];
  const visible = filter && filter !== 'Бүгд' ? products.filter(p => p.category === filter) : products;

  const handleBuy = (p) => {
    if (!p.in_stock) return;
    showToast(`"${p.name}" захиалахын тулд биднийтэй холбогтно уу 📞`, 'ok');
  };

  return (
    <section className="products-section" id="products">
      <div className="sec-header">
        <h2 className="sec-title">Манай <span>Бүтээгдэхүүн</span></h2>
        <button className="btn-ghost" onClick={openBooking}>Захиалах →</button>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--gray-500)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <div style={{ fontSize: 14 }}>Ачааллаж байна...</div>
        </div>
      )}

      {/* ── DB error ── */}
      {!loading && dbError && (
        <div style={{ background: '#fff5f5', border: '1.5px solid #fecaca', borderRadius: 14, padding: '24px 28px', color: 'var(--red)', fontSize: 13 }}>
          <strong>Алдаа:</strong> {dbError}
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--gray-500)' }}>
            Supabase SQL Editor дээр products хүснэгт болон GRANT SQL-ийг ажиллуулсан эсэхийг шалгана уу.
          </div>
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && !dbError && products.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--gray-500)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Бүтээгдэхүүн байхгүй байна</div>
          <div style={{ fontSize: 13 }}>Admin панелиас бүтээгдэхүүн нэмнэ үү</div>
        </div>
      )}

      {/* ── Products grid ── */}
      {!loading && !dbError && products.length > 0 && (
        <>
          {cats.length > 2 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
              {cats.map(c => (
                <button key={c} onClick={() => setFilter(c === 'Бүгд' ? '' : c)}
                  style={{
                    padding: '7px 18px', borderRadius: 50, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '2px solid',
                    borderColor: (filter === c || (!filter && c === 'Бүгд')) ? 'var(--pink)' : 'var(--gray-200)',
                    background:  (filter === c || (!filter && c === 'Бүгд')) ? 'var(--pink-light)' : '#fff',
                    color:       (filter === c || (!filter && c === 'Бүгд')) ? 'var(--pink-dark)' : 'var(--gray-500)',
                    transition: 'all .2s',
                  }}>
                  {c}
                </button>
              ))}
            </div>
          )}

          <div className="products-grid">
            {visible.map((p, i) => (
              <div key={p.id} className="prod-card">
                {p.image_url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={p.image_url} alt={p.name} className="prod-img" />
                  : <div className="prod-img-ph">🛒</div>
                }
                <div className="prod-body">
                  {p.category && <span className="prod-cat">{p.category}</span>}
                  <div className="prod-name">{p.name}</div>
                  {p.description && <div className="prod-desc">{p.description}</div>}
                  <div className="prod-footer">
                    <span className="prod-price">{p.price.toLocaleString()}₮</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {!p.in_stock && <span className="prod-out">Дууссан</span>}
                      <button className="btn-buy" disabled={!p.in_stock} onClick={() => handleBuy(p)}>
                        {p.in_stock ? 'Авах' : 'Дууссан'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
