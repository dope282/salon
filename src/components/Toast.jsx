'use client';
import { useUI } from '@/contexts/UIContext';

export default function Toast() {
  const { toast } = useUI();
  return (
    <div className={`toast fixed bottom-8 right-8 text-white px-5 py-4 rounded-2xl text-sm font-medium z-[9999] flex items-center gap-2.5 shadow-[0_8px_32px_rgba(0,0,0,.20)] max-[640px]:bottom-0 max-[640px]:left-0 max-[640px]:right-0 max-[640px]:rounded-none ${toast.type === 'ok' ? 'bg-gradient-to-r from-[#1A1A2E] to-[#2C2C3E] border-l-4 border-gold' : 'bg-gradient-to-r from-[#C53030] to-[#E53E3E]'}${toast.show ? ' show' : ''}`}>
      <span className={toast.type === 'ok' ? 'text-gold' : 'text-white'}>{toast.type === 'ok' ? '✓' : '✕'}</span>
      <span className="tracking-wide">{toast.msg}</span>
    </div>
  );
}
