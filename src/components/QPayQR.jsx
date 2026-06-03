'use client';
import { useState, useEffect } from 'react';

/**
 * QPay QR төлбөрийн overlay (дахин ашиглах).
 * - qr: { qr_image, urls, amount, recordId, table, title }
 * - onClose: ({ paid }) => void  — хаагдах/дуусахад дуудна
 * 5 минутын countdown, polling, цуцлах, амжилтын дэлгэц бүгд дотроо.
 */
export default function QPayQR({ qr, onClose }) {
  const [paid, setPaid] = useState(false);
  const [secs, setSecs] = useState(300);

  const doCancel = async (reason) => {
    try {
      await fetch('/api/qpay/cancel', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId: qr.recordId, table: qr.table }),
      });
    } catch {}
    onClose({ paid: false, reason });
  };

  // polling
  useEffect(() => {
    if (paid) return;
    const iv = setInterval(async () => {
      try {
        const r = await fetch('/api/qpay/check', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recordId: qr.recordId, table: qr.table }),
        });
        const d = await r.json();
        if (d.paid) { clearInterval(iv); setPaid(true); }
      } catch {}
    }, 3000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paid]);

  // countdown
  useEffect(() => {
    if (paid) return;
    setSecs(300);
    const iv = setInterval(() => {
      setSecs(p => { if (p <= 1) { clearInterval(iv); doCancel('timeout'); return 0; } return p - 1; });
    }, 1000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paid]);

  return (
    <div className="overlay active" style={{ zIndex: 2200 }} onClick={e => { if (e.target === e.currentTarget && !paid) doCancel(); }}>
      <div className="modal bg-[#606060] rounded-[28px] w-full max-w-[420px] p-8 relative border border-gold/15 shadow-[0_32px_80px_rgba(0,0,0,.25)] text-center max-[640px]:p-5" onClick={e => e.stopPropagation()}>
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#FF3399] via-[#FF66B2] to-[#FF3399] rounded-t-[28px]" />

        {paid ? (
          <>
            <button onClick={() => onClose({ paid: true })}
              className="absolute top-5 right-5 w-9 h-9 rounded-full border border-gold/20 bg-gold/8 cursor-pointer text-base text-pink-200 flex items-center justify-center hover:bg-gold/20 z-10">✕</button>
            <div className="py-6">
              <div className="text-[64px] mb-3">✅</div>
              <h3 className="font-serif text-[24px] font-semibold text-pink-200 mb-2">Төлбөр амжилттай!</h3>
              <p className="text-sm text-pink-400 mb-6">Захиалга баталгаажлаа. Баярлалаа! 🎉</p>
              <button onClick={() => onClose({ paid: true })}
                className="bg-gradient-to-r from-[#FF3399] via-[#FF66B2] to-[#FF3399] text-white border-none px-8 py-3 rounded-full text-sm font-bold cursor-pointer">
                Хаах
              </button>
            </div>
          </>
        ) : (
          <>
            <button onClick={() => doCancel()}
              className="absolute top-5 right-5 w-9 h-9 rounded-full border border-gold/20 bg-gold/8 cursor-pointer text-base text-pink-200 flex items-center justify-center hover:bg-gold/20 z-10">✕</button>

            <h3 className="font-serif text-[22px] font-semibold text-pink-200 mb-1">{qr.title || 'QPay-ээр төлөх'}</h3>
            <p className="text-sm text-pink-400 mb-1">Дүн: <span className="text-pink font-bold">₮{(qr.amount ?? 0).toLocaleString()}</span></p>
            <div className={`text-sm font-bold mb-2 ${secs <= 60 ? 'text-red-400' : 'text-pink-200'}`}>⏱ {Math.floor(secs/60)}:{String(secs%60).padStart(2,'0')}</div>

            {qr.qr_image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qr.qr_image.startsWith('data:') ? qr.qr_image : `data:image/png;base64,${qr.qr_image}`}
                alt="QPay QR" className="w-[220px] h-[220px] mx-auto rounded-2xl bg-white p-2 my-3" />
            )}
            <p className="text-xs text-pink-400 mb-3">Банкны апп-аараа QR кодыг уншуулна уу</p>

            {qr.urls?.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mb-4 max-h-[180px] overflow-y-auto">
                {qr.urls.map((u, i) => (
                  <a key={i} href={u.link} target="_blank" rel="noreferrer"
                    className="flex flex-col items-center gap-1 p-1.5 rounded-xl bg-[#707070] hover:bg-[#787878] transition-colors no-underline">
                    {u.logo
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={u.logo} alt={u.name} className="w-8 h-8 rounded-lg object-contain" />
                      : <span className="text-lg">🏦</span>}
                    <span className="text-[8px] text-pink-200 leading-tight text-center line-clamp-1">{u.name}</span>
                  </a>
                ))}
              </div>
            )}

            <div className="flex items-center justify-center gap-2 text-xs text-pink-400 mb-4">
              <div className="w-4 h-4 border-2 border-pink border-t-transparent rounded-full animate-spin" />
              Төлбөр шалгаж байна...
            </div>
            <button onClick={() => doCancel()}
              className="w-full py-2.5 rounded-full border border-red-400/40 bg-transparent text-red-400 text-sm font-semibold cursor-pointer hover:bg-red-400/10 transition-colors">
              Цуцлах
            </button>
          </>
        )}
      </div>
    </div>
  );
}
