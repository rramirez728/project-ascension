import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Scale,
  Ruler,
  Utensils,
  Dumbbell,
  CheckSquare,
  Camera,
  Settings,
  TrendingUp,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/weight', icon: Scale, label: 'Weight' },
  { to: '/measurements', icon: Ruler, label: 'Measurements' },
  { to: '/food', icon: Utensils, label: 'Food Log' },
  { to: '/workouts', icon: Dumbbell, label: 'Workouts' },
  { to: '/habits', icon: CheckSquare, label: 'Habits' },
  { to: '/photos', icon: Camera, label: 'Photos' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

/** Desktop sidebar navigation. */
export function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-border bg-surface/50 h-screen sticky top-0">
      <div className="flex items-center gap-3 px-6 py-6 border-b border-border">
        <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
          <TrendingUp size={18} className="text-white" />
        </div>
        <div>
          <h1 className="font-semibold text-sm leading-tight">Project Ascension</h1>
          <p className="text-xs text-muted">Fitness Dashboard</p>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent/10 text-accent'
                  : 'text-muted hover:text-foreground hover:bg-border/20'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
