'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady]     = useState(false);   // recovery session бэлэн эсэх
  const [checked, setChecked] = useState(false);
  const [pass, setPass]       = useState('');
  const [pass2, setPass2]     = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [msg, setMsg]         = useState(null);
  const [show, setShow]       = useState(false);

  useEffect(() => {
    // supabase-js нь URL hash доторх recovery token-г автоматаар уншиж session үүсгэнэ
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
      setChecked(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const submit = async () => {
    if (!/^[0-9]{6}$/.test(pass)) { setMsg({ type: 'err', text: 'Нууц үг 6 оронтой тоо байх ёстой.' }); return; }
    if (pass !== pass2)  { setMsg({ type: 'err', text: 'Нууц үгнүүд таарахгүй байна.' }); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pass });
    setLoading(false);
    if (error) { setMsg({ type: 'err', text: error.message }); return; }
    setDone(true);
    setTimeout(() => router.replace('/'), 2500);
  };

  const inp = 'w-full px-4 py-3 border border-gold/20 rounded-xl text-[14px] font-sans outline-none transition-all bg-[#606060] focus:border-gold focus:shadow-[0_0_0_3px_rgba(255,51,153,.12)] text-pink-200 placeholder:text-pink-400';
  const lbl = 'block text-[12px] font-semibold text-pink-200/60 mb-1.5 uppercase tracking-[.8px]';

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#606060]">
      <div className="bg-[#606060] rounded-[28px] px-10 py-10 w-[min(420px,92vw)] relative shadow-[0_32px_80px_rgba(0,0,0,.25),0_0_0_1px_rgba(255,51,153,.12)] max-[640px]:px-5">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#FF3399] via-[#FF66B2] to-[#FF3399] rounded-t-[28px]" />

        <div className="text-center mb-6">
          <Image src="/logo.png" alt="Hatantsetsey lash" width={90} height={44} style={{ height: 44, width: 'auto', display: 'block', margin: '0 auto' }} />
        </div>

        {done ? (
          <div className="text-center py-6">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="font-serif text-[22px] font-semibold text-pink-200 mb-2">Нууц үг шинэчлэгдлээ!</h2>
            <p className="text-sm text-pink-400">Удахгүй нүүр хуудас руу шилжинэ...</p>
          </div>
        ) : !checked ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-pink border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !ready ? (
          <div className="text-center py-6">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="font-serif text-[20px] font-semibold text-pink-200 mb-2">Холбоос хүчингүй байна</h2>
            <p className="text-sm text-pink-400 mb-5">Нууц үг сэргээх холбоосын хугацаа дууссан эсвэл буруу байна. Дахин хүсэлт илгээнэ үү.</p>
            <a href="/" className="inline-block bg-gradient-to-r from-[#FF3399] via-[#FF66B2] to-[#FF3399] text-white px-6 py-2.5 rounded-full text-sm font-semibold no-underline">
              Нүүр хуудас
            </a>
          </div>
        ) : (
          <>
            <h2 className="font-serif text-[24px] font-semibold text-center mb-1 text-pink-200">Шинэ нууц үг</h2>
            <p className="text-xs text-pink-200/35 text-center mb-6 tracking-wide">Шинэ нууц үгээ оруулна уу</p>

            {msg && (
              <div className={`rounded-xl px-4 py-3 text-[13px] mb-4 border ${msg.type === 'ok' ? 'bg-[#f0fff4] text-[#276749] border-[#68D391]/30' : 'bg-[#fff5f5] text-[#C53030] border-[#FC8181]/30'}`}>
                {msg.text}
              </div>
            )}

            <div className="mb-3">
              <label className={lbl}>Шинэ нууц үг <span className="text-pink-200/25 normal-case tracking-normal font-normal">(6 оронтой тоо)</span></label>
              <div className="relative">
                <input type={show ? 'text' : 'password'} inputMode="numeric" maxLength={6} value={pass} onChange={e => setPass(e.target.value)} placeholder="6 оронтой тоо" autoComplete="new-password" className={`${inp} pr-12 tracking-[.3em]`} />
                <button type="button" tabIndex={-1} onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[18px] cursor-pointer bg-transparent border-none leading-none">{show ? '🙈' : '👁️'}</button>
              </div>
            </div>
            <div className="mb-2">
              <label className={lbl}>Нууц үг давтах</label>
              <input type={show ? 'text' : 'password'} inputMode="numeric" maxLength={6} value={pass2} onChange={e => setPass2(e.target.value)} placeholder="6 оронтой тоо" autoComplete="new-password"
                onKeyDown={e => { if (e.key === 'Enter') submit(); }} className={`${inp} tracking-[.3em]`} />
            </div>
            <button disabled={loading} onClick={submit}
              className="w-full py-3.5 bg-gradient-to-r from-[#FF3399] via-[#FF66B2] to-[#FF3399] text-white border-none rounded-full text-[14px] font-bold cursor-pointer mt-3 transition-all shadow-[0_4px_16px_rgba(255,51,153,.35)] hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed tracking-wide">
              {loading ? 'Хадгалж байна...' : 'Нууц үг шинэчлэх'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
