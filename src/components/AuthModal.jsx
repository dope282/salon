'use client';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useUI }   from '@/contexts/UIContext';
import { ADMIN_EMAIL } from '@/lib/supabase';

const inp = 'w-full px-4 py-3 border border-gold/20 rounded-xl text-[14px] font-sans outline-none transition-all bg-[#606060] focus:border-gold focus:shadow-[0_0_0_3px_rgba(255,51,153,.12)] text-pink-200 placeholder:text-pink-400 max-[640px]:text-base';
const lbl = 'block text-[12px] font-semibold text-pink-200/60 mb-1.5 uppercase tracking-[.8px]';

export default function AuthModal() {
  const { signIn, signUp, resetPassword } = useAuth();
  const { authOpen, closeAuth, showToast } = useUI();
  const [tab, setTab]       = useState('login');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]       = useState(null);

  const loginEmailRef = useRef();
  const loginPassRef  = useRef();
  const regPhoneRef   = useRef();
  const regEmailRef   = useRef();
  const regPassRef    = useRef();
  const regPass2Ref   = useRef();

  const clearMsg = () => setMsg(null);
  const showMsg  = (text, type='err') => setMsg({ text, type });
  const switchTab = (t) => { setTab(t); clearMsg(); };

  // Modal нээгдэх бүрт хуучин msg цэвэрлэнэ
  useEffect(() => { if (authOpen) clearMsg(); }, [authOpen]);

  const handleLogin = async () => {
    const email = loginEmailRef.current.value.trim();
    const pass  = loginPassRef.current.value;
    if (!email || !pass) { showMsg('Бүх талбарыг бөглөнө үү.'); return; }
    setLoading(true);
    try {
      await signIn(email, pass);
      closeAuth();
      showToast('Тавтай морилно уу! ✨', 'ok');
      if (email === ADMIN_EMAIL) setTimeout(() => window.location.href = '/admin', 600);
    } catch { showMsg('Имэйл эсвэл нууц үг буруу байна.'); }
    finally { setLoading(false); }
  };

  const handleRegister = async () => {
    const phone = regPhoneRef.current.value.trim();
    const email = regEmailRef.current.value.trim();
    const pass  = regPassRef.current.value;
    const pass2 = regPass2Ref.current.value;
    if (!phone || !email || !pass || !pass2) { showMsg('Бүх талбарыг бөглөнө үү.'); return; }
    if (!/^[0-9]{8}$/.test(phone)) { showMsg('Утасны дугаар 8 оронтой байх ёстой.'); return; }
    if (pass.length < 8) { showMsg('Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой.'); return; }
    if (pass !== pass2)  { showMsg('Нууц үгнүүд таарахгүй байна.'); return; }
    setLoading(true);
    try {
      await signUp(email, pass, { phone });
      showMsg('✓ Баталгаажуулах имэйл илгээлээ! Имэйлээ шалгана уу.', 'ok');
    } catch (e) {
      showMsg(e.message === 'User already registered' ? 'Энэ имэйл аль хэдийн бүртгэлтэй байна.' : e.message);
    } finally { setLoading(false); }
  };

  const handleForgot = async () => {
    const email = loginEmailRef.current?.value.trim();
    if (!email) { showMsg('Имэйл хаягаа оруулна уу.'); return; }
    setLoading(true);
    try { await resetPassword(email); showMsg('✓ Нууц үг шинэчлэх холбоос илгээлээ.', 'ok'); }
    catch (e) { showMsg(e.message); }
    finally { setLoading(false); }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') tab === 'login' ? handleLogin() : handleRegister(); };

  if (!authOpen) return null;

  return (
    <div className={`login-overlay${authOpen ? ' open' : ''}`} onClick={e => { if (e.target === e.currentTarget) closeAuth(); }}>
      <div className="login-modal bg-[#606060] rounded-[28px] px-10 py-10 w-[min(420px,92vw)] relative shadow-[0_32px_80px_rgba(0,0,0,.18),0_0_0_1px_rgba(255,51,153,.12)] max-[640px]:px-5" onClick={e => e.stopPropagation()}>
        {/* Gold top bar */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#FF3399] via-[#FF66B2] to-[#FF3399] rounded-t-[28px]" />

        <button onClick={closeAuth}
          className="absolute top-4 right-4 bg-gold/8 border border-gold/15 w-8 h-8 rounded-full text-sm cursor-pointer text-pink-200/40 flex items-center justify-center transition-all hover:bg-gold/15 hover:text-pink-200">
          ✕
        </button>

        <div className="text-center mb-6">
          <Image src="/logo.png" alt="Hatantsetsey lash" width={90} height={36} style={{ height: 44, width: 'auto', display: 'block', margin: '0 auto' }} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#606060]/5 rounded-xl p-1 mb-6">
          {[['login','Нэвтрэх'],['reg','Бүртгүүлэх']].map(([id, label]) => (
            <button key={id} onClick={() => switchTab(id)}
              className={`flex-1 py-2.5 border-none rounded-[10px] text-sm font-semibold cursor-pointer transition-all tracking-wide ${tab === id ? 'bg-gradient-to-r from-[#FF3399] via-[#FF66B2] to-[#FF3399] text-white shadow-sm' : 'bg-transparent text-pink-200/40 hover:text-pink-200/60'}`}>
              {label}
            </button>
          ))}
        </div>

        {msg && (
          <div className={`rounded-xl px-4 py-3 text-[13px] mb-4 border ${msg.type === 'ok' ? 'bg-[#f0fff4] text-[#276749] border-[#68D391]/30' : 'bg-[#fff5f5] text-[#C53030] border-[#FC8181]/30'}`}>
            {msg.text}
          </div>
        )}

        {tab === 'login' && (
          <>
            <h2 className="font-serif text-[24px] font-semibold text-center mb-1 text-pink-200">Тавтай морил</h2>
            <p className="text-xs text-pink-200/35 text-center mb-6 tracking-wide uppercase">Өөрийн бүртгэлээр нэвтэрнэ үү</p>
            <div className="mb-4">
              <label className={lbl}>Имэйл хаяг</label>
              <input ref={loginEmailRef} type="email" placeholder="name@example.com" autoComplete="email" onKeyDown={handleKeyDown} className={inp} />
            </div>
            <div className="mb-2">
              <label className={lbl}>Нууц үг</label>
              <input ref={loginPassRef} type="password" placeholder="••••••••" autoComplete="current-password" onKeyDown={handleKeyDown} className={inp} />
              <a className="block text-right text-[11px] text-[#FF3399] mt-1.5 cursor-pointer hover:text-gold tracking-wide" onClick={handleForgot}>Нууц үгээ мартсан уу?</a>
            </div>
            <button disabled={loading} onClick={handleLogin}
              className="w-full py-3.5 bg-gradient-to-r from-[#FF3399] via-[#FF66B2] to-[#FF3399] text-pink-200 border-none rounded-full text-[14px] font-bold cursor-pointer mt-3 transition-all shadow-[0_4px_16px_rgba(255,51,153,.35)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(255,51,153,.50)] disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 tracking-wide">
              {loading ? 'Түр хүлээнэ үү...' : 'Нэвтрэх'}
            </button>
          </>
        )}

        {tab === 'reg' && (
          <>
            <h2 className="font-serif text-[24px] font-semibold text-center mb-1 text-pink-200">Шинэ бүртгэл</h2>
            <p className="text-xs text-pink-200/35 text-center mb-6 tracking-wide uppercase">Хурдан бүртгүүлж давуу эрх эдэлнэ үү</p>
            {[
              { ref: regPhoneRef, label: 'Утасны дугаар',  type: 'tel',      ph: '99xxxxxx',           ac: 'tel' },
              { ref: regEmailRef, label: 'Имэйл хаяг',     type: 'email',    ph: 'name@example.com',   ac: 'email' },
              { ref: regPassRef,  label: 'Нууц үг',        type: 'password', ph: '••••••••',            ac: 'new-password', hint: '(8+ тэмдэгт)' },
              { ref: regPass2Ref, label: 'Нууц үг давтах', type: 'password', ph: '••••••••',            ac: 'new-password' },
            ].map(({ ref, label, type, ph, ac, hint }) => (
              <div key={label} className="mb-3">
                <label className={lbl}>{label} {hint && <span className="text-pink-200/25 normal-case tracking-normal font-normal">{hint}</span>}</label>
                <input ref={ref} type={type} placeholder={ph} autoComplete={ac} onKeyDown={handleKeyDown} className={inp} />
              </div>
            ))}
            <button disabled={loading} onClick={handleRegister}
              className="w-full py-3.5 bg-gradient-to-r from-[#FF3399] via-[#FF66B2] to-[#FF3399] text-pink-200 border-none rounded-full text-[14px] font-bold cursor-pointer mt-1 transition-all shadow-[0_4px_16px_rgba(255,51,153,.35)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(255,51,153,.50)] disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 tracking-wide">
              {loading ? 'Бүртгэж байна...' : 'Бүртгүүлэх'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
