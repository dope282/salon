'use client';
export default function Sidebar({ view, onSwitch, adminEmail, onLogout, isOpen, onClose }) {
  const nav = [
    { id:'dashboard',    icon:'fas fa-th-large',       label:'Хяналтын самбар' },
    { id:'appointments', icon:'fas fa-calendar-check',  label:'Захиалгууд' },
    { id:'products',     icon:'fas fa-box-open',        label:'Бүтээгдэхүүн' },
    { id:'customers',    icon:'fas fa-users',           label:'Үйлчлүүлэгчид' },
    { id:'artists',      icon:'fas fa-cut',             label:'Артистууд' },
    { id:'packages',     icon:'fas fa-gift',            label:'Багц үйлчилгээ' },
  ];
  const mgmt = [
    { id:'services',  icon:'fas fa-star',         label:'Үйлчилгээнүүд' },
    { id:'trainings', icon:'fas fa-graduation-cap', label:'Сургалтууд' },
    { id:'payments',  icon:'fas fa-credit-card',   label:'Төлбөрүүд' },
    { id:'reports',   icon:'fas fa-chart-bar',     label:'Тайлан' },
    { id:'settings',  icon:'fas fa-cog',           label:'Тохиргоо' },
  ];

  const Item = ({ item }) => (
    <li className="mb-0.5">
      <button
        onClick={() => onSwitch(item.id)}
        className={`flex items-center gap-[11px] px-3.5 py-[11px] rounded-2xl w-full text-sm font-medium transition-all cursor-pointer border-none text-left ${view === item.id ? 'bg-gold-light text-gold-dark border border-gold/20' : 'bg-none text-gray-400 hover:bg-gold-light/60 hover:text-gold-dark border border-transparent'}`}>
        <i className={`${item.icon} w-[18px] text-center text-[15px]`} /> {item.label}
      </button>
    </li>
  );

  return (
    <aside className={`admin-sidebar flex flex-col bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto${isOpen ? ' open' : ''}`} id="adminSidebar">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-gray-200 flex items-center gap-3">
        <div className="w-[42px] h-[42px] rounded-lg bg-gradient-to-br from-pink to-pink-dark flex items-center justify-center text-xl text-white flex-shrink-0">
          💇‍♀️
        </div>
        <div className="flex-1">
          <div className="font-display text-base font-bold text-gold leading-[1.1]">Hatantsetsey lash</div>
          <div className="text-[9px] tracking-[2px] text-gray-500 uppercase">Админ панель</div>
        </div>
        <button onClick={onClose}
          className="hidden ml-auto w-8 h-8 flex-shrink-0 rounded-full border-none bg-gray-100 cursor-pointer text-sm text-gray-500 items-center justify-center transition-all hover:bg-pink-light hover:text-pink max-[900px]:flex">
          ✕
        </button>
      </div>

      <div className="text-[10px] font-bold uppercase tracking-[1.5px] text-gray-300 px-2.5 py-3 pt-3">Үндсэн цэс</div>
      <ul className="list-none px-2.5">{nav.map(item => <Item key={item.id} item={item} />)}</ul>

      <div className="text-[10px] font-bold uppercase tracking-[1.5px] text-gray-300 px-2.5 py-3">Удирдлага</div>
      <ul className="list-none px-2.5">{mgmt.map(item => <Item key={item.id} item={item} />)}</ul>

      <div className="text-[10px] font-bold uppercase tracking-[1.5px] text-gray-300 px-2.5 py-3">Систем</div>
      <ul className="list-none px-2.5">
        <li className="mb-0.5">
          <a href="/" className="flex items-center gap-[11px] px-3.5 py-[11px] rounded-2xl no-underline text-gray-500 text-sm font-medium hover:bg-pink-light hover:text-pink transition-all">
            <i className="fas fa-home w-[18px] text-center text-[15px]" /> Гол хуудас
          </a>
        </li>
        <li className="mb-0.5">
          <button onClick={onLogout}
            className="flex items-center gap-[11px] px-3.5 py-[11px] rounded-2xl w-full border-none bg-none text-salon-red text-sm font-medium cursor-pointer transition-all hover:bg-[#FFF5F5] hover:text-[#C53030]">
            <i className="fas fa-sign-out-alt w-[18px] text-center text-[15px]" /> Гарах
          </button>
        </li>
      </ul>

      {/* User */}
      <div className="px-5 py-4 border-t border-gray-200 flex items-center gap-3 mt-auto">
        <div className="w-[38px] h-[38px] rounded-full bg-gradient-to-br from-pink to-pink-dark flex items-center justify-center text-white text-[15px] font-bold flex-shrink-0">
          {adminEmail?.[0]?.toUpperCase() || 'А'}
        </div>
        <div>
          <div className="text-sm font-semibold leading-[1.2]">{adminEmail?.split('@')[0] || 'Админ'}</div>
          <div className="text-[11px] text-gray-500">Системийн зохицуулагч</div>
        </div>
      </div>
    </aside>
  );
}
