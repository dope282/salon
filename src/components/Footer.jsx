import Image from 'next/image';

export default function Footer() {
  return (
    <footer id="contact" className="bg-dark text-white pt-20 px-12 pb-8 max-[900px]:px-5 max-[900px]:pt-12 max-[640px]:px-4 max-[640px]:pt-9 max-[640px]:pb-6">
      {/* Top divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent mb-12 max-[640px]:mb-8" />

      <div className="grid grid-cols-[2fr_1fr_1fr_1.4fr] gap-14 mb-14 max-[1200px]:grid-cols-[1fr_1fr_1fr] max-[1200px]:gap-8 max-[900px]:grid-cols-2 max-[900px]:gap-8 max-[640px]:grid-cols-1 max-[640px]:gap-7">
        <div>
          <Image src="/logo.png" alt="Hatantsetsey lash" width={140} height={56}
            className="h-14 w-auto bg-white rounded-xl px-4 py-2 mb-5" />
          <p className="text-white/45 text-[13px] leading-[1.85] mb-6 max-w-[280px]">
            Hatantsetsey lash Beauty Salon — тансаглал, мэргэжил, итгэлийн нэгдэл. Та бидэнтэй хамт гоо сайхныхаа шинэ хуудсыг нээнэ үү.
          </p>
          <div className="flex gap-3">
            {['facebook'].map(s => (
              <a key={s} href="https://www.facebook.com/Hatantsetsegsalon"
                className="w-9 h-9 rounded-full bg-white/6 border border-white/10 flex items-center justify-center text-white/50 no-underline text-sm transition-all hover:bg-gold/20 hover:border-gold/30 hover:text-gold">
                <i className={`fab fa-${s}`} />
              </a>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[10px] font-bold uppercase tracking-[2.5px] text-gold mb-5">Хурдан холбоос</div>
          <ul className="list-none space-y-3">
            {['Нүүр','Үйлчилгээ','Артистууд','Бидний тухай','Холбоо барих'].map(l => (
              <li key={l}>
                <a href="#" className="text-white/40 no-underline text-[13px] transition-colors hover:text-gold tracking-wide">{l}</a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-[10px] font-bold uppercase tracking-[2.5px] text-gold mb-5">Дэмжлэг</div>
          <ul className="list-none space-y-3">
            {['Түгээмэл асуулт','Захиалгын дүрэм','Цуцлалт','Нууцлалын бодлого','Үйлчилгээний нөхцөл'].map(l => (
              <li key={l}>
                <a href="#" className="text-white/40 no-underline text-[13px] transition-colors hover:text-gold tracking-wide">{l}</a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-[10px] font-bold uppercase tracking-[2.5px] text-gold mb-5">Холбоо барих</div>
          {[
            ['fa-phone','85897070', 'tel:85897070'],
            ['fa-envelope','bdolmoosuren@gmail.com', 'mailto:bdolmoosuren@gmail.com'],
            ['fa-map-marker-alt','Darkhan, Mongolia, Дархан-AMU MALL -худалдааны төв 6н давхарт', 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('AMU MALL Darkhan Mongolia')],
          ].map(([icon, text, href]) => (
            <a key={text} href={href}
              target={icon === 'fa-map-marker-alt' ? '_blank' : undefined}
              rel={icon === 'fa-map-marker-alt' ? 'noopener noreferrer' : undefined}
              className="flex items-start gap-3 text-white/40 text-[13px] mb-3 no-underline hover:text-gold transition-colors">
              <i className={`fas ${icon} text-gold/70 w-4 text-center mt-0.5 flex-shrink-0`} />
              <span>{text}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div className="w-full h-px bg-white/8 mb-6" />
      <div className="flex items-center justify-between gap-4 flex-wrap max-[640px]:flex-col max-[640px]:text-center">
        <div className="text-white/25 text-[12px] tracking-wide">© 2024 Hatantsetsey lash Beauty Salon. Бүх эрх хамгаалагдсан.</div>
        <div className="text-white/20 text-[11px] tracking-wider uppercase">LASH · BROW LAMI · NAIL · WAX</div>
      </div>
    </footer>
  );
}
