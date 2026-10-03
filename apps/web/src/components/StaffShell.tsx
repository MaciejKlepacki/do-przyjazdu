import { LogOut } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../dispatcher/auth';
import { ROLE_LABEL } from '../lib/labels';
import { useNow } from '../lib/polling';
import { DemoBanner } from './DemoBanner';
import { Avatar, LiveDot, Logo } from './ui';

function Clock() {
  const now = useNow(1000);
  return (
    <span className="clock" title="Czas lokalny">
      <LiveDot tone="green" />
      {new Date(now).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
}

export function StaffShell({ crumbs, demo, children }: { crumbs?: ReactNode; demo?: boolean; children: ReactNode }) {
  const { me, logout } = useAuth();
  return (
    <div className="staff">
      <DemoBanner visible={me.demoMode || Boolean(demo)} />
      <header className="nav">
        <div className="nav-inner">
          <Link to="/dispatcher" className="brand" aria-label="Do przyjazdu, panel zespołu">
            <Logo size={30} />
            <span className="brand-name">Do przyjazdu</span>
            <span className="brand-sub">Centrum</span>
          </Link>
          {crumbs && <nav className="crumbs" aria-label="Ścieżka">{crumbs}</nav>}
          <div className="nav-right">
            {me.demoMode && me.user.role === 'dispatcher' && <Link to="/demo" className="btn btn-sm btn-outline">Pokaż demo</Link>}
            <Clock />
            <div className="user-chip">
              <Avatar name={me.user.displayName} size={30} />
              <div className="user-chip-meta">
                <strong>{me.user.displayName}</strong>
                <span>{ROLE_LABEL[me.user.role]}</span>
              </div>
              <button className="icon-btn" onClick={() => void logout()} title="Wyloguj" aria-label="Wyloguj">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="staff-main">{children}</main>
    </div>
  );
}
