'use client';
import { useUI } from '@/contexts/UIContext';

export default function Toast() {
  const { toast } = useUI();
  return (
    <div className={`toast ${toast.type}${toast.show ? ' show' : ''}`}>
      <span>{toast.type === 'ok' ? '✓' : '✕'}</span>
      <span>{toast.msg}</span>
    </div>
  );
}
