'use client';
import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUI }   from '@/contexts/UIContext';
import { supabase } from '@/lib/supabase';

const SERVICES = [
  { name:'Lash Extension',    price:45000, ico:'👁️' },
  { name:'Brow Lamination',   price:35000, ico:'✨' },
  { name:'Маникюр & Гель',    price:28000, ico:'💅' },
  { name:'Педикюр',           price:35000, ico:'🦶' },
  { name:'Нүүрний будалт',    price:70000, ico:'💄' },
  { name:'Wax үйлчилгээ',     price:18000, ico:'🌿' },
];

const ARTISTS = [
  { name:'Хатанцэцэг',  role:'Lash мэргэжилтэн', emoji:'👩‍🦱' },
  { name:'Дэлгэрцэцэг', role:'Brow & Lash',       emoji:'👩‍🦰' },
  { name:'Өнөржаргал',  role:'Hails мэргэжилтэн', emoji:'👩' },
  { name:'Номин',        role:'Будалт & Wax',      emoji:'👩‍🦳' },
];

const TIMES = ['09:00','10:00','11:00','12:00','13:00','14:00','16:00','17:00'];
const UNAVAIL = ['15:00'];
const MONTHS = ['Нэгдүгээр сар','Хоёрдугаар сар','Гуравдугаар сар','Дөрөвдүгээр сар','Тавдугаар сар','Зургаадугаар сар','Долдугаар сар','Наймдугаар сар','Есдүгээр сар','Аравдугаар сар','Арван нэгдүгээр сар','Арван хоёрдугаар сар'];

const INIT_BK = { svc:null, price:0, ico:'✂️', art:null, date:null, time:null, pay:'cash' };

export default function BookingModal() {
  const { user } = useAuth();
  const { bookingOpen, closeBooking, showToast } = useUI();

  const [step, setStep]   = useState(1);
  const [bk, setBk]       = useState(INIT_BK);
  const [calY, setCalY]   = useState(new Date().getFullYear());
  const [calM, setCalM]   = useState(new Date().getMonth());
  const [loading, setLoading] = useState(false);

  const nameRef  = useRef();
  const phoneRef = useRef();

  const reset = () => {
    setStep(1); setBk(INIT_BK);
    setCalY(new Date().getFullYear()); setCalM(new Date().getMonth());
  };

  const handleClose = () => { closeBooking(); reset(); };

  const next = async () => {
    if (step === 1 && !bk.svc)  { showToast('Үйлчилгээ сонгоно уу', 'err'); return; }
    if (step === 2 && !bk.art)  { showToast('Уран бүтээлч сонгоно уу', 'err'); return; }
    if (step === 3 && (!bk.date || !bk.time)) { showToast('Огноо болон цагаа сонгоно уу', 'err'); return; }
    if (step === 4) { await confirm(); return; }
    setStep(s => s + 1);
  };

  const confirm = async () => {
    const name  = nameRef.current?.value.trim();
    const phone = phoneRef.current?.value.trim();
    if (!name)  { showToast('Нэрээ оруулна уу', 'err'); return; }
    if (!phone) { showToast('Утасны дугаараа оруулна уу', 'err'); return; }
    setLoading(true);
    const dateStr = bk.date
      ? `${bk.date.getFullYear()}-${String(bk.date.getMonth()+1).padStart(2,'0')}-${String(bk.date.getDate()).padStart(2,'0')}`
      : null;
    const { error } = await supabase.from('bookings').insert([{
      customer_name:  name,
      customer_phone: phone,
      customer_email: user?.email || null,
      service_name:   bk.svc,
      artist_name:    bk.art,
      booking_date:   dateStr,
      booking_time:   bk.time,
      payment_method: bk.pay,
      total_price:    bk.price,
      status:         'pending',
      user_id:        user?.id || null,
    }]);
    setLoading(false);
    if (error) { showToast('Алдаа гарлаа. Дахин оролдоно уу.', 'err'); return; }
    handleClose();
    showToast('Захиалга баталгаажлаа! Удахгүй уулзана 🎉', 'ok');
  };

  // Calendar helpers
  const chgMonth = (dir) => {
    setCalM(m => { let nm = m + dir; if (nm < 0) { setCalY(y=>y-1); return 11; } if (nm > 11) { setCalY(y=>y+1); return 0; } return nm; });
  };
  const pickDay = (d) => setBk(b => ({ ...b, date: new Date(calY, calM, d) }));

  const renderCal = () => {
    const fd = new Date(calY, calM, 1).getDay();
    const dim = new Date(calY, calM+1, 0).getDate();
    const today = new Date(); today.setHours(0,0,0,0);
    const cells = [];
    for (let i = 0; i < fd; i++) cells.push(<button key={`e${i}`} className="cal-d cal-empty" disabled />);
    for (let d = 1; d <= dim; d++) {
      const dt = new Date(calY, calM, d);
      const past  = dt < today;
      const isT   = dt.toDateString() === today.toDateString();
      const isSel = bk.date && dt.toDateString() === bk.date.toDateString();
      cells.push(
        <button key={d} className={`cal-d${isT&&!past?' cal-today':''}${isSel?' cal-sel':''}`} disabled={past} onClick={() => pickDay(d)}>
          {d}
        </button>
      );
    }
    return cells;
  };

  const fmtDate = (d) => d ? d.toLocaleDateString('mn-MN', { year:'numeric', month:'long', day:'numeric' }) : '—';

  if (!bookingOpen) return null;

  return (
    <div className="overlay active" onClick={e => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-x" onClick={handleClose}>✕</button>

        {/* Step indicators */}
        <div className="steps-row">
          {[['Үйлчилгээ','1'],['Уран бүтээлч','2'],['Огноо & Цаг','3'],['Хянах','4']].map(([lbl, n], i) => {
            const s = i + 1;
            return (
              <div key={n} className={`step-item${s < step ? ' done' : ''}${s === step ? ' cur' : ''}`}>
                <div className="step-circle">{s < step ? '✓' : n}</div>
                <div className="step-lbl">{lbl}</div>
              </div>
            );
          })}
        </div>

        {/* STEP 1: Service */}
        {step === 1 && (
          <div className="sc active">
            <h3>Үйлчилгээ сонгох</h3>
            <div className="svc-sel-grid">
              {SERVICES.map((s, i) => (
                <div key={i} className={`svc-sel-card${bk.svc === s.name ? ' sel' : ''}`}
                  onClick={() => setBk(b => ({ ...b, svc:s.name, price:s.price, ico:s.ico }))}>
                  <div className="svc-sel-ico">{s.ico}</div>
                  <div>
                    <div className="svc-sel-name">{s.name}</div>
                    <div className="svc-sel-price">₮{s.price.toLocaleString()}+</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Artist */}
        {step === 2 && (
          <div className="sc active">
            <h3>Уран бүтээлч сонгох</h3>
            <div className="art-sel-grid">
              {ARTISTS.map((a, i) => (
                <div key={i} className={`art-sel-card${bk.art === a.name ? ' sel' : ''}`}
                  onClick={() => setBk(b => ({ ...b, art:a.name }))}>
                  <div className="art-sel-av">{a.emoji}</div>
                  <div className="artist-name">{a.name}</div>
                  <div className="artist-role">{a.role}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Date & Time */}
        {step === 3 && (
          <div className="sc active">
            <h3>Огноо & Цаг сонгох</h3>
            <div className="cal-booking">
              <div className="cal-wrap">
                <h4>Огноо сонгох</h4>
                <div className="calendar">
                  <div className="cal-head">
                    <button className="cal-nav-btn" onClick={() => chgMonth(-1)}>‹</button>
                    <span className="cal-month">{MONTHS[calM]} {calY}</span>
                    <button className="cal-nav-btn" onClick={() => chgMonth(1)}>›</button>
                  </div>
                  <div className="cal-body">
                    <div className="cal-wk">{'Ня Да Мя Лх Пү Ба Бя'.split(' ').map(d => <span key={d}>{d}</span>)}</div>
                    <div className="cal-days-grid">{renderCal()}</div>
                  </div>
                </div>
              </div>
              <div className="time-wrap">
                <h4>Цаг сонгох</h4>
                <div className="time-slots-grid">
                  {TIMES.map(t => (
                    <button key={t} className={`ts${bk.time === t ? ' sel' : ''}`} onClick={() => setBk(b => ({ ...b, time:t }))}>{t}</button>
                  ))}
                  {UNAVAIL.map(t => <button key={t} className="ts unavail" disabled>{t}</button>)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Review */}
        {step === 4 && (
          <div className="sc active">
            <h3>Хянах & Баталгаажуулах</h3>
            <div className="review-grid">
              <div className="review-box">
                <h4>Захиалгын хураангуй</h4>
                <div className="sum-item">
                  <div className="sum-ico">{bk.ico}</div>
                  <div><div className="sum-lbl">Үйлчилгээ</div><div className="sum-val">{bk.svc}</div></div>
                  <div style={{ marginLeft:'auto', fontWeight:700 }}>₮{bk.price.toLocaleString()}</div>
                </div>
                <div className="sum-item">
                  <div className="sum-ico">👩‍🦱</div>
                  <div><div className="sum-lbl">Уран бүтээлч</div><div className="sum-val">{bk.art}</div></div>
                </div>
                <div className="sum-item">
                  <div className="sum-ico">📅</div>
                  <div><div className="sum-lbl">Огноо & Цаг</div><div className="sum-val">{fmtDate(bk.date)} · {bk.time}</div></div>
                </div>
                <div className="sum-total">
                  <span className="tl">Нийт үнэ</span>
                  <span className="tp">₮{bk.price.toLocaleString()}</span>
                </div>
                {/* Contact fields */}
                <div style={{ marginTop:16, borderTop:'1px solid var(--gray-200)', paddingTop:14 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--dark)', marginBottom:10 }}>Холбоо барих мэдээлэл</div>
                  <div className="login-field" style={{ marginBottom:10 }}>
                    <label style={{ fontSize:12 }}>Таны нэр <span style={{ color:'#E53E3E' }}>*</span></label>
                    <input ref={nameRef} className="contact-input" type="text" placeholder="Овог Нэр" defaultValue={user?.user_metadata?.full_name || ''} />
                  </div>
                  <div className="login-field" style={{ marginBottom:0 }}>
                    <label style={{ fontSize:12 }}>Утасны дугаар <span style={{ color:'#E53E3E' }}>*</span></label>
                    <input ref={phoneRef} className="contact-input" type="tel" placeholder="99xxxxxx" />
                  </div>
                </div>
              </div>
              <div className="pay-box">
                <h4>Төлбөрийн арга</h4>
                {[{method:'card',ico:'💳',lbl:'Кредит / Дебит карт'},{method:'qpay',ico:'📱',lbl:'QPay'},{method:'cash',ico:'💵',lbl:'Ирэхэд бэлнээр'}].map(p => (
                  <div key={p.method} className={`pay-opt${bk.pay === p.method ? ' sel' : ''}`}
                    onClick={() => setBk(b => ({ ...b, pay:p.method }))}>
                    <input type="radio" name="pay" readOnly checked={bk.pay === p.method} />
                    <span style={{ fontSize:20 }}>{p.ico}</span>
                    <span className="pay-lbl">{p.lbl}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer buttons */}
        <div className="modal-foot">
          <button className="btn-back" style={{ visibility: step > 1 ? 'visible' : 'hidden' }} onClick={() => setStep(s => s - 1)}>
            ← Буцах
          </button>
          <button className="btn-primary" disabled={loading} onClick={next}>
            {loading ? 'Хадгалж байна...' : step === 4 ? '✓ Захиалга баталгаажуулах' : 'Дараах →'}
          </button>
        </div>
      </div>
    </div>
  );
}
