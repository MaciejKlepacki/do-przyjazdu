import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import { X } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export const spring = { type: 'spring', stiffness: 420, damping: 36 } as const;
export const softSpring = { type: 'spring', stiffness: 240, damping: 26 } as const;

export function haptic(pattern: number | number[] = 10) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* brak wsparcia */
  }
}

export function useRetained<T>(value: T | null | undefined): T | null | undefined {
  const ref = useRef(value);
  if (value !== null && value !== undefined) ref.current = value;
  return value ?? ref.current;
}

export function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  const d = n % 10;
  const t = n % 100;
  return d >= 2 && d <= 4 && (t < 12 || t > 14) ? few : many;
}

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className="logo">
      <rect width="64" height="64" rx="14" fill="#18243a" />
      <path d="M28 14v25a10 10 0 1 1-10-10h10" stroke="#f7f9fc" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M36 50V25a10 10 0 1 1 10 10H36" stroke="#d5e8a1" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function LiveDot({ tone = 'green', pulse = true }: { tone?: 'green' | 'red' | 'orange' | 'blue' | 'gray'; pulse?: boolean }) {
  return <span className={`live-dot is-${tone}${pulse ? ' pulse' : ''}`} aria-hidden />;
}

export function ProgressRing({ value, size = 44, stroke = 5, label }: { value: number; size?: number; stroke?: number; label?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  return (
    <span className="ring-wrap" style={{ width: size, height: size }}>
      <svg className="ring-svg" width={size} height={size}>
        <circle className="ring-track" cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} />
        <motion.circle
          className="ring-bar"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: c * (1 - v) }}
          transition={softSpring}
        />
      </svg>
      {label !== undefined && <span className="ring-label">{label}</span>}
    </span>
  );
}

const AVATAR_COLORS = ['#334f80', '#52677a', '#726348', '#3e7169', '#666a83'];

export function Avatar({ name, size = 34 }: { name: string; size?: number }) {
  const initials = name
    .replace(/\(.*?\)/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
  const hash = [...name].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const color = AVATAR_COLORS[hash % AVATAR_COLORS.length]!;
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.38, background: color }}>
      {initials}
    </span>
  );
}

export function CardHead({ icon, tone, title, sub, aside }: { icon: ReactNode; tone?: string; title: ReactNode; sub?: ReactNode; aside?: ReactNode }) {
  return (
    <div className="card-head">
      <span className={`card-icon${tone ? ` is-${tone}` : ''}`}>{icon}</span>
      <div>
        <h2>{title}</h2>
        {sub && <div className="card-sub">{sub}</div>}
      </div>
      {aside && <div className="card-head-aside">{aside}</div>}
    </div>
  );
}

export function EmptyState({ icon, title, children }: { icon: ReactNode; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="empty">
      <span className="empty-icon">{icon}</span>
      <h2>{title}</h2>
      {children && <p>{children}</p>}
    </div>
  );
}

export function DrawCheck({ size = 44, color = '#fff', delay = 0.08 }: { size?: number; color?: string; delay?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <motion.path
        d="M5 12.5l4.2 4.2L19 7"
        stroke={color}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.45, delay, ease: [0.2, 0.8, 0.2, 1] }}
      />
    </svg>
  );
}

export function Splash({ icon, tone, title, children }: { icon?: ReactNode; tone?: string; title?: ReactNode; children?: ReactNode }) {
  return (
    <div className="splash">
      <motion.div className="splash-inner" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={softSpring}>
        {icon ? (
          <span className={`splash-icon is-${tone ?? 'orange'}`}>{icon}</span>
        ) : (
          <span className="logo-pulse">
            <Logo size={64} />
          </span>
        )}
        {title && <h1>{title}</h1>}
        {children}
      </motion.div>
    </div>
  );
}

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  label: string;
  children: ReactNode;
}

export function Sheet({ open, onClose, title, label, children }: SheetProps) {
  const controls = useDragControls();
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="sheet-root">
          <motion.div className="sheet-backdrop" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.div
            className="sheet"
            role="dialog"
            aria-modal="true"
            aria-label={label}
            initial={{ y: '100%', opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0.6 }}
            transition={spring}
            drag="y"
            dragControls={controls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.7 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 650) onClose();
            }}
          >
            <div className="sheet-grabber" onPointerDown={(e) => controls.start(e)}>
              <span />
            </div>
            <div className="sheet-head">
              <h2>{title}</h2>
              <button className="icon-btn" onClick={onClose} aria-label="Zamknij">
                <X size={18} />
              </button>
            </div>
            <div className="sheet-content">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export type ToastTone = 'ok' | 'warn' | 'bad' | 'info';
interface ToastMsg {
  id: number;
  tone: ToastTone;
  title: string;
  detail?: string;
  icon?: ReactNode;
  duration?: number;
}

const ToastContext = createContext<(t: Omit<ToastMsg, 'id'>) => void>(() => undefined);

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastMsg | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const counter = useRef(0);

  const show = useCallback((t: Omit<ToastMsg, 'id'>) => {
    window.clearTimeout(timer.current);
    setToast({ ...t, id: ++counter.current });
    timer.current = window.setTimeout(() => setToast(null), t.duration ?? 2800);
  }, []);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const value = useMemo(() => show, [show]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="island-wrap" aria-live="polite" role="status">
          <AnimatePresence>
            {toast && (
              <motion.div
                key="island"
                layout
                className={`island island-${toast.tone}`}
                initial={{ opacity: 0, scale: 0.5, y: -18 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.6, y: -14 }}
                transition={spring}
                onClick={() => setToast(null)}
              >
                <motion.span key={`i${toast.id}`} className="island-icon" initial={{ scale: 0.4, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={spring}>
                  {toast.icon}
                </motion.span>
                <motion.span key={`t${toast.id}`} className="island-text" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                  <strong>{toast.title}</strong>
                  {toast.detail && <span>{toast.detail}</span>}
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}
