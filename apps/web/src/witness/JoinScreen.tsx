// Ekran wejścia: oznaczenie trybu demo, identyfikator zdarzenia, potwierdzenie dołączenia.
// Bez zakładania konta.
import type { WitnessSessionResponse } from '@do-przyjazdu/shared';
import { motion } from 'framer-motion';
import { ArrowRight, ListChecks, PhoneCall, WifiOff } from 'lucide-react';
import { haptic, Logo, softSpring } from '../components/ui';

const FEATURES = [
  { icon: <ListChecks size={20} />, tone: 'blue', title: 'Polecenia od prowadzącego', text: 'Widzisz tylko instrukcje zatwierdzone przez dyspozytora — po jednej, dużym tekstem.' },
  { icon: <WifiOff size={20} />, tone: 'green', title: 'Działa bez zasięgu', text: 'Odpowiedzi zapisują się na telefonie i wysyłają, gdy wróci internet.' },
  { icon: <PhoneCall size={20} />, tone: 'red', title: 'Nie zastępuje rozmowy', text: 'Jeśli możesz dzwonić, rozmawiaj z prowadzącym. Ta strona nie wzywa pomocy.' },
];

export function JoinScreen({ session, onJoin }: { session: WitnessSessionResponse; onJoin: () => void }) {
  const id = session.incident.id;
  return (
    <div className="join">
      <div className="join-hero">
        <motion.span className="logo-pulse" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={softSpring}>
          <Logo size={72} />
        </motion.span>
        <motion.p className="eyebrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          Dołączasz do zdarzenia
        </motion.p>
        <div className="id-tiles" aria-label={id}>
          {[...id].map((ch, i) => (
            <motion.span
              key={i}
              aria-hidden
              className={ch === '-' ? 'id-dash' : 'id-tile'}
              initial={{ y: 16, opacity: 0, rotateX: -60 }}
              animate={{ y: 0, opacity: 1, rotateX: 0 }}
              transition={{ ...softSpring, delay: 0.2 + i * 0.05 }}
            >
              {ch}
            </motion.span>
          ))}
        </div>
        <motion.p className="join-hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          Sprawdź, czy prowadzący podał Ci ten sam identyfikator zdarzenia.
        </motion.p>
      </div>

      <motion.div className="card join-desc" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ ...softSpring, delay: 0.45 }}>
        <span className="eyebrow">Opis zdarzenia</span>
        <p>{session.incident.description}</p>
      </motion.div>

      <motion.ul className="card feature-list" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ ...softSpring, delay: 0.55 }}>
        {FEATURES.map((f) => (
          <li key={f.title}>
            <span className={`fi fi-${f.tone}`}>{f.icon}</span>
            <div>
              <strong>{f.title}</strong>
              <p>{f.text}</p>
            </div>
          </li>
        ))}
      </motion.ul>

      <motion.div className="join-cta" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...softSpring, delay: 0.7 }}>
        <motion.button
          className="btn btn-xl btn-primary btn-block"
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            haptic(15);
            onJoin();
          }}
        >
          Tak, dołączam do {id} <ArrowRight size={20} />
        </motion.button>
      </motion.div>
    </div>
  );
}
