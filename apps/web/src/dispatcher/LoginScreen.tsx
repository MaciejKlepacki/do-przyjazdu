// Logowanie do panelu. Sam adres panelu nie daje uprawnień.
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
          <MountainScene />
          <motion.div className="login-copy" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...softSpring, delay: 0.1 }}>
            <Logo size={58} />
            <h1>Do przyjazdu</h1>
            <p>Instrukcje dyspozytora, odpowiedzi świadka i jedna uporządkowana historia zdarzenia — od zgłoszenia do przyjazdu ratowników.</p>
            <div className="tags">
              <span>
                <Route size={14} /> Jedna oś czasu
              </span>
              <span>
                <WifiOff size={14} /> Działa offline
              </span>
              <span>
                <Clock3 size={14} /> Przekazanie w minutę
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

/** Ilustracja: góry o zmierzchu i trasa dostawy do miejsca zdarzenia. */
function MountainScene() {
  const route = 'M690 250 C 600 300, 500 380, 430 585';
  return (
    <svg className="scene" viewBox="0 0 800 1000" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#081028" />
          <stop offset="0.45" stopColor="#1b336b" />
          <stop offset="0.72" stopColor="#5a64a8" />
          <stop offset="0.9" stopColor="#e98f7c" />
        </linearGradient>
        <radialGradient id="glow" cx="0.72" cy="0.62" r="0.45">
          <stop offset="0" stopColor="#ffb38a" stopOpacity="0.7" />
          <stop offset="1" stopColor="#ffb38a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.45" stopColor="#050a19" stopOpacity="0" />
          <stop offset="1" stopColor="#050a19" stopOpacity="0.92" />
        </linearGradient>
      </defs>
      <rect width="800" height="1000" fill="url(#sky)" />
      <rect width="800" height="1000" fill="url(#glow)" />
      {[
        [80, 90, 1.4],
        [190, 160, 1],
        [310, 70, 1.6],
        [420, 140, 1],
        [560, 60, 1.3],
        [640, 170, 0.9],
        [740, 110, 1.5],
        [120, 250, 0.9],
        [500, 230, 1.1],
        [250, 310, 0.8],
      ].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity="0.7">
          <animate attributeName="opacity" values="0.25;0.9;0.25" dur={`${3 + (i % 4)}s`} repeatCount="indefinite" begin={`${i * 0.4}s`} />
        </circle>
      ))}
      <path d="M0 650 L90 575 L170 610 L260 505 L340 575 L430 470 L520 560 L610 500 L700 585 L800 525 L800 1000 L0 1000Z" fill="#6c76b4" opacity="0.55" />
      <path d="M0 735 L120 615 L205 670 L330 525 L425 630 L505 585 L605 690 L705 610 L800 665 L800 1000 L0 1000Z" fill="#2c3a72" />
      <path d="M330 525 L298 563 L317 558 L331 573 L346 556 L364 566 Z" fill="#fff" opacity="0.92" />
      <path d="M120 615 L97 638 L112 636 L122 646 L134 634 Z" fill="#fff" opacity="0.8" />
      <path d="M0 830 L140 712 L262 798 L385 698 L520 808 L645 728 L800 806 L800 1000 L0 1000Z" fill="#141c40" />
      <path d={route} fill="none" stroke="#fff" strokeOpacity="0.75" strokeWidth="2.2" strokeDasharray="7 9" strokeLinecap="round">
        <animate attributeName="stroke-dashoffset" from="0" to="-64" dur="2.4s" repeatCount="indefinite" />
      </path>
      <circle cx="430" cy="585" r="7" fill="#ff453a" />
      <circle cx="430" cy="585" r="7" fill="none" stroke="#ff453a" strokeWidth="2">
        <animate attributeName="r" values="7;26" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.9;0" dur="2s" repeatCount="indefinite" />
      </circle>
      <g>
        <circle r="6" fill="#fff" />
        <circle r="13" fill="#fff" opacity="0.22" />
        <animateMotion dur="6s" repeatCount="indefinite" path={route} keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines="0.4 0 0.2 1" />
      </g>
      <rect width="800" height="1000" fill="url(#shade)" />
    </svg>
  );
}
