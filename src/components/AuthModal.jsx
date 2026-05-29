'use client';
import { useState, useRef } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useUI }   from '@/contexts/UIContext';
import { ADMIN_EMAIL } from '@/lib/supabase';

export default function AuthModal() {
  const { signIn, signUp, resetPassword } = useAuth();
  const { authOpen, closeAuth, showToast } = useUI();

  const [tab, setTab]       = useState('login');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]       = useState(null); // { text, type }

  // Refs for inputs
  const loginEmailRef = useRef();
  const loginPassRef  = useRef();
  const regEmailRef   = useRef();
  const regPassRef    = useRef();
  const regPass2Ref   = useRef();

  const clearMsg = () => setMsg(null);
  const showMsg  = (text, type='err') => setMsg({ text, type });

  const switchTab = (t) => { setTab(t); clearMsg(); };

  const handleLogin = async () => {
    const email = loginEmailRef.current.value.trim();
    const pass  = loginPassRef.current.value;
    if (!email || !pass) { showMsg('Бүх талбарыг бөглөнө үү.'); return; }
    setLoading(true);
    try {
      await signIn(email, pass);
      closeAuth();
      showToast('Тавтай морилно уу! 🌸', 'ok');
      if (email === ADMIN_EMAIL) setTimeout(() => window.location.href = '/admin', 600);
    } catch {
      showMsg('Имэйл эсвэл нууц үг буруу байна.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    const email = regEmailRef.current.value.trim();
    const pass  = regPassRef.current.value;
    const pass2 = regPass2Ref.current.value;
    if (!email || !pass || !pass2) { showMsg('Бүх талбарыг бөглөнө үү.'); return; }
    if (pass.length < 8)  { showMsg('Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой.'); return; }
    if (pass !== pass2)   { showMsg('Нууц үгнүүд таарахгүй байна.'); return; }
    setLoading(true);
    try {
      await signUp(email, pass);
      showMsg('✓ Баталгаажуулах имэйл илгээлээ! Имэйлээ шалгана уу.', 'ok');
    } catch (e) {
      showMsg(e.message === 'User already registered' ? 'Энэ имэйл аль хэдийн бүртгэлтэй байна.' : e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    const email = loginEmailRef.current?.value.trim();
    if (!email) { showMsg('Имэйл хаягаа оруулна уу.'); return; }
    setLoading(true);
    try {
      await resetPassword(email);
      showMsg('✓ Нууц үг шинэчлэх холбоос илгээлээ.', 'ok');
    } catch (e) {
      showMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') tab === 'login' ? handleLogin() : handleRegister();
  };

  if (!authOpen) return null;

  return (
    <div className={`login-overlay${authOpen ? ' open' : ''}`} onClick={e => { if (e.target === e.currentTarget) closeAuth(); }}>
      <div className="login-modal" onClick={e => e.stopPropagation()}>
        <button className="login-close" onClick={closeAuth}>✕</button>

        <div className="login-logo" style={{ textAlign:'center', marginBottom:6 }}>
          <Image src="/logo.jpg" alt="Hatantsetsey lash" width={80} height={32} style={{ height:40, width:'auto', display:'block', margin:'0 auto' }} />
        </div>

        {/* Tabs */}
        <div className="auth-tabs">
          <button className={`auth-tab${tab === 'login' ? ' active' : ''}`} onClick={() => switchTab('login')}>Нэвтрэх</button>
          <button className={`auth-tab${tab === 'reg'   ? ' active' : ''}`} onClick={() => switchTab('reg')}>Бүртгүүлэх</button>
        </div>

        {/* Error / success */}
        {msg && <div className={`auth-msg ${msg.type}`}>{msg.text}</div>}

        {/* LOGIN */}
        {tab === 'login' && (
          <>
            <h2 className="login-title">Тавтай морил</h2>
            <p className="login-sub">Та өөрийн бүртгэлээр нэвтэрнэ үү</p>
            <div className="login-field">
              <label>Имэйл хаяг</label>
              <input ref={loginEmailRef} type="email" placeholder="name@example.com" autoComplete="email" onKeyDown={handleKeyDown} />
            </div>
            <div className="login-field">
              <label>Нууц үг</label>
              <input ref={loginPassRef} type="password" placeholder="••••••••" autoComplete="current-password" onKeyDown={handleKeyDown} />
              <a className="login-forgot" onClick={handleForgot}>Нууц үгээ мартсан уу?</a>
            </div>
            <button className="login-btn" disabled={loading} onClick={handleLogin}>
              {loading ? 'Түр хүлээнэ үү...' : 'Нэвтрэх'}
            </button>
          </>
        )}

        {/* REGISTER */}
        {tab === 'reg' && (
          <>
            <h2 className="login-title">Шинэ бүртгэл</h2>
            <p className="login-sub">Хурдан бүртгүүлж давуу эрх эдэлнэ үү</p>
            <div className="login-field">
              <label>Имэйл хаяг</label>
              <input ref={regEmailRef} type="email" placeholder="name@example.com" autoComplete="email" onKeyDown={handleKeyDown} />
            </div>
            <div className="login-field">
              <label>Нууц үг <span style={{ color:'var(--gray-500)', fontSize:11 }}>(8+ тэмдэгт)</span></label>
              <input ref={regPassRef} type="password" placeholder="••••••••" autoComplete="new-password" onKeyDown={handleKeyDown} />
            </div>
            <div className="login-field">
              <label>Нууц үг давтах</label>
              <input ref={regPass2Ref} type="password" placeholder="••••••••" autoComplete="new-password" onKeyDown={handleKeyDown} />
            </div>
            <button className="login-btn" disabled={loading} onClick={handleRegister}>
              {loading ? 'Бүртгэж байна...' : 'Бүртгүүлэх'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
