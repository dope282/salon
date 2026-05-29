'use client';
export default function Sidebar({ view, onSwitch, adminEmail, onLogout, isOpen, onClose }) {
  const nav = [
    { id:'dashboard',     icon:'fas fa-th-large',       label:'Хяналтын самбар' },
    { id:'appointments',  icon:'fas fa-calendar-check', label:'Захиалгууд' },
    { id:'products',      icon:'fas fa-box-open',       label:'Бүтээгдэхүүн' },
    { id:'customers',     icon:'fas fa-users',          label:'Үйлчлүүлэгчид' },
    { id:'artists',       icon:'fas fa-cut',            label:'Уран бүтээлчид' },
  ];
  const mgmt = [
    { id:'services',  icon:'fas fa-star',       label:'Үйлчилгээнүүд' },
    { id:'payments',  icon:'fas fa-credit-card', label:'Төлбөрүүд' },
    { id:'reports',   icon:'fas fa-chart-bar',   label:'Тайлан' },
    { id:'settings',  icon:'fas fa-cog',         label:'Тохиргоо' },
  ];

  const Item = ({ item }) => (
    <li>
      <button className={view === item.id ? 'active' : ''} onClick={() => onSwitch(item.id)}>
        <i className={item.icon} /> {item.label}
      </button>
    </li>
  );

  return (
    <aside className={`sidebar${isOpen ? ' open' : ''}`} id="adminSidebar">
      <div className="sb-logo">
        <div className="sb-logo-icon">💇‍♀️</div>
        <div>
          <div className="sb-logo-text">Hatantsetsey lash</div>
          <div className="sb-logo-sub">Админ панель</div>
        </div>
        <button className="sb-close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="sb-section">Үндсэн цэс</div>
      <ul className="sb-nav">{nav.map(item => <Item key={item.id} item={item} />)}</ul>

      <div className="sb-section">Удирдлага</div>
      <ul className="sb-nav">{mgmt.map(item => <Item key={item.id} item={item} />)}</ul>

      <div className="sb-section">Систем</div>
      <ul className="sb-nav">
        <li><a href="/" style={{ display:'flex', alignItems:'center', gap:11, padding:'11px 14px', borderRadius:14, textDecoration:'none', color:'var(--gray-500)', fontSize:14, fontWeight:500 }}>
          <i className="fas fa-home" /> Гол хуудас
        </a></li>
        <li className="sb-logout">
          <button onClick={onLogout}><i className="fas fa-sign-out-alt" /> Гарах</button>
        </li>
      </ul>

      <div className="sb-user">
        <div className="sb-avatar">{adminEmail?.[0]?.toUpperCase() || 'А'}</div>
        <div>
          <div className="sb-user-name">{adminEmail?.split('@')[0] || 'Админ'}</div>
          <div className="sb-user-role">Системийн зохицуулагч</div>
        </div>
      </div>
    </aside>
  );
}
