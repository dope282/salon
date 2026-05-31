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
const TIMES_DEFAULT = ['09:00','10:00','11:00','12:00','13:00','14:00','16:00','17:00'];

// Generate hourly slots between start and end time
const generateSlots = (start, end, stepMin = 60) => {
  const slots = [];
  let [h, m] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  while (h * 60 + m < eh * 60 + em) {
    slots.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
    m += stepMin; h += Math.floor(m / 60); m %= 60;
  }
  return slots;
};
const MONTHS  = ['Нэгдүгээр сар','Хоёрдугаар сар','Гуравдугаар сар','Дөрөвдүгээр сар','Тавдугаар сар','Зургаадугаар сар','Долдугаар сар','Наймдугаар сар','Есдүгээр сар','Аравдугаар сар','Арван нэгдүгээр сар','Арван хоёрдугаар сар'];
const INIT_BK = { mode:'service', svcs:[], pkg:null, art:null, date:null, time:null, pay:'cash' };

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
  const [bookedSlots,     setBookedSlots]     = useState({}); // { 'artistName|YYYY-MM-DD': Set<time> }
  const phoneRef = useRef();
  const notesRef = useRef();

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
      supabase.from('bookings').select('artist_name, booking_date, booking_time')
        .neq('status', 'cancelled').gte('booking_date', todayStr).lte('booking_date', maxStr),
    ]).then(([{ data: aData }, { data: sData }, { data: asData }, { data: apData }, { data: pkgData }, { data: psData }, { data: schedData }, { data: bkData }]) => {
      if (aData?.length) setArtists(aData);
      if (sData?.length) {
        setServices(sData.map(s => ({ id: s.id, name: s.name_mn, price: s.price_from, ico: s.emoji, img: s.image_url, duration: s.duration_min })));
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
      // Booked slots map: 'artistName|YYYY-MM-DD' → Set<time>
      const bkMap = {};
      (bkData || []).forEach(b => {
        const key = `${b.artist_name}|${b.booking_date}`;
        if (!bkMap[key]) bkMap[key] = new Set();
        bkMap[key].add(b.booking_time);
      });
      setBookedSlots(bkMap);
    });
  }, []);

  const reset = () => { setStep(1); setBk(INIT_BK); setCalY(new Date().getFullYear()); setCalM(new Date().getMonth()); };

  // Modal нээгдэх бүрт артист/багц урьдчилан тохируулна
  useEffect(() => {
    if (bookingOpen) {
      if (bookingPackage) {
        setBk({ ...INIT_BK, mode: 'package', pkg: bookingPackage, art: null });
      } else {
        setBk({ ...INIT_BK, art: bookingArtist || null });
      }
      setStep(1);
    }
  }, [bookingOpen, bookingArtist, bookingPackage]);
  const handleClose = () => { closeBooking(); reset(); };

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

  const confirm = async () => {
    if (loading) return;
    const phone = phoneRef.current?.value.trim();
    const notes = notesRef.current?.value.trim() || null;
    if (!phone) { showToast('Утасны дугаараа оруулна уу', 'err'); return; }
    if (!/^[0-9]{8}$/.test(phone)) { showToast('Утасны дугаар 8 оронтой байх ёстой', 'err'); return; }
    setLoading(true);
    const dateStr = bk.date ? `${bk.date.getFullYear()}-${String(bk.date.getMonth()+1).padStart(2,'0')}-${String(bk.date.getDate()).padStart(2,'0')}` : null;
    const { error } = await supabase.from('bookings').insert([{
      customer_name: phone, customer_phone: phone, customer_email: user?.email || null,
      service_name: bk.mode === 'package' ? `🎁 ${bk.pkg.name}` : bk.svcs.map(s => s.name).join(', '),
      artist_name: bk.art, booking_date: dateStr,
      booking_time: bk.time, payment_method: bk.pay, notes,
      total_price: bk.mode === 'package' ? (bk.pkg.price ?? 0) : bk.svcs.reduce((s, v) => s + (v.price ?? 0), 0),
      status: 'pending', user_id: user?.id || null,
    }]);
    setLoading(false);
    if (error) { showToast('Алдаа гарлаа. Дахин оролдоно уу.', 'err'); return; }
    // Шинэ захиалгыг local state-д нэмэх (дараагийн хэрэглэгч нэн даруй харна)
    if (bk.art && dateStr && bk.time) {
      const key = `${bk.art}|${dateStr}`;
      setBookedSlots(prev => {
        const upd = { ...prev };
        if (!upd[key]) upd[key] = new Set();
        else upd[key] = new Set(upd[key]);
        upd[key].add(bk.time);
        return upd;
      });
    }
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

  // Тухайн артист + өдрийн захиалагдсан цагуудын Set
  const getBookedTimes = (dateObj) => {
    if (!bk.art || !dateObj) return new Set();
    const ds = `${dateObj.getFullYear()}-${String(dateObj.getMonth()+1).padStart(2,'0')}-${String(dateObj.getDate()).padStart(2,'0')}`;
    return bookedSlots[`${bk.art}|${ds}`] || new Set();
  };

  // Generate available time slots for the selected date (3 шүүлтүүртэй)
  const getTimeSlots = () => {
    if (!bk.date) return { available: TIMES_DEFAULT, booked: [] };

    // 1. Артистын хуваарийн цагууд
    const daySched = getArtistDaySched(bk.date.getDay());
    if (daySched && !daySched.is_active) return { available: [], booked: [] };
    const all = daySched ? generateSlots(daySched.start_time, daySched.end_time, 60) : TIMES_DEFAULT;

    // 2. Өнөөдрийн өнгөрсөн цагийг хасах
    const todayMid = new Date(); todayMid.setHours(0,0,0,0);
    const isToday  = bk.date.toDateString() === todayMid.toDateString();
    const nowMins  = isToday ? (new Date().getHours() * 60 + new Date().getMinutes()) : 0;

    // 3. Захиалагдсан цагуудыг тусгаарлах
    const booked = getBookedTimes(bk.date);

    const available = [];
    const bookedList = [];
    all.forEach(t => {
      const [h, m] = t.split(':').map(Number);
      if (isToday && h * 60 + m <= nowMins) return; // өнгөрсөн цаг
      if (booked.has(t)) { bookedList.push(t); } else { available.push(t); }
    });
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
          className={`cal-d aspect-square rounded-full border-none text-xs flex items-center justify-center transition-all ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${isSel ? 'cal-sel' : isT && !disabled ? 'cal-today' : isOff ? 'bg-red-50 !text-red-300' : beyond || past ? '!text-gray-200' : 'bg-transparent text-dark'}`}>
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
          {[['Үйлчилгээ','1'],['Артист','2'],['Огноо & Цаг','3'],['Хянах','4']].map(([lbl,n],i) => {
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
                <span className="font-semibold text-dark">{bookingArtist}</span>
                <span className="text-gray-400 text-xs">— артистын үйлчилгээнүүд харагдаж байна</span>
              </div>
            )}

            {/* Mode tabs */}
            <div className="flex gap-1.5 p-1 bg-gray-100 rounded-2xl mb-6 max-[640px]:mb-4">
              {[['service','✂️','Үйлчилгээ'],['package','🎁','Багц']].map(([m, ico, lbl]) => (
                <button key={m} onClick={() => setBk(b => ({ ...b, mode:m, svcs:[], pkg:null }))}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all border-none cursor-pointer ${bk.mode===m ? 'bg-white text-dark shadow-sm' : 'bg-transparent text-gray-500 hover:text-dark'}`}>
                  {ico} {lbl}
                </button>
              ))}
            </div>

            {/* Service mode — multi-select */}
            {bk.mode === 'service' && (<>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">Нэг ба түүнээс дээш сонгоно уу</span>
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
                    className={`border-2 rounded-2xl p-4 cursor-pointer transition-all flex items-center gap-3 relative max-[640px]:p-3 max-[640px]:gap-2.5 ${sel ? 'border-pink bg-pink-light' : 'border-gray-200 hover:border-pink-light hover:bg-pink-light'}`}>
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
                      <div className="font-semibold text-sm max-[640px]:text-[13px]">{s.name}</div>
                      <div className="text-[13px] text-pink font-semibold max-[640px]:text-xs">₮{(s.price ?? 0).toLocaleString()}+</div>
                      {s.duration > 0 && <div className="text-[11px] text-gray-400 mt-0.5">⏱ {s.duration} мин</div>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected services summary bar */}
            {bk.svcs.length > 0 && (
              <div className="mt-5 flex items-center justify-between gap-3 px-4 py-3.5 bg-pink-light rounded-2xl border border-pink/30 flex-wrap">
                <div className="text-sm font-medium text-dark">
                  {bk.svcs.map(s => s.ico).join(' ')} {bk.svcs.map(s => s.name).join(' + ')}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {bk.svcs.some(s => s.duration > 0) && (
                    <span className="text-xs text-gray-500">⏱ {bk.svcs.reduce((sum, s) => sum + (s.duration ?? 0), 0)} мин</span>
                  )}
                  <span className="font-bold text-base text-pink-dark">₮{bk.svcs.reduce((sum, s) => sum + (s.price ?? 0), 0).toLocaleString()}+</span>
                </div>
              </div>
            )}
            </>)}

            {/* Package mode */}
            {bk.mode === 'package' && (
              filteredPackages.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
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
                        className={`border-2 rounded-2xl p-4 cursor-pointer transition-all relative max-[640px]:p-3 ${sel ? 'border-pink bg-pink-light' : 'border-gray-200 hover:border-pink-light hover:bg-pink-light'}`}>
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
                            {p.description && <div className="text-xs text-gray-500 mb-2 leading-relaxed">{p.description}</div>}
                            {(p.services || pkgSvcs[p.id] || []).length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {(p.services || pkgSvcs[p.id] || []).map((s, i) => (
                                  <span key={i} className="text-[10px] bg-white border border-gray-200 px-2 py-0.5 rounded-full text-gray-600">
                                    {s.emoji} {s.name}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center gap-2 flex-wrap">
                              {p.original_price > p.price && (
                                <span className="text-xs text-gray-400 line-through">₮{p.original_price.toLocaleString()}</span>
                              )}
                              <span className="font-bold text-base text-pink-dark">₮{p.price.toLocaleString()}</span>
                              {p.duration_min > 0 && <span className="text-[11px] text-gray-400">⏱ {p.duration_min} мин</span>}
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
                <div className="text-center py-12 text-gray-400">
                  <div className="text-4xl mb-3">😔</div>
                  <div className="text-sm font-medium">Энэ үйлчилгээг үзүүлэх артист байхгүй байна</div>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-3.5 max-[900px]:grid-cols-3 max-[640px]:grid-cols-2 max-[640px]:gap-2 max-[480px]:grid-cols-2">
                  {visible.map((a) => {
                    const inactive = a.active === false;
                    return (
                      <div key={a.id ?? a.name} onClick={() => !inactive && setBk(b => ({ ...b, art:a.name }))}
                        className={`border-2 rounded-2xl p-4 text-center transition-all relative max-[640px]:p-3 ${inactive ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${bk.art===a.name ? 'border-pink bg-pink-light' : 'border-gray-200 hover:border-pink-light'}`}>
                        {inactive && (
                          <div className="absolute top-1.5 right-1.5 bg-[#fee2e2] text-[#dc2626] text-[9px] font-bold px-1.5 py-0.5 rounded-full">Ажиллахгүй</div>
                        )}
                        <div className="w-[70px] h-[70px] rounded-full mx-auto mb-2.5 bg-gradient-to-br from-[#FFD6E8] to-[#FFBCD9] flex items-center justify-center text-[30px] max-[640px]:w-14 max-[640px]:h-14 max-[640px]:text-2xl overflow-hidden">
                          {a.image_url
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={a.image_url} alt={a.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                            : (a.avatar_emoji || a.emoji || '👩')}
                        </div>
                        <div className="font-bold text-sm max-[640px]:text-xs">{a.name}</div>
                        <div className="text-[11px] text-gray-500 mt-0.5">{a.specialty_mn || a.role}</div>
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
                <div className="text-xs font-bold text-gray-500 uppercase tracking-[1px] mb-3.5">
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
                    <div className="text-center py-8 text-gray-400">
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
                          className={`border-2 rounded-lg py-2.5 text-center text-[13px] font-medium cursor-pointer transition-all min-h-[44px] max-[640px]:text-xs ${bk.time===t ? 'bg-pink border-pink text-white font-bold' : 'border-gray-200 bg-white hover:border-pink hover:text-pink'}`}>
                          {t}
                        </button>
                      ))}
                      {/* Захиалагдсан цагууд */}
                      {booked.map(t => (
                        <button key={t} disabled
                          className="border-2 border-gray-100 rounded-lg py-2.5 text-center bg-gray-50 cursor-not-allowed min-h-[44px] flex flex-col items-center justify-center gap-0.5 max-[640px]:text-xs">
                          <span className="text-[12px] text-gray-300 line-through">{t}</span>
                          <span className="text-[9px] text-gray-300 font-semibold">Захиалагдсан</span>
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
                <h4 className="text-base font-bold mb-4 pb-3 border-b border-gray-200">Захиалгын хураангуй</h4>
                {/* Service/Package summary */}
                <div className="flex items-start gap-3 mb-3.5">
                  <div className="w-11 h-11 rounded-full bg-pink-light flex items-center justify-center text-[18px] flex-shrink-0">
                    {bk.mode === 'package' ? (bk.pkg?.emoji || '🎁') : (bk.svcs[0]?.ico || '✂️')}
                  </div>
                  <div className="flex-1">
                    {bk.mode === 'package' ? (
                      <>
                        <div className="text-[11px] text-gray-500 uppercase tracking-[.5px] mb-1">Багц үйлчилгээ</div>
                        <div className="text-sm font-bold">{bk.pkg?.emoji} {bk.pkg?.name}</div>
                        {bk.pkg?.description && <div className="text-xs text-gray-400 mt-0.5">{bk.pkg.description}</div>}
                      </>
                    ) : (
                      <>
                        <div className="text-[11px] text-gray-500 uppercase tracking-[.5px] mb-1">Үйлчилгээ ({bk.svcs.length})</div>
                        <div className="flex flex-col gap-1">
                          {bk.svcs.map(s => (
                            <div key={s.name} className="flex justify-between text-sm">
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
                  { ico: '👩‍🦱', lbl:'Артист', val: bk.art },
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
                      <div className="text-[11px] text-gray-500 uppercase tracking-[.5px]">{lbl}</div>
                      <div className="text-sm font-semibold">{val}</div>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between py-3.5 border-t-2 border-gray-200 mt-1.5">
                  <span className="text-[15px] font-bold">Нийт үнэ</span>
                  <span className="text-xl font-bold text-pink">
                    ₮{bk.mode === 'package'
                      ? (bk.pkg?.price ?? 0).toLocaleString()
                      : bk.svcs.reduce((s, v) => s + (v.price ?? 0), 0).toLocaleString()}
                  </span>
                </div>
                <div className="mt-4 border-t border-gray-200 pt-3.5">
                  <div className="text-sm font-semibold text-dark mb-2.5">Холбоо барих мэдээлэл</div>
                  <div className="mb-2.5">
                    <label className="block text-xs font-semibold mb-1">Утасны дугаар <span className="text-salon-red">*</span></label>
                    <input ref={phoneRef} type="tel" placeholder="99xxxxxx" defaultValue={user?.user_metadata?.phone || ''}
                      className="w-full px-3 py-2 border-[1.5px] border-gray-200 rounded-xl text-sm font-sans outline-none focus:border-gold transition-all max-[640px]:text-base" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Нэмэлт тэмдэглэл <span className="text-gray-400 font-normal">(заавал биш)</span></label>
                    <textarea ref={notesRef} rows={2} placeholder="Жишээ: тодорхой загвар, харшил, тусгай хүсэлт..."
                      className="w-full px-3 py-2 border-[1.5px] border-gray-200 rounded-xl text-sm font-sans outline-none focus:border-gold transition-all resize-none max-[640px]:text-base" />
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
          <button onClick={() => setStep(s => bookingArtist && s === 3 ? 1 : s - 1)} disabled={step <= 1}
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
