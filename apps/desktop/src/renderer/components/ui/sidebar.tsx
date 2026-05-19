import { History, Library, PenLine, Settings } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import appIcon from '../../assets/app-icon.png';
import { shouldResetWritingNav } from '../../pages/writing-navigation';
import { useWritingStore } from '../../store/writing';

const navItems = [
  { to: '/', label: '写作', icon: PenLine },
  { to: '/knowledge', label: '知识库', icon: Library },
  { to: '/history', label: '历史', icon: History },
  { to: '/settings', label: '设置', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();

  const handleWritingClick = () => {
    const status = useWritingStore.getState().status;
    if (shouldResetWritingNav(status, location.pathname)) {
      useWritingStore.getState().reset({ clearForm: true });
    }
  };

  return (
    <aside className="flex h-screen w-20 shrink-0 flex-col items-center border-r border-white/10 bg-[#07111f] px-3 py-4 text-white shadow-2xl shadow-slate-950/20">
      <div className="mb-6 flex flex-col items-center gap-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
          <img src={appIcon} alt="极致写作" className="h-9 w-9 rounded-xl" />
        </div>
        <span className="text-[10px] font-semibold tracking-[0.16em] text-slate-400">JIZHI</span>
      </div>

      <nav className="flex flex-1 flex-col items-center gap-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={to === '/' ? handleWritingClick : undefined}
            className={({ isActive }) =>
              `group flex h-14 w-14 flex-col items-center justify-center rounded-2xl text-[11px] transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/30'
                  : 'text-slate-400 hover:bg-white/8 hover:text-white'
              }`
            }
          >
            <Icon className="h-5 w-5" />
            <span className="mt-1 leading-none">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-6 rounded-full border border-white/10 px-2 py-1 text-[10px] text-slate-500">
        v0.1
      </div>
    </aside>
  );
}
