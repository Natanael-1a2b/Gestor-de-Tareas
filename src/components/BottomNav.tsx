import { NavLink, useLocation } from 'react-router-dom';
import { LayoutGrid, Calendar, Target, BarChart3 } from 'lucide-react';

const TABS = [
  { to: '/', label: 'Tablero', icon: LayoutGrid, end: true },
  { to: '/calendario', label: 'Calendario', icon: Calendar },
  { to: '/habitos', label: 'Hábitos', icon: Target },
  { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
];

export function BottomNav() {
  const location = useLocation();
  
  const activeIndex = TABS.findIndex(tab => {
    if (tab.end) {
      return location.pathname === tab.to;
    }
    return location.pathname.startsWith(tab.to);
  });

  return (
    <nav 
      className="bottom-nav" 
      aria-label="Navegación principal móvil"
      style={{ '--active-index': activeIndex > -1 ? activeIndex : 0 } as React.CSSProperties}
    >
      <div className="bottom-nav-indicator" />
      {TABS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `bottom-nav-item ${isActive ? 'active' : ''}`
          }
          viewTransition
        >
          <Icon size={22} strokeWidth={2} />
          <span className="bottom-nav-label">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
