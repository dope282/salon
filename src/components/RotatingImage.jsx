'use client';
import { useState, useEffect } from 'react';

/**
 * Олон зургийг автоматаар ээлжлэн (fade) харуулна.
 * - images: string[] (хоосон бол fallback харагдана)
 * - className: гадна хайрцгийн хэмжээ/харьцааг тодорхойлно (aspect, w/h)
 * - interval: солих хугацаа (ms)
 * - fallback: зураггүй үед харуулах node (эможи г.м.)
 * - dots: доод заагч цэгүүд харуулах эсэх
 */
export default function RotatingImage({ images = [], alt = '', className = '', interval = 3500, fallback = null, dots = false }) {
  const list = (Array.isArray(images) ? images : []).filter(Boolean);
  const [i, setI] = useState(0);

  useEffect(() => {
    setI(0);
    if (list.length <= 1) return;
    const t = setInterval(() => setI(p => (p + 1) % list.length), interval);
    return () => clearInterval(t);
  }, [list.join('|'), interval]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {list.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center">{fallback}</div>
      ) : list.map((src, idx) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src + idx}
          src={src}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: idx === i ? 1 : 0, transition: 'opacity .9s ease-in-out' }}
        />
      ))}
      {dots && list.length > 1 && (
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5 z-[2]">
          {list.map((_, idx) => (
            <span key={idx} className="w-1.5 h-1.5 rounded-full transition-all duration-300"
              style={{ background: idx === i ? '#fff' : 'rgba(255,255,255,.45)', transform: idx === i ? 'scale(1.3)' : 'scale(1)' }} />
          ))}
        </div>
      )}
    </div>
  );
}
