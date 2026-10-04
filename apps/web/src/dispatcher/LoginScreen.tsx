import type { MeResponse, StaffUser } from '@do-przyjazdu/shared';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, Clock3, Eye, EyeOff, KeyRound, LoaderCircle, Route, WifiOff } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { DemoBanner } from '../components/DemoBanner';
import { Avatar, Logo, softSpring, spring } from '../components/ui';
import { api, errorMessage } from '../lib/api';
import { ROLE_LABEL } from '../lib/labels';

export function LoginScreen({ onLogin }: { onLogin: (me: MeResponse) => void }) {
  const [accounts, setAccounts] = useState<StaffUser[]>([]);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<StaffUser[]>('/auth/accounts')
      .then((list) => {
        setAccounts(list);
        setUserId((prev) => prev || list[0]?.id || '');
      })
      .catch((err) => setError(errorMessage(err)));
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      onLogin(await api<MeResponse>('/auth/login', { method: 'POST', body: { userId, password } }));
    } catch (err) {
      setError(errorMessage(err));
      setShake((n) => n + 1);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <DemoBanner />
      <div className="login-shell">
        <aside className="login-visual">
          <svg className="scene" viewBox="0 0 800 1000" preserveAspectRatio="xMidYMid slice" aria-hidden>
            <rect width="800" height="1000" fill="#18243a" />
            <path d="M0 190h800M0 490h800M80 0v1000M740 0v1000" fill="none" stroke="#34435a" strokeWidth="1" />
            <path d="M80 190h330c200 0 90 300 250 300h100" fill="none" stroke="#d5e8a1" strokeWidth="6" />
            <circle cx="80" cy="190" r="12" fill="#d5e8a1" />
            <circle cx="740" cy="490" r="12" fill="#f7f9fc" />
          </svg>
          <motion.div className="login-copy" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...softSpring, delay: 0.1 }}>
            <Logo size={58} />
            <h1>Do przyjazdu</h1>
            <p>Polecenia dyspozytora. Odpowiedzi świadka. Jedna historia, która dociera do ratownika.</p>
            <div className="tags">
              <span>
                <Route size={14} /> Jedna oś czasu
              </span>
              <span>
                <WifiOff size={14} /> Lokalny zapis wpisów
              </span>
              <span>
                <Clock3 size={14} /> Historia dla ratownika
              </span>
            </div>
          </motion.div>
        </aside>

        <main className="login-main">
          <motion.form
            className="login-card"
            onSubmit={submit}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={softSpring}
          >
            <div className="stack-sm">
              <h2>Zaloguj się</h2>
              <p className="muted">Panel dyspozytora i widok przekazania dla ratownika.</p>
            </div>

            <div className="account-list" role="radiogroup" aria-label="Konto">
              {accounts.map((a, i) => {
                const on = a.id === userId;
                return (
                  <motion.button
                    key={a.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    className="account"
                    onClick={() => setUserId(a.id)}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...softSpring, delay: 0.1 + i * 0.06 }}
                  >
                    <Avatar name={a.displayName} size={40} />
                    <span className="account-meta">
                      <strong>{a.displayName}</strong>
                      <span>{ROLE_LABEL[a.role]}</span>
                    </span>
                    <AnimatePresence>
                      {on && (
                        <motion.span className="account-check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={spring}>
                          <Check size={14} strokeWidth={3} />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>

            <label className="field">
              <span>Hasło</span>
              <motion.div className="input-icon" key={shake} animate={shake ? { x: [0, -10, 9, -6, 4, 0] } : { x: 0 }} transition={{ duration: 0.4 }}>
                <KeyRound size={18} />
                <input
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  placeholder="••••••••"
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" className="icon-btn" onClick={() => setShow((s) => !s)} aria-label={show ? 'Ukryj hasło' : 'Pokaż hasło'}>
                  {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </motion.div>
            </label>

            <AnimatePresence>
              {error && (
                <motion.p className="error-text" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <button className="btn btn-lg btn-primary btn-block" disabled={busy || !userId || !password}>
              {busy ? <LoaderCircle size={18} className="spin" /> : null}
              Zaloguj <ArrowRight size={18} />
            </button>
          </motion.form>
        </main>
      </div>
    </div>
  );
}
