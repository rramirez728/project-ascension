import { Menu } from 'lucide-react';
import { useState } from 'react';
import { NavLink } from 'react-router-dom';

/** Mobile top bar with slide-out menu. */
export function TopBar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-border bg-surface/95 backdrop-blur-lg">
        <div>
          <h1 className="font-semibold text-sm">Project Ascension</h1>
          <p className="text-xs text-muted">Fitness Dashboard</p>
        </div>
        <button
          onClick={() => setMenuOpen(true)}
          className="p-2 rounded-xl hover:bg-border/20 text-muted"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      </header>

      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMenuOpen(false)} />
          <div className="relative w-64 h-full bg-surface border-r border-border overflow-y-auto">
            <nav className="p-4 space-y-1 mt-16">
              {[
                ['/', 'Dashboard'],
                ['/weight', 'Weight'],
                ['/measurements', 'Measurements'],
                ['/food', 'Food Log'],
                ['/workouts', 'Workouts'],
                ['/habits', 'Habits'],
                ['/photos', 'Photos'],
                ['/settings', 'Settings'],
              ].map(([to, label]) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `block px-3 py-2.5 rounded-xl text-sm font-medium ${
                      isActive ? 'bg-accent/10 text-accent' : 'text-muted hover:bg-border/20'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
