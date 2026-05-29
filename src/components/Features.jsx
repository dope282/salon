const FEATURES = [
  { icon:'💎', title:'Тансаг Орчин', desc:'Таны амар тайван байдал, тансаглалыг хамгийн тэргүүнд тавина. Гоо сайхны дэлхийд таныг угтана.' },
  { icon:'👩‍🎓', title:'Мэргэшсэн Баг', desc:'Олон жилийн туршлагатай уран бүтээлчид таны хүслийг биелүүлэх болно.' },
  { icon:'🌿', title:'Байгалийн Бүтээгдэхүүн', desc:'Зөвхөн аюулгүй, байгалийн эх үүсвэртэй бүтээгдэхүүнийг ашигладаг.' },
  { icon:'⭐', title:'Баталгаат Үйлчилгээ', desc:'4.9 оноотой, 2500+ сэтгэл хангалуун үйлчлүүлэгчтэй туршлагатай салон.' },
];

export default function Features() {
  return (
    <section className="features-section" id="about">
      <div style={{ textAlign:'center', marginBottom:48 }}>
        <h2 className="sec-title fade-up">Яагаад <span>Биднийг Сонгох Вэ?</span></h2>
        <p style={{ fontSize:15, color:'var(--gray-500)', marginTop:12, maxWidth:480, margin:'12px auto 0' }}>
          Тансаглал, мэргэжил, итгэл — энэ гурвыг нэгтгэсэн салон
        </p>
      </div>
      <div className="features-grid">
        {FEATURES.map((f, i) => (
          <div key={i} className="feat-card fade-up">
            <div className="feat-icon">{f.icon}</div>
            <div className="feat-title">{f.title}</div>
            <div className="feat-desc">{f.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
