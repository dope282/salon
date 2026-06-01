const FEATURES = [
  { icon:'🏡', title:'Тав Тухтай Орчин', desc:'AMU MALL-н 6 давхарт байрлах тав тухтай цэвэр цэмцгэр орчинд орчинд үйлчлүүлээрэй.' },
  { icon:'👑', title:'Мэргэшсэн Артистууд', desc:'Чадварлаг туршлагатай артистууд таны онцлогт тохируулан ажиллана.' },
  { icon:'💎', title:'Premium Бүтээгдэхүүн', desc:'Дэлхийн шилдэг брэндүүд Lycon Wax, Estemax, Studex болон чанартай материал ашиглан аюулгүй үйлчилгээ үзүүлнэ.' },
  { icon:'⭐', title:'Үйлчлүүлэгчдийн итгэл', desc:'Чанар хариуцлага ур чадвараараа үйлчлүүлэгчдийнхаа итгэлийг хүлээсэн салон болно.' },
];

export default function Features() {
  return (
    <section id="about" className="py-[80px] px-12 bg-[#404040] max-[900px]:px-5 max-[900px]:py-14 max-[640px]:px-4 max-[640px]:py-10">
      <div className="text-center mb-14 max-[640px]:mb-9">
        <p className="text-[11px] font-bold uppercase tracking-[3px] text-gold mb-3">Яагаад бидэн</p>
        <h2 className="font-serif text-[36px] font-semibold text-white tracking-tight fade-up max-[900px]:text-[28px] max-[640px]:text-2xl">
          Яагаад <span className="gold-shimmer">Биднийг Сонгох</span> Вэ?
        </h2>
        <p className="text-[14px] text-white/40 mt-3 max-w-[420px] mx-auto tracking-wide">
          ✔️ Мэргэжлийн үйлчилгээ
        </p>
        <p className="text-[14px] text-white/40 mt-3 max-w-[420px] mx-auto tracking-wide">
          ✔️ Цэвэр, аюулгүй орчин
        </p>
        <p className="text-[14px] text-white/40 mt-3 max-w-[420px] mx-auto tracking-wide">
          ✔️ Танд тохирсон design
        </p>
      </div>

      <div className="grid grid-cols-4 gap-6 max-[1200px]:grid-cols-2 max-[900px]:gap-4 max-[640px]:grid-cols-2 max-[640px]:gap-3 max-[380px]:grid-cols-1">
        {FEATURES.map((f, i) => (
          <div key={i} className="group text-center py-9 px-6 bg-[#606060]/5 border border-white/8 rounded-2xl transition-all duration-300 hover:bg-[#606060]/8 hover:border-gold/30 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(255,51,153,.12)] fade-up max-[640px]:py-6 max-[640px]:px-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF3399]/20 to-[#FF3399]/10 border border-gold/20 flex items-center justify-center text-[28px] mx-auto mb-5 group-hover:border-gold/40 transition-all max-[640px]:w-12 max-[640px]:h-12 max-[640px]:text-xl max-[640px]:mb-4">
              {f.icon}
            </div>
            <div className="text-[15px] font-semibold text-white mb-2 max-[640px]:text-[14px]">{f.title}</div>
            <div className="text-[13px] text-white/45 leading-[1.7] max-[640px]:text-xs">{f.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
