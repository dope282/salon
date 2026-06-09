'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
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
const WORK_START = '09:00';   // өдрийн ажлын эхлэл (хуваарьгүй артистад)
const WORK_END   = '18:00';   // өдрийн ажлын төгсгөл
const LEAD_MIN   = 20;        // одооноос хамгийн багадаа хэдэн минутын дараа захиалж болох (буфер)

const timeToMin = (t) => { const [h, m] = String(t).split(':').map(Number); return h * 60 + m; };
const minToTime = (m) => `${String(Math.floor(m / 60)).padStart(2,'0')}:${String(m % 60).padStart(2,'0')}`;
const MONTHS  = ['Нэгдүгээр сар','Хоёрдугаар сар','Гуравдугаар сар','Дөрөвдүгээр сар','Тавдугаар сар','Зургаадугаар сар','Долдугаар сар','Наймдугаар сар','Есдүгээр сар','Аравдугаар сар','Арван нэгдүгээр сар','Арван хоёрдугаар сар'];
const INIT_BK = { mode:'service', svcs:[], pkg:null, art:null, date:null, time:null, pay:'qpay' };

export default function BookingModal() {
  const { user } = useAuth();
  const { bookingOpen, bookingArtist, bookingPackage, closeBooking, showToast } = useUI();
  const [step, setStep]     = useState(1);
  const [bk, setBk]         = useState(INIT_BK);
  const [calY, setCalY]     = useState(new Date().getFullYear());
  const [calM, setCalM]     = useState(new Date().getMonth());
  const [loading,        setLoading]        = useState(false);
  const [artists,        setArtists]        = useState(ARTISTS_FB);
  const [services,       setServices]       = useState(SERVICES_FB);
  const [artistSvcMap,   setArtistSvcMap]   = useState({}); // { artistId: serviceId[] }
  const [artistPkgMap,   setArtistPkgMap]   = useState({}); // { artistId: packageId[] }
  const [svcIdMap,       setSvcIdMap]       = useState({}); // { 'name_mn': id }
  const [packages,        setPackages]        = useState([]);
  const [pkgSvcs,         setPkgSvcs]         = useState({});
  const [artistSchedules, setArtistSchedules] = useState({});
  const [bookedSlots,     setBookedSlots]     = useState({}); // { 'artistName|YYYY-MM-DD': [{start,end} мин] }
  const [qr, setQr]       = useState(null);   // QPay { qr_image, urls, bookingId, slotKey, slotStart, slotEnd }
  const [qrPaid, setQrPaid] = useState(false); // төлбөр амжилттай (хэрэглэгч өөрөө хаана)
  const [secsLeft, setSecsLeft] = useState(300); // 5 минут countdown
  const phoneRef = useRef();
  const notesRef = useRef();

  // ── Захиалагдсан цагуудыг DB-ээс шинэчлэх (stale дата засах) ──
  const refreshBookedSlots = useCallback(async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const maxDay   = new Date(); maxDay.setDate(maxDay.getDate() + 14);
    const maxStr   = maxDay.toISOString().split('T')[0];
    const { data: bkData } = await supabase
      .from('bookings').select('artist_name, booking_date, booking_time, duration_min')
      .neq('status', 'cancelled').gte('booking_date', todayStr).lte('booking_date', maxStr);
    if (!bkData) return;
    const bkMap = {};
    bkData.forEach(b => {
      const key = `${b.artist_name}|${b.booking_date}`;
      if (!bkMap[key]) bkMap[key] = [];
      const start = timeToMin(b.booking_time);
      bkMap[key].push({ start, end: start + (b.duration_min || 60) });
    });
    setBookedSlots(bkMap);
  }, []);

  // Локал цагийн нөөцийг буцааж чөлөөлөх (цуцлах үед)
  const releaseSlot = () => {
    if (!qr?.slotKey) return;
    setBookedSlots(prev => ({
      ...prev,
      [qr.slotKey]: (prev[qr.slotKey] || []).filter(iv => !(iv.start === qr.slotStart && iv.end === qr.slotEnd)),
    }));
  };

  // Төлбөр төлөгдөөгүй захиалгыг цуцлах
  const cancelQr = async (reason) => {
    if (!qr?.bookingId) return;
    const id = qr.bookingId;
    releaseSlot();
    setQr(null); setQrPaid(false);
    try {
      await fetch('/api/qpay/cancel', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: id }),
      });
    } catch {}
    handleClose();
    if (reason === 'timeout') showToast('Төлбөрийн хугацаа дууслаа. Захиалга цуцлагдлаа.', 'err');
    else showToast('Захиалга цуцлагдлаа.', 'err');
  };

  // QPay төлбөр төлөгдсөн эсэхийг тогтмол шалгах (polling)
  useEffect(() => {
    if (!qr?.bookingId || qrPaid) return;
    const iv = setInterval(async () => {
      try {
        const res = await fetch('/api/qpay/check', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId: qr.bookingId }),
        });
        const d = await res.json();
        if (d.paid) { clearInterval(iv); setQrPaid(true); }
      } catch {}
    }, 3000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qr?.bookingId, qrPaid]);

  // 5 минутын countdown — дуусвал авто-цуцлана
  useEffect(() => {
    if (!qr?.bookingId || qrPaid) return;
    setSecsLeft(300);
    const iv = setInterval(() => {
      setSecsLeft(prev => {
        if (prev <= 1) { clearInterval(iv); cancelQr('timeout'); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qr?.bookingId, qrPaid]);

  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const maxDay   = new Date(); maxDay.setDate(maxDay.getDate() + 14);
    const maxStr   = maxDay.toISOString().split('T')[0];

    Promise.all([
      supabase.from('artists').select('*').order('id'),
      supabase.from('services').select('*').eq('active', true).order('id'),
      supabase.from('artist_services').select('artist_id, service_id'),
      supabase.from('artist_packages').select('artist_id, package_id'),
      supabase.from('packages').select('*').eq('active', true).order('sort_order').order('id'),
      supabase.from('package_services').select('package_id, service_id, services(name_mn, emoji)'),
      supabase.from('artist_schedules').select('*'),
      // Захиалагдсан цагууд (цуцлаагүй, 14 хоногийн дотор)
      supabase.from('bookings').select('artist_name, booking_date, booking_time, duration_min')
        .neq('status', 'cancelled').gte('booking_date', todayStr).lte('booking_date', maxStr),
    ]).then(([{ data: aData }, { data: sData }, { data: asData }, { data: apData }, { data: pkgData }, { data: psData }, { data: schedData }, { data: bkData }]) => {
      if (aData?.length) setArtists(aData);
      if (sData?.length) {
        setServices(sData.map(s => ({ id: s.id, name: s.name_mn, price: s.price_from, ico: s.emoji, img: s.image_url, duration: s.duration_min, deposit: s.deposit || 0 })));
        const nameToId = {};
        sData.forEach(s => { nameToId[s.name_mn] = s.id; });
        setSvcIdMap(nameToId);
      }
      // artist → services map
      const svcMap = {};
      (asData || []).forEach(({ artist_id, service_id }) => {
        if (!svcMap[artist_id]) svcMap[artist_id] = [];
        svcMap[artist_id].push(service_id);
      });
      setArtistSvcMap(svcMap);
      // artist → packages map
      const pkgMap = {};
      (apData || []).forEach(({ artist_id, package_id }) => {
        if (!pkgMap[artist_id]) pkgMap[artist_id] = [];
        pkgMap[artist_id].push(package_id);
      });
      setArtistPkgMap(pkgMap);
      // packages with included services
      const psMap = {};
      (psData || []).forEach(ps => {
        if (!psMap[ps.package_id]) psMap[ps.package_id] = [];
        if (ps.services) psMap[ps.package_id].push({ name: ps.services.name_mn, emoji: ps.services.emoji });
      });
      setPkgSvcs(psMap);
      if (pkgData?.length) setPackages(pkgData.map(p => ({ ...p, services: psMap[p.id] || [] })));
      // Build artist schedules map
      const schedMap = {};
      (schedData || []).forEach(r => {
        if (!schedMap[r.artist_id]) schedMap[r.artist_id] = [];
        schedMap[r.artist_id].push(r);
      });
      setArtistSchedules(schedMap);
      // Захиалгын завгүй интервалууд: 'artistName|YYYY-MM-DD' → [{start,end} мин]
      const bkMap = {};
      (bkData || []).forEach(b => {
        const key = `${b.artist_name}|${b.booking_date}`;
        if (!bkMap[key]) bkMap[key] = [];
        const start = timeToMin(b.booking_time);
        bkMap[key].push({ start, end: start + (b.duration_min || 60) });
      });
      setBookedSlots(bkMap);
    });
  }, []);

  const reset = () => { setStep(1); setBk(INIT_BK); setQr(null); setQrPaid(false); setCalY(new Date().getFullYear()); setCalM(new Date().getMonth()); };

  // Modal нээгдэх бүрт артист/багц урьдчилан тохируулна + цагийн слот шинэчлэх
  useEffect(() => {
    if (bookingOpen) {
      if (bookingPackage) {
        setBk({ ...INIT_BK, mode: 'package', pkg: bookingPackage, art: null });
      } else {
        setBk({ ...INIT_BK, art: bookingArtist || null });
      }
      setStep(1);
      refreshBookedSlots(); // ← Modal нээгдэх бүрт шинэ мэдээлэл татна
    }
  }, [bookingOpen, bookingArtist, bookingPackage, refreshBookedSlots]);

  // Step 3 (Огноо & Цаг) руу орох бүрт слотыг дахин шинэчлэх
  useEffect(() => {
    if (step === 3) refreshBookedSlots();
  }, [step, refreshBookedSlots]);

  // Хуудас арын tab-аас идэвхжих үед (дараа өдөр/маргааш орвол) шинэчлэх
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') refreshBookedSlots(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refreshBookedSlots]);
  const handleClose = () => { closeBooking(); reset(); };

  // Сонгосон артистын зөвшөөрсөн төлбөрийн аргууд
  const payMethods = () => {
    const a = artists.find(x => x.name === bk.art);
    const methods = [];
    if (a?.pay_qpay !== false) methods.push('qpay');   // default: QPay асаалттай
    if (a?.pay_cash === true)  methods.push('cash');
    return methods.length ? methods : ['qpay'];          // дор хаяж нэг
  };

  // Step 4-т орох / артист солигдоход бэлэн бус арга сонгогдсон бол анхдагчийг тааруулна
  useEffect(() => {
    if (step !== 4) return;
    const methods = payMethods();
    if (!methods.includes(bk.pay)) setBk(b => ({ ...b, pay: methods[0] }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, bk.art, artists]);

  const next = async () => {
    if (step === 1 && bk.mode === 'service' && bk.svcs.length === 0) { showToast('Үйлчилгээ сонгоно уу', 'err'); return; }
    if (step === 1 && bk.mode === 'package' && !bk.pkg) { showToast('Багц сонгоно уу', 'err'); return; }
    // Артист урьдчилан сонгогдсон бол step 2-г алгасна
    if (step === 1 && bookingArtist) { setStep(3); return; }
    if (step === 2 && !bk.art) { showToast('Артист сонгоно уу', 'err'); return; }
    if (step === 3 && (!bk.date || !bk.time)) { showToast('Огноо болон цагаа сонгоно уу', 'err'); return; }
    if (step === 4) { await confirm(); return; }
    setStep(s => s + 1);
  };

  // Сонгосон үйлчилгээ/багцын нийт үргэлжлэх хугацаа (мин)
  const newDuration = () => bk.mode === 'package'
    ? (bk.pkg?.duration_min || 60)
    : (bk.svcs.reduce((s, v) => s + (v.duration || 0), 0) || 60);

  // Нийт үнэ ба урьдчилгаа
  const totalPrice = () => bk.mode === 'package' ? (bk.pkg?.price ?? 0) : bk.svcs.reduce((s, v) => s + (v.price ?? 0), 0);
  // Урьдчилгаа: багц → багцын урьдчилгаа; 1 үйлчилгээ → тухайн үйлчилгээний урьдчилгаа;
  //            2 ба түүнээс дээш үйлчилгээ → тогтмол 15,000 (нэмэхгүй)
  const computeDeposit = () => {
    if (bk.mode === 'package') return bk.pkg?.deposit || 0;
    if (bk.svcs.length >= 2) return 15000;
    return bk.svcs.reduce((s, v) => s + (v.deposit || 0), 0);
  };
  // QPay-ээр төлөх дүн: урьдчилгаа байвал урьдчилгаа, үгүй бол бүтэн үнэ
  const chargeAmount = () => { const d = computeDeposit(); return d > 0 ? d : totalPrice(); };

  const confirm = async () => {
    if (loading) return;
    const phone = phoneRef.current?.value.trim();
    const notes = notesRef.current?.value.trim() || null;
    if (!phone) { showToast('Утасны дугаараа оруулна уу', 'err'); return; }
    if (!/^[0-9]{8}$/.test(phone)) { showToast('Утасны дугаар 8 оронтой байх ёстой', 'err'); return; }
    setLoading(true);
    const dur = newDuration();
    const total = totalPrice();
    const charge = chargeAmount();        // QPay-ээр төлөх дүн (урьдчилгаа эсвэл бүтэн)
    const svcName = bk.mode === 'package' ? `🎁 ${bk.pkg.name}` : bk.svcs.map(s => s.name).join(', ');
    const dateStr = bk.date ? `${bk.date.getFullYear()}-${String(bk.date.getMonth()+1).padStart(2,'0')}-${String(bk.date.getDate()).padStart(2,'0')}` : null;
    const { data: inserted, error } = await supabase.from('bookings').insert([{
      customer_name: phone, customer_phone: phone, customer_email: user?.email || null,
      service_name: svcName,
      artist_name: bk.art, booking_date: dateStr,
      booking_time: bk.time, payment_method: bk.pay, notes, duration_min: dur,
      total_price: total, deposit_amount: bk.pay === 'qpay' ? charge : 0,
      status: 'pending', user_id: user?.id || null,
    }]).select('id').single();
    if (error) { setLoading(false); showToast('Алдаа гарлаа. Дахин оролдоно уу.', 'err'); return; }
    // Шинэ захиалгыг local интервалд нэмэх (дараагийн хэрэглэгч нэн даруй харна)
    let slotKey = null, slotStart = null, slotEnd = null;
    if (bk.art && dateStr && bk.time) {
      slotKey = `${bk.art}|${dateStr}`;
      slotStart = timeToMin(bk.time);
      slotEnd = slotStart + dur;
      setBookedSlots(prev => ({ ...prev, [slotKey]: [...(prev[slotKey] || []), { start: slotStart, end: slotEnd }] }));
    }

    // QPay — нэхэмжлэл үүсгэж QR харуулна
    if (bk.pay === 'qpay') {
      const cleanupBooking = async () => {
        // Ghost booking-г устгана — QPay амжилтгүй болоход захиалга хадгалагдсан хэвээр байх ёсгүй
        try { await supabase.from('bookings').delete().eq('id', inserted.id); } catch {}
        if (slotKey) setBookedSlots(prev => ({
          ...prev,
          [slotKey]: (prev[slotKey] || []).filter(iv => !(iv.start === slotStart && iv.end === slotEnd)),
        }));
      };
      try {
        const res = await fetch('/api/qpay/create-invoice', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId: inserted.id, amount: charge, description: svcName }),
        });
        const data = await res.json();
        setLoading(false);
        if (!res.ok) {
          await cleanupBooking();
          const errMsg = data.error || 'Тодорхойгүй алдаа';
          showToast('QPay алдаа: ' + errMsg, 'err');
          return;
        }
        setQrPaid(false);
        setQr({ ...data, bookingId: inserted.id, amount: charge, slotKey, slotStart, slotEnd });
      } catch (err) {
        setLoading(false);
        await cleanupBooking();
        showToast('QPay-тэй холбогдсонгүй: ' + (err?.message || 'Network error'), 'err');
      }
      return;
    }

    setLoading(false);
    handleClose();
    showToast('Захиалга баталгаажлаа! Удахгүй уулзана 🎉', 'ok');
  };

  const chgMonth = (dir) => setCalM(m => { let nm = m+dir; if (nm<0){setCalY(y=>y-1);return 11;} if(nm>11){setCalY(y=>y+1);return 0;} return nm; });
  const pickDay  = (d) => setBk(b => ({ ...b, date: new Date(calY, calM, d), time: null }));

  // Get artist's schedule for a specific day (or null if no schedule set)
  const getArtistDaySched = (dayOfWeek) => {
    const artist = artists.find(a => a.name === bk.art);
    if (!artist) return null;
    const sched = artistSchedules[artist.id];
    if (!sched?.length) return null;
    return sched.find(s => s.day_of_week === dayOfWeek) || null;
  };

  // Тухайн артист + өдрийн завгүй интервалууд [{start,end} мин]
  const getBusyIntervals = (dateObj) => {
    if (!bk.art || !dateObj) return [];
    const ds = `${dateObj.getFullYear()}-${String(dateObj.getMonth()+1).padStart(2,'0')}-${String(dateObj.getDate()).padStart(2,'0')}`;
    return bookedSlots[`${bk.art}|${ds}`] || [];
  };

  // Боломжит цагуудыг тооцоолох — хуваарь + буфер + үйлчилгээний үргэлжлэх хугацаа + давхцал
  const getTimeSlots = () => {
    if (!bk.date) return { available: [], booked: [] };

    // 1. Артистын ажиллах цаг (хуваарьтай бол түүгээр, үгүй бол default)
    const daySched = getArtistDaySched(bk.date.getDay());
    if (daySched && !daySched.is_active) return { available: [], booked: [] };
    const winStart = timeToMin(daySched ? daySched.start_time : WORK_START);
    const winEnd   = timeToMin(daySched ? daySched.end_time   : WORK_END);

    // 2. Өнөөдрийн буфер (одооноос LEAD_MIN-ийн дотор захиалах боломжгүй)
    const todayMid = new Date(); todayMid.setHours(0,0,0,0);
    const isToday  = bk.date.toDateString() === todayMid.toDateString();
    const nowMins  = new Date().getHours() * 60 + new Date().getMinutes();

    // 3. Завгүй интервалууд + шинэ үйлчилгээний үргэлжлэх хугацаа
    const busy   = getBusyIntervals(bk.date);
    const dur    = newDuration();
    const overlaps = (s, e) => busy.some(b => s < b.end && b.start < e);

    // Алхам = үйлчилгээний үргэлжлэх хугацаа (90 мин → 09:00, 10:30, 12:00 ...)
    const step = dur > 0 ? dur : 60;
    const available = [];
    const bookedList = [];
    for (let s = winStart; s + dur <= winEnd; s += step) {
      if (isToday && s <= nowMins + LEAD_MIN) continue;   // буфер дотор / өнгөрсөн
      if (overlaps(s, s + dur)) bookedList.push(minToTime(s));
      else available.push(minToTime(s));
    }
    return { available, booked: bookedList };
  };

  const renderCal = () => {
    const fd    = new Date(calY, calM, 1).getDay();
    const dim   = new Date(calY, calM+1, 0).getDate();
    const today = new Date(); today.setHours(0,0,0,0);
    const maxDt = new Date(today); maxDt.setDate(today.getDate() + 14); // 14 хоногийн хязгаар
    const cells = [];
    for (let i=0; i<fd; i++) cells.push(<button key={`e${i}`} className="cal-d cal-empty aspect-square rounded-full border-none bg-transparent cursor-default pointer-events-none" disabled />);
    for (let d=1; d<=dim; d++) {
      const dt     = new Date(calY, calM, d);
      const past   = dt < today;
      const beyond = dt > maxDt;
      const isT    = dt.toDateString() === today.toDateString();
      const isSel  = bk.date && dt.toDateString() === bk.date.toDateString();
      const daySched = getArtistDaySched(dt.getDay());
      const isOff  = daySched ? !daySched.is_active : false;
      const disabled = past || beyond || isOff;
      cells.push(
        <button key={d} onClick={() => !disabled && pickDay(d)} disabled={disabled}
          title={isOff ? 'Артист амарна' : beyond ? '14 хоногоос хэтэрсэн' : ''}
          className={`cal-d aspect-square rounded-full border-none text-xs flex items-center justify-center transition-all ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${isSel ? 'cal-sel' : isT && !disabled ? 'cal-today' : isOff ? 'bg-red-50 !text-red-300' : beyond || past ? '!text-pink-200' : 'bg-transparent text-pink-200'}`}>
          {d}
        </button>
      );
    }
    return cells;
  };

  const fmtDate = (d) => d ? d.toLocaleDateString('mn-MN', { year:'numeric', month:'long', day:'numeric' }) : '—';
  if (!bookingOpen) return null;

  const H3 = ({ children }) => <h3 className="font-serif text-[22px] font-semibold text-pink-200 mb-6 max-[640px]:text-lg max-[640px]:mb-4">{children}</h3>;

  return (
    <>
    <div className="overlay active" onClick={e => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className="modal modal-sheet bg-[#606060] backdrop-blur-xl rounded-[28px] w-full max-w-[800px] max-h-[90vh] overflow-y-auto p-11 relative border border-gold/15 shadow-[0_32px_80px_rgba(0,0,0,.18)] max-[640px]:p-4" onClick={e => e.stopPropagation()}>
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#FF3399] via-[#FF66B2] to-[#FF3399] rounded-t-[28px]" />
        <button onClick={handleClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full border border-gold/20 bg-gold/8 cursor-pointer text-base text-pink-200 flex items-center justify-center transition-all hover:bg-gold/20 hover:text-pink-200 z-10">
          ✕
        </button>

        {/* Steps */}
        <div className="flex items-center mb-10 max-[640px]:mb-4">
          {[['Үйлчилгээ','1'],['Артист','2'],['Огноо & Цаг','3'],['Хянах','4']].map(([lbl,n],i) => {
            const s = i+1;
            return (
              <div key={n} className={`step-item flex flex-col items-center gap-2 flex-1${s<step?' done':s===step?' cur':''}`}>
                <div className={`step-circle w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all relative z-[1] max-[640px]:w-8 max-[640px]:h-8 max-[640px]:text-xs ${s<=step ? 'border-gold bg-gradient-to-br from-[#FF3399] to-[#FF3399] text-white shadow-[0_2px_8px_rgba(255,51,153,.40)]' : 'border-gold/20 bg-[#606060] text-pink-200'}`}>
                  {s<step ? '✓' : n}
                </div>
                <div className={`text-xs font-medium text-center max-[640px]:text-[10px] ${s===step ? 'text-pink font-bold' : 'text-pink-200'}`}>{lbl}</div>
              </div>
            );
          })}
        </div>

        {/* STEP 1: Services / Package tab */}
        {step === 1 && (() => {
          // Артистаар урьдчилан шүүсэн үйлчилгээнүүд
          const preArtist = bookingArtist ? artists.find(a => a.name === bookingArtist) : null;
          const preArtistSvcIds = preArtist ? (artistSvcMap[preArtist.id] || []) : null;
          const filteredServices = preArtistSvcIds
            ? services.filter(s => s.id == null || preArtistSvcIds.includes(s.id))
            : services;
          const filteredPackages = preArtist
            ? packages.filter(p => (artistPkgMap[preArtist.id] || []).includes(p.id))
            : packages;
          return (
          <div className="sc active">
            <H3>Үйлчилгээ сонгох</H3>
            {bookingArtist && (
              <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-gold-light/60 border border-gold/25 rounded-xl text-sm">
                <span>👩</span>
                <span className="font-semibold text-pink-200">{bookingArtist}</span>
                <span className="text-pink-400 text-xs">— артистын үйлчилгээнүүд харагдаж байна</span>
              </div>
            )}

            {/* Mode tabs */}
            <div className="flex gap-1.5 p-1 bg-[#606060] rounded-2xl mb-6 max-[640px]:mb-4">
              {[['service','✂️','Үйлчилгээ'],['package','🎁','Багц']].map(([m, ico, lbl]) => (
                <button key={m} onClick={() => setBk(b => ({ ...b, mode:m, svcs:[], pkg:null }))}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all border-none cursor-pointer ${bk.mode===m ? 'bg-[#606060] text-pink-200 shadow-sm' : 'bg-transparent text-pink-200 hover:text-shadow-pink-400'}`}>
                  {ico} {lbl}
                </button>
              ))}
            </div>

            {/* Service mode — multi-select */}
            {bk.mode === 'service' && (<>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-pink-200">Нэг ба түүнээс дээш сонгоно уу</span>
              {bk.svcs.length > 0 && (
                <span className="bg-pink text-white text-xs font-bold px-3 py-1 rounded-full flex-shrink-0">
                  {bk.svcs.length} сонгогдлоо
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3.5 max-[900px]:grid-cols-2 max-[640px]:grid-cols-2 max-[640px]:gap-2">
              {filteredServices.map((s, i) => {
                const sel = bk.svcs.some(v => v.name === s.name);
                return (
                  <div key={i} onClick={() => setBk(b => ({
                    ...b,
                    svcs: sel ? b.svcs.filter(v => v.name !== s.name) : [...b.svcs, s],
                  }))}
                    className={`border-2 rounded-2xl p-4 cursor-pointer transition-all flex items-center gap-3 relative max-[640px]:p-3 max-[640px]:gap-2.5 ${sel ? 'border-pink bg-[#606060]' : 'border-gray-200 hover:border-pink-light hover:bg-[#606060]'}`}>
                    {sel && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-pink text-white text-[10px] font-bold flex items-center justify-center">✓</div>
                    )}
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-[22px] flex-shrink-0 transition-all overflow-hidden max-[640px]:w-10 max-[640px]:h-10 max-[640px]:text-[18px] ${sel ? 'bg-pink' : 'bg-gray-100'}`}>
                      {s.img
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={s.img} alt={s.name} className="w-full h-full object-cover" />
                        : s.ico}
                    </div>
                    <div>
                      <div className="font-semibold text-sm max-[640px]:text-[13px] text-pink-200">{s.name}</div>
                      <div className="text-[13px] text-pink font-semibold max-[640px]:text-xs">₮{(s.price ?? 0).toLocaleString()}+</div>
                      {s.duration > 0 && <div className="text-[11px] text-pink-400 mt-0.5">⏱ {s.duration} мин</div>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected services summary bar */}
            {bk.svcs.length > 0 && (
              <div className="mt-5 flex items-center justify-between gap-3 px-4 py-3.5 bg-[#606060] rounded-2xl border border-pink/30 flex-wrap">
                <div className="text-sm font-medium text-pink-200">
                  {bk.svcs.map(s => s.ico).join(' ')} {bk.svcs.map(s => s.name).join(' + ')}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {bk.svcs.some(s => s.duration > 0) && (
                    <span className="text-xs text-pink-200">⏱ {bk.svcs.reduce((sum, s) => sum + (s.duration ?? 0), 0)} мин</span>
                  )}
                  <span className="font-bold text-base text-pink-dark">₮{bk.svcs.reduce((sum, s) => sum + (s.price ?? 0), 0).toLocaleString()}+</span>
                </div>
              </div>
            )}
            </>)}

            {/* Package mode */}
            {bk.mode === 'package' && (
              filteredPackages.length === 0 ? (
                <div className="text-center py-12 text-pink-400">
                  <div className="text-4xl mb-3">🎁</div>
                  <div className="text-sm">Идэвхтэй багц байхгүй байна</div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {filteredPackages.map(p => {
                    const sel = bk.pkg?.id === p.id;
                    const saved = p.original_price > p.price ? p.original_price - p.price : 0;
                    return (
                      <div key={p.id} onClick={() => setBk(b => ({ ...b, pkg: sel ? null : p }))}
                        className={`border-2 rounded-2xl p-4 cursor-pointer transition-all relative max-[640px]:p-3 ${sel ? 'border-pink bg-[#606060]' : 'border-gray-200 hover:border-pink-light hover:bg-pink-light'}`}>
                        {sel && <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-pink text-white text-xs font-bold flex items-center justify-center">✓</div>}
                        {saved > 0 && !sel && (
                          <div className="absolute top-3 right-3 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">-₮{saved.toLocaleString()}</div>
                        )}
                        <div className="flex items-start gap-3">
                          <div className="text-3xl flex-shrink-0 max-[640px]:text-2xl">
                            {p.image_url
                              // eslint-disable-next-line @next/next/no-img-element
                              ? <img src={p.image_url} alt={p.name} className="w-12 h-12 rounded-xl object-cover max-[640px]:w-10 max-[640px]:h-10" />
                              : p.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm mb-1 max-[640px]:text-[13px]">{p.name}</div>
                            {p.description && <div className="text-xs text-pink-400 mb-2 leading-relaxed">{p.description}</div>}
                            {(p.services || pkgSvcs[p.id] || []).length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {(p.services || pkgSvcs[p.id] || []).map((s, i) => (
                                  <span key={i} className="text-[10px] bg-[#606060] border border-gray-200 px-2 py-0.5 rounded-full text-pink-300">
                                    {s.name}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center gap-2 flex-wrap">
                              {p.original_price > p.price && (
                                <span className="text-xs text-pink-400 line-through">₮{p.original_price.toLocaleString()}</span>
                              )}
                              <span className="font-bold text-base text-pink-dark">₮{p.price.toLocaleString()}</span>
                              {p.duration_min > 0 && <span className="text-[11px] text-pink-400">⏱ {p.duration_min} мин</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
          );
        })()}

        {/* STEP 2: Artists filtered by selected services (ANY match) */}
        {step === 2 && (() => {
          const visible = artists.filter(a => {
            if (bk.mode === 'package') {
              // Filter by package capability
              const pkgIds = artistPkgMap[a.id];
              if (!bk.pkg || !pkgIds || pkgIds.length === 0) return true;
              return pkgIds.includes(bk.pkg.id);
            } else {
              // Filter by selected services (ANY match)
              const selSvcIds = bk.svcs.map(s => s.id).filter(Boolean);
              const svcIds = artistSvcMap[a.id];
              if (!svcIds || svcIds.length === 0 || selSvcIds.length === 0) return true;
              return selSvcIds.some(sid => svcIds.includes(sid));
            }
          });
          return (
            <div className="sc active">
              <H3>Артист сонгох</H3>
              {visible.length === 0 ? (
                <div className="text-center py-12 text-pink-400">
                  <div className="text-4xl mb-3">😔</div>
                  <div className="text-sm font-medium">Энэ үйлчилгээг үзүүлэх артист байхгүй байна</div>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-3.5 max-[900px]:grid-cols-3 max-[640px]:grid-cols-2 max-[640px]:gap-2 max-[480px]:grid-cols-2">
                  {visible.map((a) => {
                    const inactive = a.active === false;
                    return (
                      <div key={a.id ?? a.name} onClick={() => !inactive && setBk(b => ({ ...b, art:a.name }))}
                        className={`border-2 rounded-2xl p-4 text-center transition-all relative max-[640px]:p-3 ${inactive ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${bk.art===a.name ? 'border-pink bg-[#606060]' : 'border-gray-200 hover:border-pink-light'}`}>
                        {inactive && (
                          <div className="absolute top-1.5 right-1.5 bg-[#fee2e2] text-[#dc2626] text-[9px] font-bold px-1.5 py-0.5 rounded-full">Ажиллахгүй</div>
                        )}
                        <div className="w-[70px] h-[70px] rounded-full mx-auto mb-2.5 bg-gradient-to-br from-[#FFD6E8] to-[#FFBCD9] flex items-center justify-center text-[30px] max-[640px]:w-14 max-[640px]:h-14 max-[640px]:text-2xl overflow-hidden">
                          {a.image_url
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={a.image_url} alt={a.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                            : (a.avatar_emoji || a.emoji || '👩')}
                        </div>
                        <div className="font-bold text-sm max-[640px]:text-xs text-pink-200">{a.name}</div>
                        <div className="text-[11px] text-pink-200 mt-0.5">{a.specialty_mn || a.role}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* STEP 3: Date & Time */}
        {step === 3 && (
          <div className="sc active">
            <H3>Огноо & Цаг сонгох</H3>
            <div className="grid grid-cols-2 gap-7 max-[900px]:grid-cols-1">
              {/* Calendar */}
              <div>
                <div className="text-xs font-bold text-pink-400 uppercase tracking-[1px] mb-3.5">Огноо сонгох</div>
                <div className="border border-gray-200 rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3.5 bg-[#606060]">
                    <button onClick={() => chgMonth(-1)} className="w-[30px] h-[30px] rounded-full border-none bg-[#606060] cursor-pointer flex items-center justify-center text-pink-200 text-base transition-all hover:bg-pink hover:text-white">‹</button>
                    <span className="font-bold text-sm text-pink-200">{MONTHS[calM]} {calY}</span>
                    <button onClick={() => chgMonth(1)} className="w-[30px] h-[30px] rounded-full border-none bg-[#606060] cursor-pointer flex items-center justify-center text-pink-200 text-base transition-all hover:bg-pink hover:text-white">›</button>
                  </div>
                  <div className="p-3.5">
                    <div className="grid grid-cols-7 text-center mb-1.5">
                      {'Ня Да Мя Лх Пү Ба Бя'.split(' ').map(d => (
                        <span key={d} className="text-[11px] font-bold text-pink-200 py-1">{d}</span>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-0.5">{renderCal()}</div>
                  </div>
                </div>
              </div>
              {/* Time */}
              <div>
                <div className="text-xs font-bold text-pink-400 uppercase tracking-[1px] mb-3.5">
                  Цаг сонгох
                  {bk.date && (() => {
                    const ds = getArtistDaySched(bk.date.getDay());
                    return ds?.is_active
                      ? <span className="ml-2 text-green-600 font-normal normal-case">{ds.start_time} – {ds.end_time}</span>
                      : ds ? <span className="ml-2 text-red-400 font-normal normal-case">Энэ өдөр амарна</span>
                      : null;
                  })()}
                </div>
                {(() => {
                  const { available, booked } = getTimeSlots();
                  if (available.length === 0 && booked.length === 0) return (
                    <div className="text-center py-8 text-pink-400">
                      <div className="text-3xl mb-2">😔</div>
                      <div className="text-sm font-medium">
                        {!bk.date ? 'Эхлээд огноо сонгоно уу' : 'Энэ өдөр захиалах боломжтой цаг байхгүй байна'}
                      </div>
                      <div className="text-xs mt-1">Өөр өдөр сонгоно уу</div>
                    </div>
                  );
                  return (
                    <div className="grid grid-cols-2 gap-2 max-[640px]:grid-cols-3 max-[640px]:gap-1.5">
                      {/* Захиалах боломжтой цагууд */}
                      {available.map(t => (
                        <button key={t} onClick={() => setBk(b => ({ ...b, time:t }))}
                          className={`border-2 rounded-lg py-2.5 text-center text-[13px] font-medium cursor-pointer transition-all min-h-[44px] max-[640px]:text-xs ${bk.time===t ? 'bg-pink border-pink text-white font-bold' : 'border-gray-200 text-pink-200 bg-[#606060] hover:border-pink hover:text-pink'}`}>
                          {t}
                        </button>
                      ))}
                      {/* Захиалагдсан цагууд */}
                      {booked.map(t => (
                        <button key={t} disabled
                          className="border-2 border-gray-100 rounded-lg py-2.5 text-center bg-gray-50 cursor-not-allowed min-h-[44px] flex flex-col items-center justify-center gap-0.5 max-[640px]:text-xs">
                          <span className="text-[12px] text-pink-400 line-through">{t}</span>
                          <span className="text-[9px] text-pink-400 font-semibold">Захиалагдсан</span>
                        </button>
                      ))}
                    </div>
                  );
                })()}
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
                <h4 className="text-base font-bold mb-4 pb-3 border-b border-gray-200 text-pink-200">Захиалгын хураангуй</h4>
                {/* Service/Package summary */}
                <div className="flex items-start gap-3 mb-3.5">
                  <div className="w-11 h-11 rounded-full bg-pink-light flex items-center justify-center text-[18px] flex-shrink-0">
                    {bk.mode === 'package' ? (bk.pkg?.emoji || '🎁') : (bk.svcs[0]?.ico || '✂️')}
                  </div>
                  <div className="flex-1">
                    {bk.mode === 'package' ? (
                      <>
                        <div className="text-[11px] text-pink-400 uppercase tracking-[.5px] mb-1">Багц үйлчилгээ</div>
                        <div className="text-sm font-bold">{bk.pkg?.emoji} {bk.pkg?.name}</div>
                        {bk.pkg?.description && <div className="text-xs text-pink-400 mt-0.5">{bk.pkg.description}</div>}
                      </>
                    ) : (
                      <>
                        <div className="text-[11px] text-pink-400 uppercase tracking-[.5px] mb-1">Үйлчилгээ ({bk.svcs.length})</div>
                        <div className="flex flex-col gap-1">
                          {bk.svcs.map(s => (
                            <div key={s.name} className="flex justify-between text-sm text-pink-200">
                              <span className="font-medium">{s.ico} {s.name}</span>
                              <span className="text-pink font-semibold">₮{(s.price ?? 0).toLocaleString()}+</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                {[
                  { ico: '👩', lbl:'Артист', val: bk.art },
                  { ico: '📅',  lbl:'Огноо & Цаг',  val: `${fmtDate(bk.date)} · ${bk.time}` },
                  ...(bk.mode === 'service' && bk.svcs.some(s => s.duration > 0)
                    ? [{ ico: '⏱', lbl:'Нийт хугацаа', val: `${bk.svcs.reduce((sum, s) => sum + (s.duration ?? 0), 0)} минут` }]
                    : bk.mode === 'package' && bk.pkg?.duration_min > 0
                    ? [{ ico: '⏱', lbl:'Хугацаа', val: `${bk.pkg.duration_min} минут` }]
                    : []),
                ].map(({ ico, lbl, val }) => (
                  <div key={lbl} className="flex items-center gap-3 mb-3.5">
                    <div className="w-11 h-11 rounded-full bg-pink-light flex items-center justify-center text-[18px] flex-shrink-0">{ico}</div>
                    <div className="flex-1">
                      <div className="text-[11px] text-pink-400 uppercase tracking-[.5px]">{lbl}</div>
                      <div className="text-sm font-semibold text-pink-200">{val}</div>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between py-3.5 border-t-2 border-gray-200 mt-1.5">
                  <span className="text-[15px] font-bold text-pink-200">Нийт үнэ</span>
                  <span className="text-xl font-bold text-pink">₮{totalPrice().toLocaleString()}</span>
                </div>
                {bk.pay === 'qpay' && computeDeposit() > 0 && (
                  <div className="bg-[#707070] rounded-xl px-3.5 py-3 -mt-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-pink-200">📱 Урьдчилгаа (QPay-ээр төлнө)</span>
                      <span className="text-base font-bold text-pink">₮{computeDeposit().toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1 text-xs text-pink-400">
                      <span>Үлдэгдлийг салон дээр төлнө</span>
                      <span>₮{(totalPrice() - computeDeposit()).toLocaleString()}</span>
                    </div>
                  </div>
                )}
                <div className="mt-4 border-t border-gray-200 pt-3.5">
                  <div className="text-sm font-semibold text-pink-200 mb-2.5">Холбоо барих мэдээлэл</div>
                  <div className="mb-2.5">
                    <label className="block text-xs font-semibold mb-1 text-pink-200">Утасны дугаар <span className="text-salon-red">*</span></label>
                    <input ref={phoneRef} type="tel" placeholder="99xxxxxx" defaultValue={user?.user_metadata?.phone || ''}
                      className="w-full text-pink-200 px-3 py-2 border-[1.5px] border-gray-200 rounded-xl text-sm font-sans outline-none focus:border-gold transition-all max-[640px]:text-base" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-pink-200">Нэмэлт тэмдэглэл <span className="text-pink-400 font-normal">(заавал биш)</span></label>
                    <textarea ref={notesRef} rows={2} placeholder="Жишээ: тодорхой загвар, харшил, тусгай хүсэлт..."
                      className="w-full text-pink-200 px-3 py-2 border-[1.5px] border-gray-200 rounded-xl text-sm font-sans outline-none focus:border-gold transition-all resize-none max-[640px]:text-base" />
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-base font-bold mb-4 pb-3 border-b border-gray-200 text-pink-200">Төлбөрийн арга</h4>
                {(() => {
                  const methods = payMethods();
                  const OPT = {
                    qpay: { ico:'📱', title:'QPay-ээр төлнө',  desc:'Бүх банкны апп-аар QR уншуулж төлнө' },
                    cash: { ico:'💵', title:'Бэлнээр төлнө',    desc:'Салон дээр биеэр төлбөрөө хийнэ' },
                  };
                  return (
                    <div className="flex flex-col gap-2.5">
                      {methods.map(m => {
                        const sel = bk.pay === m;
                        const o = OPT[m];
                        return (
                          <div key={m} onClick={() => setBk(b => ({ ...b, pay:m }))}
                            className={`flex items-center gap-3 px-4 py-3.5 border-2 rounded-2xl cursor-pointer transition-all ${sel ? 'border-pink bg-[#707070]' : 'border-gray-200 bg-[#606060] hover:border-pink-light'} text-pink-200`}>
                            <span className="text-2xl">{o.ico}</span>
                            <div className="flex-1">
                              <div className="text-sm font-semibold">{o.title}</div>
                              <div className="text-[11px] text-pink-400">{o.desc}</div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${sel ? 'border-pink bg-pink' : 'border-gray-300'}`}>
                              {sel && <span className="text-white text-[10px] font-bold">✓</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
                {bk.pay === 'qpay' ? (
                  <p className="text-[11px] text-pink-400 mt-3 leading-relaxed">
                    ⏱ Захиалга баталгаажуулсны дараа <strong>5 минутын дотор</strong> төлбөрөө төлнө. Төлөгдөөгүй бол захиалга автоматаар цуцлагдана.
                  </p>
                ) : (
                  <p className="text-[11px] text-pink-400 mt-3 leading-relaxed">
                    💡 Захиалга баталгаажуулсны дараа товлосон цагтаа ирж, төлбөрөө салон дээр <strong>бэлнээр</strong> төлнө.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between mt-7 pt-5 border-t border-gray-200 max-[640px]:pt-3 max-[640px]:mt-3 max-[380px]:flex-col-reverse max-[380px]:gap-2">
          <button onClick={() => setStep(s => bookingArtist && s === 3 ? 1 : s - 1)} disabled={step <= 1}
            className={`bg-[#606060] text-pink-200 border-none px-7 py-3 rounded-full text-sm font-semibold cursor-pointer transition-all hover:bg-gray-200 max-[380px]:w-full max-[380px]:min-h-[50px] ${step <= 1 ? 'invisible pointer-events-none' : ''}`}>
            ← Буцах
          </button>
          <button disabled={loading} onClick={next}
            className="bg-gradient-to-r from-[#FF3399] via-[#FF66B2] to-[#FF3399] text-pink-200 border-none px-7 py-3 rounded-full text-sm font-bold cursor-pointer transition-all shadow-[0_4px_18px_rgba(255,51,153,.40)] hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(255,51,153,.55)] disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 tracking-wide max-[380px]:w-full max-[380px]:min-h-[50px]">
            {loading ? 'Хадгалж байна...' : step === 4 ? '✓ Захиалга баталгаажуулах' : 'Дараах →'}
          </button>
        </div>
      </div>
    </div>

    {/* QPay QR overlay */}
    {qr && (
      <div className="overlay active" style={{ zIndex: 2100 }} onClick={e => { if (e.target === e.currentTarget && !qrPaid) cancelQr(); }}>
        <div className="modal bg-[#606060] rounded-[28px] w-full max-w-[420px] p-8 relative border border-gold/15 shadow-[0_32px_80px_rgba(0,0,0,.25)] text-center max-[640px]:p-5" onClick={e => e.stopPropagation()}>
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#FF3399] via-[#FF66B2] to-[#FF3399] rounded-t-[28px]" />

          {qrPaid ? (
            /* ── Амжилттай — хэрэглэгч өөрөө X дарж хаана ── */
            <>
              <button onClick={() => { setQr(null); setQrPaid(false); handleClose(); }}
                className="absolute top-5 right-5 w-9 h-9 rounded-full border border-gold/20 bg-gold/8 cursor-pointer text-base text-pink-200 flex items-center justify-center hover:bg-gold/20 z-10">✕</button>
              <div className="py-6">
                <div className="text-[64px] mb-3">✅</div>
                <h3 className="font-serif text-[24px] font-semibold text-pink-200 mb-2">Төлбөр амжилттай!</h3>
                <p className="text-sm text-pink-400 mb-1">Захиалга баталгаажлаа 🎉</p>
                <p className="text-xs text-pink-400 mb-6">Удахгүй уулзана. Баярлалаа!</p>
                <button onClick={() => { setQr(null); setQrPaid(false); handleClose(); }}
                  className="bg-gradient-to-r from-[#FF3399] via-[#FF66B2] to-[#FF3399] text-white border-none px-8 py-3 rounded-full text-sm font-bold cursor-pointer">
                  Хаах
                </button>
              </div>
            </>
          ) : (
            /* ── Төлбөр хүлээж буй ── */
            <>
              <button onClick={() => cancelQr()}
                className="absolute top-5 right-5 w-9 h-9 rounded-full border border-gold/20 bg-gold/8 cursor-pointer text-base text-pink-200 flex items-center justify-center hover:bg-gold/20 z-10">✕</button>

              <h3 className="font-serif text-[22px] font-semibold text-pink-200 mb-1">QPay-ээр төлөх</h3>
              <p className="text-sm text-pink-400 mb-1">Дүн: <span className="text-pink font-bold">₮{(qr.amount ?? 0).toLocaleString()}</span></p>

              {/* Countdown */}
              <div className={`text-sm font-bold mb-2 ${secsLeft <= 60 ? 'text-red-400' : 'text-pink-200'}`}>
                ⏱ {Math.floor(secsLeft/60)}:{String(secsLeft%60).padStart(2,'0')}
              </div>

              {qr.qr_image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qr.qr_image.startsWith('data:') ? qr.qr_image : `data:image/png;base64,${qr.qr_image}`}
                  alt="QPay QR"
                  className="w-[220px] h-[220px] mx-auto rounded-2xl bg-white p-2 my-3" />
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

              <button onClick={() => cancelQr()}
                className="w-full py-2.5 rounded-full border border-red-400/40 bg-transparent text-red-400 text-sm font-semibold cursor-pointer hover:bg-red-400/10 transition-colors">
                Цуцлах
              </button>
            </>
          )}
        </div>
      </div>
    )}
    </>
  );
}
