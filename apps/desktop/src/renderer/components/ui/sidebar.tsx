import { History, Library, PenLine, Settings } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
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
    <aside className="w-16 h-screen bg-slate-900 flex flex-col items-center py-4 gap-1">
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={to === '/' ? handleWritingClick : undefined}
          className={({ isActive }) =>
            `w-12 h-12 flex flex-col items-center justify-center rounded-lg transition-colors ${
              isActive
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`
          }
        >
          <Icon className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">{label}</span>
        </NavLink>
      ))}
    </aside>
  );
}
