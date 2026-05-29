import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="footer" id="contact">
      <div className="footer-grid">
        <div>
          <Image src="/logo.jpg" alt="Hatantsetsey lash" className="logo-img-footer" width={120} height={44} style={{ height:44, width:'auto' }} />
          <p className="footer-desc">
            Hatantsetsey lash Beauty Salon — тансаглал, мэргэжил, итгэлийн нэгдэл.
            Та бидэнтэй хамт гоо сайхныхаа шинэ хуудсыг нээнэ үү.
          </p>
          <div className="socials">
            {['instagram','facebook','tiktok','youtube'].map(s => (
              <a key={s} href="#" className="soc-a"><i className={`fab fa-${s}`} /></a>
            ))}
          </div>
        </div>
        <div>
          <div className="f-heading">Хурдан холбоос</div>
          <ul className="f-links">
            {['Нүүр','Үйлчилгээ','Уран бүтээлчид','Бидний тухай','Холбоо барих'].map(l => (
              <li key={l}><a href="#">{l}</a></li>
            ))}
          </ul>
        </div>
        <div>
          <div className="f-heading">Дэмжлэг</div>
          <ul className="f-links">
            {['Түгээмэл асуулт','Захиалгын дүрэм','Цуцлалт','Нууцлалын бодлого','Үйлчилгээний нөхцөл'].map(l => (
              <li key={l}><a href="#">{l}</a></li>
            ))}
          </ul>
        </div>
        <div>
          <div className="f-heading">Холбоо барих</div>
          <div className="f-contact-row"><i className="fas fa-phone" style={{ color:'var(--pink)', width:16 }} />(976) 9911-2233</div>
          <div className="f-contact-row"><i className="fas fa-envelope" style={{ color:'var(--pink)', width:16 }} />info@hatantsetseylash.mn</div>
          <div className="f-contact-row"><i className="fas fa-map-marker-alt" style={{ color:'var(--pink)', width:16 }} />Сүхбаатар дүүрэг, Улаанбаатар</div>
          <div style={{ marginTop:20 }}>
            <div className="f-heading">Мэдээллийн хуудас</div>
            <p style={{ color:'rgba(255,255,255,.5)', fontSize:13 }}>Тусгай санал, шинэчлэлт авахын тулд бүртгүүлэх</p>
            <div className="nl-row">
              <input className="nl-input" type="email" placeholder="Имэйл хаягаа оруулна уу" />
              <button className="btn-primary" style={{ padding:'10px 18px', fontSize:13 }}>Бүртгүүлэх</button>
            </div>
          </div>
        </div>
      </div>
      <div className="footer-bottom">© 2024 Hatantsetsey lash Beauty Salon. Бүх эрх хуулиар хамгаалагдсан. ❤️-р бүтээсэн</div>
    </footer>
  );
}
