'use client';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUI }   from '@/contexts/UIContext';
import { supabase } from '@/lib/supabase';

const SERVICES_FB = [
  { name:'Lash Extension', price:45000, ico:'👁️' },
  { name:'Brow Lamination', price:35000, ico:'✨' },
  { name:'Маникюр & Гель', price:28000, ico:'💅' },
  { name:'Педикюр', price:35000, ico:'🦶' },
  { name:'Нүүрний будалт', price:70000, ico:'💄' },
  { name:'Wax үйлчилгээ', price:18000, ico:'🌿' },
];
const ARTISTS_FB = [
  { name:'Хатанцэцэг',  specialty_mn:'Lash мэргэжилтэн', avatar_emoji:'👩‍🦱', active:true },
  { name:'Дэлгэрцэцэг', specialty_mn:'Brow & Lash',       avatar_emoji:'👩‍🦰', active:true },
  { name:'Өнөржаргал',  specialty_mn:'Nails мэргэжилтэн', avatar_emoji:'👩',   active:true },
  { name:'Номин',        specialty_mn:'Будалт & Wax',      avatar_emoji:'👩‍🦳', active:true },
];
const TIMES   = ['09:00','10:00','11:00','12:00','13:00','14:00','16:00','17:00'];
const UNAVAIL = ['15:00'];
const MONTHS  = ['Нэгдүгээр сар','Хоёрдугаар сар','Гуравдугаар сар','Дөрөвдүгээр сар','Тавдугаар сар','Зургаадугаар сар','Долдугаар сар','Наймдугаар сар','Есдүгээр сар','Аравдугаар сар','Арван нэгдүгээр сар','Арван хоёрдугаар сар'];
const INIT_BK = { svc:null, price:0, ico:'✂️', art:null, date:null, time:null, pay:'cash' };

export default function BookingModal() {
  const { user } = useAuth();
  const { bookingOpen, closeBooking, showToast } = useUI();
  const [step, setStep]     = useState(1);
  const [bk, setBk]         = useState(INIT_BK);
  const [calY, setCalY]     = useState(new Date().getFullYear());
  const [calM, setCalM]     = useState(new Date().getMonth());
  const [loading, setLoading] = useState(false);
  const [artists, setArtists]   = useState(ARTISTS_FB);
  const [services, setServices] = useState(SERVICES_FB);
  const nameRef  = useRef();
  const phoneRef = useRef();

  useEffect(() => {
    supabase.from('artists').select('*').order('id')
      .then(({ data }) => { if (data?.length) setArtists(data); });
    supabase.from('services').select('*').eq('active', true).order('id')
      .then(({ data }) => { if (data?.length) setServices(data.map(s => ({ name:s.name_mn, price:s.price_from, ico:s.emoji }))); });
  }, []);

  const reset = () => { setStep(1); setBk(INIT_BK); setCalY(new Date().getFullYear()); setCalM(new Date().getMonth()); };
  const handleClose = () => { closeBooking(); reset(); };

  const next = async () => {
    if (step === 1 && !bk.svc) { showToast('Үйлчилгээ сонгоно уу', 'err'); return; }
    if (step === 2 && !bk.art) { showToast('Уран бүтээлч сонгоно уу', 'err'); return; }
    if (step === 3 && (!bk.date || !bk.time)) { showToast('Огноо болон цагаа сонгоно уу', 'err'); return; }
    if (step === 4) { await confirm(); return; }
    setStep(s => s + 1);
  };

  const confirm = async () => {
    if (loading) return;
    const name  = nameRef.current?.value.trim();
    const phone = phoneRef.current?.value.trim();
    if (!name)  { showToast('Нэрээ оруулна уу', 'err'); return; }
    if (!phone) { showToast('Утасны дугаараа оруулна уу', 'err'); return; }
    setLoading(true);
    const dateStr = bk.date ? `${bk.date.getFullYear()}-${String(bk.date.getMonth()+1).padStart(2,'0')}-${String(bk.date.getDate()).padStart(2,'0')}` : null;
    const { error } = await supabase.from('bookings').insert([{
      customer_name: name, customer_phone: phone, customer_email: user?.email || null,
      service_name: bk.svc, artist_name: bk.art, booking_date: dateStr,
      booking_time: bk.time, payment_method: bk.pay, total_price: bk.price,
      status: 'pending', user_id: user?.id || null,
    }]);
    setLoading(false);
    if (error) { showToast('Алдаа гарлаа. Дахин оролдоно уу.', 'err'); return; }
    handleClose();
    showToast('Захиалга баталгаажлаа! Удахгүй уулзана 🎉', 'ok');
  };

  const chgMonth = (dir) => setCalM(m => { let nm = m+dir; if (nm<0){setCalY(y=>y-1);return 11;} if(nm>11){setCalY(y=>y+1);return 0;} return nm; });
  const pickDay  = (d) => setBk(b => ({ ...b, date: new Date(calY, calM, d) }));

  const renderCal = () => {
    const fd = new Date(calY, calM, 1).getDay();
    const dim = new Date(calY, calM+1, 0).getDate();
    const today = new Date(); today.setHours(0,0,0,0);
    const cells = [];
    for (let i=0; i<fd; i++) cells.push(<button key={`e${i}`} className="cal-d cal-empty aspect-square rounded-full border-none bg-transparent cursor-default pointer-events-none" disabled />);
    for (let d=1; d<=dim; d++) {
      const dt = new Date(calY, calM, d);
      const past  = dt < today;
      const isT   = dt.toDateString() === today.toDateString();
      const isSel = bk.date && dt.toDateString() === bk.date.toDateString();
      cells.push(
        <button key={d} onClick={() => pickDay(d)} disabled={past}
          className={`cal-d aspect-square rounded-full border-none text-xs flex items-center justify-center transition-all cursor-pointer ${isSel ? 'cal-sel' : isT && !past ? 'cal-today' : 'bg-transparent text-dark'} disabled:text-gray-200 disabled:cursor-not-allowed`}>
          {d}
        </button>
      );
    }
    return cells;
  };

  const fmtDate = (d) => d ? d.toLocaleDateString('mn-MN', { year:'numeric', month:'long', day:'numeric' }) : '—';
  if (!bookingOpen) return null;

  const H3 = ({ children }) => <h3 className="font-serif text-[22px] font-semibold text-dark mb-6 max-[640px]:text-lg max-[640px]:mb-4">{children}</h3>;

  return (
    <div className="overlay active" onClick={e => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className="modal modal-sheet bg-[#FFFAF5] backdrop-blur-xl rounded-[28px] w-full max-w-[800px] max-h-[90vh] overflow-y-auto p-11 relative border border-gold/15 shadow-[0_32px_80px_rgba(0,0,0,.18)] max-[640px]:p-4" onClick={e => e.stopPropagation()}>
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#B8960C] via-[#D4AF37] to-[#C9A84C] rounded-t-[28px]" />
        <button onClick={handleClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full border border-gold/20 bg-gold/8 cursor-pointer text-base text-dark/40 flex items-center justify-center transition-all hover:bg-gold/20 hover:text-dark z-10">
          ✕
        </button>

        {/* Steps */}
        <div className="flex items-center mb-10 max-[640px]:mb-4">
          {[['Үйлчилгээ','1'],['Уран бүтээлч','2'],['Огноо & Цаг','3'],['Хянах','4']].map(([lbl,n],i) => {
            const s = i+1;
            return (
              <div key={n} className={`step-item flex flex-col items-center gap-2 flex-1${s<step?' done':s===step?' cur':''}`}>
                <div className={`step-circle w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all relative z-[1] max-[640px]:w-8 max-[640px]:h-8 max-[640px]:text-xs ${s<=step ? 'border-gold bg-gradient-to-br from-[#B8960C] to-[#C9A84C] text-white shadow-[0_2px_8px_rgba(201,168,76,.40)]' : 'border-gold/20 bg-white text-dark/30'}`}>
                  {s<step ? '✓' : n}
                </div>
                <div className={`text-xs font-medium text-center max-[640px]:text-[10px] ${s===step ? 'text-pink font-bold' : 'text-gray-500'}`}>{lbl}</div>
              </div>
            );
          })}
        </div>

        {/* STEP 1: Services */}
        {step === 1 && (
          <div className="sc active">
            <H3>Үйлчилгээ сонгох</H3>
            <div className="grid grid-cols-3 gap-3.5 max-[900px]:grid-cols-2 max-[640px]:grid-cols-2 max-[640px]:gap-2">
              {services.map((s,i) => (
                <div key={i} onClick={() => setBk(b => ({ ...b, svc:s.name, price:s.price, ico:s.ico }))}
                  className={`border-2 rounded-2xl p-4 cursor-pointer transition-all flex items-center gap-3 max-[640px]:p-3 max-[640px]:gap-2.5 ${bk.svc===s.name ? 'border-pink bg-pink-light' : 'border-gray-200 hover:border-pink-light hover:bg-pink-light'}`}>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-[22px] flex-shrink-0 transition-all max-[640px]:w-10 max-[640px]:h-10 max-[640px]:text-[18px] ${bk.svc===s.name ? 'bg-pink' : 'bg-gray-100'}`}>{s.ico}</div>
                  <div>
                    <div className="font-semibold text-sm max-[640px]:text-[13px]">{s.name}</div>
                    <div className="text-[13px] text-pink font-semibold max-[640px]:text-xs">₮{s.price.toLocaleString()}+</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Artists */}
        {step === 2 && (
          <div className="sc active">
            <H3>Уран бүтээлч сонгох</H3>
            <div className="grid grid-cols-4 gap-3.5 max-[900px]:grid-cols-3 max-[640px]:grid-cols-2 max-[640px]:gap-2 max-[480px]:grid-cols-2">
              {artists.map((a) => {
                const inactive = a.active === false;
                return (
                  <div key={a.id ?? a.name} onClick={() => !inactive && setBk(b => ({ ...b, art:a.name }))}
                    className={`border-2 rounded-2xl p-4 text-center transition-all relative max-[640px]:p-3 ${inactive ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${bk.art===a.name ? 'border-pink bg-pink-light' : 'border-gray-200 hover:border-pink-light'}`}>
                    {inactive && (
                      <div className="absolute top-1.5 right-1.5 bg-[#fee2e2] text-[#dc2626] text-[9px] font-bold px-1.5 py-0.5 rounded-full">Ажиллахгүй</div>
                    )}
                    <div className="w-[70px] h-[70px] rounded-full mx-auto mb-2.5 bg-gradient-to-br from-[#FFD6E8] to-[#FFBCD9] flex items-center justify-center text-[30px] max-[640px]:w-14 max-[640px]:h-14 max-[640px]:text-2xl">
                      {a.avatar_emoji || a.emoji || '👩'}
                    </div>
                    <div className="font-bold text-sm max-[640px]:text-xs">{a.name}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">{a.specialty_mn || a.role}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: Date & Time */}
        {step === 3 && (
          <div className="sc active">
            <H3>Огноо & Цаг сонгох</H3>
            <div className="grid grid-cols-2 gap-7 max-[900px]:grid-cols-1">
              {/* Calendar */}
              <div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-[1px] mb-3.5">Огноо сонгох</div>
                <div className="border border-gray-200 rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3.5 bg-gray-100">
                    <button onClick={() => chgMonth(-1)} className="w-[30px] h-[30px] rounded-full border-none bg-white cursor-pointer flex items-center justify-center text-gray-500 text-base transition-all hover:bg-pink hover:text-white">‹</button>
                    <span className="font-bold text-sm">{MONTHS[calM]} {calY}</span>
                    <button onClick={() => chgMonth(1)} className="w-[30px] h-[30px] rounded-full border-none bg-white cursor-pointer flex items-center justify-center text-gray-500 text-base transition-all hover:bg-pink hover:text-white">›</button>
                  </div>
                  <div className="p-3.5">
                    <div className="grid grid-cols-7 text-center mb-1.5">
                      {'Ня Да Мя Лх Пү Ба Бя'.split(' ').map(d => (
                        <span key={d} className="text-[11px] font-bold text-gray-500 py-1">{d}</span>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-0.5">{renderCal()}</div>
                  </div>
                </div>
              </div>
              {/* Time */}
              <div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-[1px] mb-3.5">Цаг сонгох</div>
                <div className="grid grid-cols-2 gap-2 max-[640px]:grid-cols-3 max-[640px]:gap-1.5">
                  {TIMES.map(t => (
                    <button key={t} onClick={() => setBk(b => ({ ...b, time:t }))}
                      className={`border-2 rounded-lg py-2.5 text-center text-[13px] font-medium cursor-pointer transition-all max-[640px]:py-2.5 max-[640px]:text-xs min-h-[44px] ${bk.time===t ? 'bg-pink border-pink text-white font-bold' : 'border-gray-200 bg-white hover:border-pink hover:text-pink'}`}>
                      {t}
                    </button>
                  ))}
                  {UNAVAIL.map(t => (
                    <button key={t} disabled className="border-2 border-gray-200 rounded-lg py-2.5 text-[13px] bg-gray-100 text-gray-200 cursor-not-allowed pointer-events-none max-[640px]:text-xs min-h-[44px]">{t}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Review */}
        {step === 4 && (
          <div className="sc active">
            <H3>Хянах & Баталгаажуулах</H3>
            <div className="grid grid-cols-2 gap-7 max-[900px]:grid-cols-1">
              <div>
                <h4 className="text-base font-bold mb-4 pb-3 border-b border-gray-200">Захиалгын хураангуй</h4>
                {[
                  { ico: bk.ico, lbl:'Үйлчилгээ', val: bk.svc, extra: `₮${bk.price.toLocaleString()}` },
                  { ico: '👩‍🦱',  lbl:'Уран бүтээлч', val: bk.art },
                  { ico: '📅',  lbl:'Огноо & Цаг', val: `${fmtDate(bk.date)} · ${bk.time}` },
                ].map(({ ico, lbl, val, extra }) => (
                  <div key={lbl} className="flex items-center gap-3 mb-3.5">
                    <div className="w-11 h-11 rounded-full bg-pink-light flex items-center justify-center text-[18px] flex-shrink-0">{ico}</div>
                    <div className="flex-1">
                      <div className="text-[11px] text-gray-500 uppercase tracking-[.5px]">{lbl}</div>
                      <div className="text-sm font-semibold">{val}</div>
                    </div>
                    {extra && <div className="font-bold ml-auto">{extra}</div>}
                  </div>
                ))}
                <div className="flex justify-between py-3.5 border-t-2 border-gray-200 mt-1.5">
                  <span className="text-[15px] font-bold">Нийт үнэ</span>
                  <span className="text-xl font-bold text-pink">₮{bk.price.toLocaleString()}</span>
                </div>
                <div className="mt-4 border-t border-gray-200 pt-3.5">
                  <div className="text-sm font-semibold text-dark mb-2.5">Холбоо барих мэдээлэл</div>
                  <div className="mb-2.5">
                    <label className="block text-xs font-semibold mb-1">Таны нэр <span className="text-salon-red">*</span></label>
                    <input ref={nameRef} type="text" placeholder="Овог Нэр" defaultValue={user?.user_metadata?.full_name || ''}
                      className="w-full px-3 py-2 border-[1.5px] border-gray-200 rounded-xl text-sm font-sans outline-none focus:border-gold transition-all max-[640px]:text-base" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Утасны дугаар <span className="text-salon-red">*</span></label>
                    <input ref={phoneRef} type="tel" placeholder="99xxxxxx"
                      className="w-full px-3 py-2 border-[1.5px] border-gray-200 rounded-xl text-sm font-sans outline-none focus:border-gold transition-all max-[640px]:text-base" />
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-base font-bold mb-4 pb-3 border-b border-gray-200">Төлбөрийн арга</h4>
                {[{method:'card',ico:'💳',lbl:'Кредит / Дебит карт'},{method:'qpay',ico:'📱',lbl:'QPay'},{method:'cash',ico:'💵',lbl:'Ирэхэд бэлнээр'}].map(p => (
                  <div key={p.method} onClick={() => setBk(b => ({ ...b, pay:p.method }))}
                    className={`flex items-center gap-3 px-4 py-3 border-2 rounded-2xl cursor-pointer mb-2.5 transition-all hover:border-pink-light ${bk.pay===p.method ? 'border-pink bg-pink-light' : 'border-gray-200'}`}>
                    <input type="radio" name="pay" readOnly checked={bk.pay===p.method} className="accent-pink" />
                    <span className="text-xl">{p.ico}</span>
                    <span className="text-sm font-medium">{p.lbl}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between mt-7 pt-5 border-t border-gray-200 max-[640px]:pt-3 max-[640px]:mt-3 max-[380px]:flex-col-reverse max-[380px]:gap-2">
          <button onClick={() => setStep(s => s-1)} disabled={step <= 1}
            className={`bg-gray-100 text-gray-800 border-none px-7 py-3 rounded-full text-sm font-semibold cursor-pointer transition-all hover:bg-gray-200 max-[380px]:w-full max-[380px]:min-h-[50px] ${step <= 1 ? 'invisible pointer-events-none' : ''}`}>
            ← Буцах
          </button>
          <button disabled={loading} onClick={next}
            className="bg-gradient-to-r from-[#B8960C] via-[#D4AF37] to-[#C9A84C] text-dark border-none px-7 py-3 rounded-full text-sm font-bold cursor-pointer transition-all shadow-[0_4px_18px_rgba(201,168,76,.40)] hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(201,168,76,.55)] disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 tracking-wide max-[380px]:w-full max-[380px]:min-h-[50px]">
            {loading ? 'Хадгалж байна...' : step === 4 ? '✓ Захиалга баталгаажуулах' : 'Дараах →'}
          </button>
        </div>
      </div>
    </div>
  );
}
