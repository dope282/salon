const FEATURES = [
  { icon:'💎', title:'Тансаг Орчин', desc:'Таны амар тайван байдал, тансаглалыг хамгийн тэргүүнд тавина. Гоо сайхны дэлхийд таныг угтана.' },
  { icon:'👩‍🎓', title:'Мэргэшсэн Баг', desc:'Олон жилийн туршлагатай уран бүтээлчид таны хүслийг биелүүлэх болно.' },
  { icon:'🌿', title:'Байгалийн Бүтээгдэхүүн', desc:'Зөвхөн аюулгүй, байгалийн эх үүсвэртэй бүтээгдэхүүнийг ашигладаг.' },
  { icon:'⭐', title:'Баталгаат Үйлчилгээ', desc:'4.9 оноотой, 2500+ сэтгэл хангалуун үйлчлүүлэгчтэй туршлагатай салон.' },
];

export default function Features() {
  return (
    <section id="about" className="py-[80px] px-12 bg-dark max-[900px]:px-5 max-[900px]:py-14 max-[640px]:px-4 max-[640px]:py-10">
      <div className="text-center mb-14 max-[640px]:mb-9">
        <p className="text-[11px] font-bold uppercase tracking-[3px] text-gold mb-3">Яагаад бидэн</p>
        <h2 className="font-serif text-[36px] font-semibold text-white tracking-tight fade-up max-[900px]:text-[28px] max-[640px]:text-2xl">
          Яагаад <span className="bg-gradient-to-r from-[#D4AF37] to-[#F0C060] bg-clip-text text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]">Биднийг Сонгох</span> Вэ?
        </h2>
        <p className="text-[14px] text-white/40 mt-3 max-w-[420px] mx-auto tracking-wide">
          Тансаглал, мэргэжил, итгэл — энэ гурвыг нэгтгэсэн салон
        </p>
      </div>

      <div className="grid grid-cols-4 gap-6 max-[1200px]:grid-cols-2 max-[900px]:gap-4 max-[640px]:grid-cols-2 max-[640px]:gap-3 max-[380px]:grid-cols-1">
        {FEATURES.map((f, i) => (
          <div key={i} className="group text-center py-9 px-6 bg-white/5 border border-white/8 rounded-2xl transition-all duration-300 hover:bg-white/8 hover:border-gold/30 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(201,168,76,.12)] fade-up max-[640px]:py-6 max-[640px]:px-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#B8960C]/20 to-[#C9A84C]/10 border border-gold/20 flex items-center justify-center text-[28px] mx-auto mb-5 group-hover:border-gold/40 transition-all max-[640px]:w-12 max-[640px]:h-12 max-[640px]:text-xl max-[640px]:mb-4">
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
