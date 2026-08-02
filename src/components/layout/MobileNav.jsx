import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Scale,
  Utensils,
  Dumbbell,
  Settings,
} from 'lucide-react';

const mobileNavItems = [
  { to: '/', icon: LayoutDashboard, label: 'Home' },
  { to: '/weight', icon: Scale, label: 'Weight' },
  { to: '/food', icon: Utensils, label: 'Food' },
  { to: '/workouts', icon: Dumbbell, label: 'Train' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

/** Bottom tab navigation for mobile. */
export function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-surface/95 backdrop-blur-lg">
      <div className="flex items-center justify-around px-2 py-2">
        {mobileNavItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                isActive ? 'text-accent' : 'text-muted'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
