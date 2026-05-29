'use client';
import Image from 'next/image';
import { useUI } from '@/contexts/UIContext';

const SERVICES = [
  { name:'Lash Extension', desc:'Classic, Volume, Mega Volume lash', price:'₮45,000+', img:'https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=200&q=80&auto=format&fit=crop', emoji:'👁️' },
  { name:'Brow Lamination', desc:'Хөмсөгний засал, lamination', price:'₮35,000+', img:'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=200&q=80&auto=format&fit=crop', emoji:'✨' },
  { name:'Маникюр & Гель', desc:'Хумсны засал, гель, дизайн', price:'₮28,000+', img:'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=200&q=80&auto=format&fit=crop', emoji:'💅' },
  { name:'Педикюр', desc:'Хөлийн хумсны засал, массаж', price:'₮35,000+', img:'https://images.unsplash.com/photo-1519415943484-9fa1873496d4?w=200&q=80&auto=format&fit=crop', emoji:'🦶' },
  { name:'Нүүрний будалт', desc:'Урлалт гоо будалт, арилжааны будалт', price:'₮70,000+', img:'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=200&q=80&auto=format&fit=crop', emoji:'💄' },
  { name:'Wax үйлчилгээ', desc:'Бие засах, хөмсөг, lip wax', price:'₮18,000+', img:'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=200&q=80&auto=format&fit=crop', emoji:'🌿' },
  { name:'Нүүрний засал', desc:'Цэвэрлэгээ, маск, антиэйжинг', price:'₮55,000+', img:'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=200&q=80&auto=format&fit=crop', emoji:'🧖' },
  { name:'Үсний эмчилгээ', desc:'Кератин, хатаалт, тэжээлт', price:'₮45,000+', img:'https://images.unsplash.com/photo-1559599101-f09722fb4948?w=200&q=80&auto=format&fit=crop', emoji:'💆' },
];

export default function Services() {
  const { openBooking } = useUI();
  return (
    <section className="services-section" id="services">
      <div className="sec-header fade-up">
        <h2 className="sec-title">Манай <span>Үйлчилгээ</span></h2>
        <button className="btn-ghost" onClick={openBooking}>Бүгдийг захиалах</button>
      </div>
      <div className="services-grid">
        {SERVICES.map((s, i) => (
          <div key={i} className="svc-card fade-up" onClick={openBooking} style={{ cursor:'pointer' }}>
            <div className="svc-icon">
              <Image src={s.img} alt={s.name} width={64} height={64} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'inherit' }} />
            </div>
            <div>
              <div className="svc-name">{s.name}</div>
              <div className="svc-desc">{s.desc}</div>
              <div className="svc-price">{s.price}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
