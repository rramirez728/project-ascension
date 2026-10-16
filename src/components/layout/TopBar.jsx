import { LogIn, Menu } from 'lucide-react';
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { NAV_GROUPS } from './navItems.js';
import { useAuth } from '../../contexts/AuthContext.jsx';

/** Mobile top bar with slide-out menu. */
export function TopBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isCloudEnabled, showSignIn } = useAuth();

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
          <div className="relative w-72 h-full bg-surface border-r border-border overflow-y-auto">
            <nav className="p-4 space-y-4 mt-16">
              {NAV_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted">{group.label}</p>
                  {group.items.map(({ to, label, end }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end={end}
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
                </div>
              ))}
            </nav>
            {isCloudEnabled && !user && (
              <div className="p-4 border-t border-border">
                <button
                  type="button"
                  onClick={showSignIn}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent text-white px-3 py-2.5 text-sm font-medium"
                >
                  <LogIn size={16} />
                  Sign in
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
