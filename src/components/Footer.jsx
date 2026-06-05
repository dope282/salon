import Image from 'next/image';

const FB_PAGE = 'https://www.facebook.com/Hatantsetsegsalon';
const IG_PAGE = 'https://www.instagram.com/hatantsetseg_lash_brow_artist/?hl=en';

const SOCIALS = [
  { name: 'facebook',  icon: 'fa-facebook-f', href: FB_PAGE },
  { name: 'instagram', icon: 'fa-instagram',  href: IG_PAGE },
];

export default function Footer() {
  return (
    <footer id="contact" className="bg-[#404040] text-white pt-20 px-12 pb-8 max-[900px]:px-5 max-[900px]:pt-12 max-[640px]:px-4 max-[640px]:pt-9 max-[640px]:pb-6">
      {/* Top divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent mb-12 max-[640px]:mb-8" />

      <div className="grid grid-cols-[2fr_1fr_1fr_1.4fr] gap-14 mb-14 max-[1200px]:grid-cols-[1fr_1fr_1fr] max-[1200px]:gap-8 max-[900px]:grid-cols-2 max-[900px]:gap-8 max-[640px]:grid-cols-2 max-[640px]:gap-x-6 max-[640px]:gap-y-8 max-[640px]:mb-10">
        <div className="max-[640px]:col-span-2">
          <Image src="/logo.png" alt="Hatantsetsey lash" width={140} height={56}
            className="h-14 w-auto bg-[#606060] rounded-xl px-4 py-2 mb-5" />
          <p className="text-white/45 text-[13px] leading-[1.85] mb-6 max-w-[280px]">
            Hatantsetsey lash Beauty Salon — тансаглал, мэргэжил, итгэлийн нэгдэл. Та бидэнтэй хамт гоо сайхныхаа шинэ хуудсыг нээнэ үү.
          </p>
          <div className="flex gap-3">
            {SOCIALS.map(s => (
              <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-[#606060]/6 border border-white/10 flex items-center justify-center text-white/50 no-underline text-sm transition-all hover:bg-gold/20 hover:border-gold/30 hover:text-gold">
                <i className={`fab ${s.icon}`} />
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

        <div className="max-[640px]:col-span-2">
          <div className="text-[10px] font-bold uppercase tracking-[2.5px] text-gold mb-5 max-[640px]:mb-3">Холбоо барих</div>
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

      {/* ── Биднийг дагаарай — Facebook + Instagram ── */}
      <div className="flex flex-col items-center gap-3 mb-14 max-[640px]:mb-10">
        <div className="text-[10px] font-bold uppercase tracking-[2.5px] text-gold">Биднийг дагаарай</div>

        <div className="flex items-stretch justify-center gap-4 flex-wrap">
          {/* Facebook Page Plugin */}
          <div className="bg-white rounded-2xl p-2 shadow-[0_8px_30px_rgba(0,0,0,.25)] overflow-hidden w-[356px] h-[166px] max-[380px]:w-[316px]">
            <iframe
              title="Facebook Page"
              src={`https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(FB_PAGE)}&tabs=&width=340&height=150&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true`}
              width="340" height="150"
              className="border-none overflow-hidden block max-[380px]:w-[300px]"
              scrolling="no" frameBorder="0" allowFullScreen
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            />
          </div>

          <a href={IG_PAGE} target="_blank" rel="noopener noreferrer"
            className="bg-white rounded-2xl p-4 shadow-[0_8px_30px_rgba(0,0,0,.25)] no-underline flex flex-col justify-between w-[356px] h-[166px] max-[380px]:w-[316px]">
            <div className="flex items-center gap-3">
              <div className="w-[58px] h-[58px] rounded-xl flex items-center justify-center text-white text-[28px] flex-shrink-0"
                style={{ background: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)' }}>
                <i className="fab fa-instagram" />
              </div>
              <div className="min-w-0">
                <div className="text-[15px] font-bold leading-tight" style={{ color: '#111' }}>Hatantsetseg Lash</div>
                <div className="text-[12px] truncate" style={{ color: '#8a8a8a' }}>@hatantsetseg_lash_brow_artist</div>
                <div className="text-[12px] mt-0.5" style={{ color: '#8a8a8a' }}>Instagram дээр дагаарай</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-white text-[13px] font-semibold"
              style={{ background: 'linear-gradient(45deg,#f09433,#dc2743,#bc1888)' }}>
              <i className="fab fa-instagram" /> Дагах
            </div>
          </a>
        </div>

        {/* Social icons row */}
        <div className="flex items-center gap-4">
          {SOCIALS.map(s => (
            <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer"
              aria-label={s.name}
              className="w-11 h-11 rounded-full bg-white/8 border border-white/15 flex items-center justify-center text-white/70 no-underline text-lg transition-all hover:bg-gold/20 hover:border-gold/40 hover:text-gold hover:-translate-y-0.5">
              <i className={`fab ${s.icon}`} />
            </a>
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div className="w-full h-px bg-[#606060]/8 mb-6" />
      <div className="flex items-center justify-between gap-4 flex-wrap max-[640px]:flex-col max-[640px]:text-center">
        <div className="text-white/25 text-[12px] tracking-wide">© 2026 Hatantsetsey lash Beauty Salon. Бүх эрх хамгаалагдсан.</div>
        <div className="text-white/20 text-[11px] tracking-wider uppercase">LASH · BROW LAMI · NAIL · WAX</div>
      </div>
    </footer>
  );
}
