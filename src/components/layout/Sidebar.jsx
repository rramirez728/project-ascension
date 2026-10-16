import { NavLink } from 'react-router-dom';
import { LogIn, TrendingUp } from 'lucide-react';
import { NAV_GROUPS } from './navItems.js';
import { useAuth } from '../../contexts/AuthContext.jsx';

const toneClass = {
  nutrition: 'text-nutrition',
  training: 'text-training',
};

/** Desktop sidebar navigation. */
export function Sidebar() {
  const { user, isCloudEnabled, showSignIn } = useAuth();

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
      <nav className="flex-1 p-4 space-y-5 overflow-y-auto scrollbar-thin">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className={`px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider ${toneClass[group.tone] || 'text-muted'}`}>
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map(({ to, icon: Icon, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? group.tone === 'training'
                          ? 'bg-training/10 text-training'
                          : group.tone === 'nutrition'
                            ? 'bg-nutrition/10 text-nutrition'
                            : 'bg-accent/10 text-accent'
                        : 'text-muted hover:text-foreground hover:bg-border/20'
                    }`
                  }
                >
                  <Icon size={18} />
                  {label}
                </NavLink>
              ))}
            </div>
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
    </aside>
  );
}
