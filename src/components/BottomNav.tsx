import { NavLink } from 'react-router-dom';
import { LayoutGrid, Calendar, Target, BarChart3 } from 'lucide-react';

const TABS = [
  { to: '/', label: 'Tablero', icon: LayoutGrid, end: true },
  { to: '/calendario', label: 'Calendario', icon: Calendar },
  { to: '/habitos', label: 'Hábitos', icon: Target },
  { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
];

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Navegación principal móvil">
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
