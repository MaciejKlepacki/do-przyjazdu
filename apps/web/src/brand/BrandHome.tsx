import { ArrowDown, ArrowRight, ArrowUpRight, Check, ClipboardCheck, Pause, Play, Radio, Smartphone, WifiOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Logo } from '../components/ui';
import { SignalLandscape } from './SignalLandscape';

const scenes = [
  { label: 'Jest kontakt', title: 'Jedna informacja. Obie strony.', text: 'Świadek zapisuje obserwację. Dyspozytor widzi ją po otrzymaniu przez centralę.', phone: 'Zapisano na telefonie', central: 'Odebrano w centrali', icon: Radio },
  { label: 'Znika internet', title: 'Zasięg znika. Wpis zostaje.', text: 'Kolejna obserwacja czeka na telefonie. Centrala dostanie ją dopiero po powrocie połączenia.', phone: 'Zapisano na telefonie', central: 'Nowy wpis jeszcze nie dotarł', icon: WifiOff },
  { label: 'Historia dociera', title: 'Wraca połączenie. Wraca ciągłość.', text: 'Oczekujący wpis dociera do centrali. Ratownik znajdzie go we wspólnej historii zdarzenia.', phone: 'Odbiór potwierdzony', central: 'Wpis dostępny w raporcie', icon: ClipboardCheck },
];

function ContinuityPreview() {
  const [scene, setScene] = useState(0);
  const [playing, setPlaying] = useState(false);
  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { amount: .35 });
  useEffect(() => {
    if (!playing || !inView || reducedMotion) return;
    const timeout = window.setTimeout(() => {
      if (scene === scenes.length - 1) setPlaying(false);
      else setScene(previous => previous + 1);
    }, 5200);
    return () => window.clearTimeout(timeout);
  }, [scene, playing, inView, reducedMotion]);
  const current = scenes[scene]!;
  const Icon = current.icon;
  return <section ref={ref} className={`continuity-preview scene-${scene}${playing ? ' is-playing' : ''}`} aria-label="Ilustracja działania przepływu">
    <div className="preview-caption"><span>Jedna historia, mimo przerw.</span><span>Ilustracja przepływu</span></div>
    <div className="continuity-stage">
      <SignalLandscape paused={scene === 1} />
      <div className="preview-endpoint preview-witness">
        <span className="endpoint-role"><Smartphone size={15} /> Telefon świadka</span>
        <div className="preview-entry" key={`phone-${scene}`}>
          <span className="preview-entry-top">Obserwacja <span>{scene === 0 ? '01' : '02'}</span></span>
          <p>{scene === 0 ? 'Czekamy przy rozwidleniu szlaku.' : 'Widać światło na szlaku. Nadal czekamy przy rozwidleniu.'}</p>
          <span className={`preview-receipt ${scene === 1 ? 'is-waiting' : ''}`}><Check size={13} />{current.phone}</span>
        </div>
      </div>
      <div className="preview-junction" aria-hidden="true"><Icon size={25} strokeWidth={1.5} /></div>
      <div className="preview-endpoint preview-dispatcher">
        <span className="endpoint-role"><Radio size={15} /> Centrala i ratownik</span>
        <div className={`preview-entry ${scene === 1 ? 'entry-waiting' : ''}`} key={`central-${scene}`}>
          <span className="preview-entry-top">{scene === 2 ? 'Wspólna historia' : 'Ostatni odebrany wpis'}<span>{scene === 2 ? '02' : '01'}</span></span>
          <p>{scene === 2 ? 'Widać światło na szlaku. Nadal czekamy przy rozwidleniu.' : 'Czekamy przy rozwidleniu szlaku.'}</p>
          <span className={`preview-receipt ${scene === 1 ? 'is-waiting' : ''}`}><Icon size={13} />{current.central}</span>
        </div>
      </div>
      <div className="preview-stage-bottom"><span>Na miejscu zdarzenia</span><span>Do przyjazdu.</span><span>Wspólny obraz sytuacji</span></div>
    </div>
    <div className="preview-story" aria-live="polite">
      <div key={scene}><h2>{current.title}</h2><p>{current.text}</p></div>
      <Link to="/demo">Sprawdź w działającym demo <ArrowUpRight size={18} /></Link>
    </div>
    <div className="preview-controls">
      <div className="preview-chapters" aria-label="Etapy ilustracji">{scenes.map((item, index) => <button key={item.label} aria-pressed={index === scene} onClick={() => { setScene(index); setPlaying(false); }}><span>0{index + 1}</span>{item.label}<i aria-hidden="true" /></button>)}</div>
      {!reducedMotion && <button className="preview-play" aria-label={playing ? 'Zatrzymaj ilustrację' : 'Odtwórz ilustrację przepływu'} onClick={() => { if (!playing) setScene(0); setPlaying(previous => !previous); }}>{playing ? <Pause size={16} /> : <Play size={16} />}<span>{playing ? 'Pauza' : 'Odtwórz'}</span></button>}
    </div>
  </section>;
}

export function BrandHome() {
  return <div className="brand-page">
    <a href="#tresc" className="brand-skip">Przejdź do treści</a>
    <header className="brand-nav">
      <Link to="/" className="brand" aria-label="Do przyjazdu, strona główna"><Logo size={34} /><span className="brand-name">Do przyjazdu<span className="wordmark-stop">.</span></span></Link>
      <nav aria-label="Nawigacja"><a href="#jak-dziala">Idea</a><a href="#ciaglosc">Ciągłość</a><Link to="/dispatcher">Panel zespołu <ArrowUpRight size={14} /></Link></nav>
      <Link to="/demo" className="brand-button brand-button-small">Otwórz demo <ArrowUpRight size={15} /></Link>
    </header>
    <main id="tresc">
      <section className="brand-hero">
        <p className="brand-context">Od wezwania pomocy do przejęcia na miejscu.</p>
        <h1><span>Pomoc jest w drodze.</span><span className="brand-headline-rest">Historia zostaje.</span></h1>
        <p className="brand-lead">Polecenia, odpowiedzi i obserwacje. Wszystko, co dzieje się<br className="desktop-break" /> do przyjazdu ratowników, w jednej wspólnej historii.</p>
        <div className="brand-hero-actions"><Link to="/demo" className="brand-button">Zobacz działające demo <ArrowUpRight size={18} /></Link><a href="#jak-dziala" className="brand-text-link">Poznaj ideę <ArrowDown size={16} /></a></div>
        <p className="brand-demo-note">Prototyp HackYeah 2026 · Fikcyjne zdarzenie, działający przepływ.</p>
      </section>
      <ContinuityPreview />
      <section className="brand-problem" id="jak-dziala">
        <div className="brand-section-label"><span>01 / Czas pomiędzy</span><span>Wezwanie → Przyjazd</span></div>
        <div className="brand-problem-heading"><h2>Pomoc została wezwana.<br /><span>A co z tym,<br />co dzieje się potem?</span></h2><div><p>Świadek dostaje polecenia. Coś się zmienia. Pojawiają się nowe informacje. Gdy znika internet albo zdarzenie przejmuje kolejna osoba, łatwo stracić część tej historii.</p><p className="brand-problem-answer">Do przyjazdu łączy te momenty.</p><a className="brand-text-link" href="#perspektywy">Zobacz trzy perspektywy <ArrowDown size={16} /></a></div></div>
        <div className="brand-between" aria-hidden="true"><span>Wezwanie pomocy</span><div><i /><b>Tu działa Do przyjazdu.</b><i /></div><span>Przyjazd ratowników</span></div>
      </section>
      <section className="brand-perspectives" id="perspektywy">
        <div className="brand-section-label"><span>02 / Wspólny obraz</span><span>Trzy role. Jedno zdarzenie.</span></div>
        <div className="perspective-row"><span className="perspective-number">01</span><div className="perspective-title"><Smartphone size={23} strokeWidth={1.4} /><h3>Jestem na miejscu.</h3><span>Świadek</span></div><p>Otwierasz link bez zakładania konta. Widzisz zatwierdzone polecenie i zapisujesz odpowiedź. Także wtedy, gdy po pobraniu sesji tracisz internet.</p><span className="perspective-detail">Wiem, co robić.<ArrowUpRight size={19} /></span></div>
        <div className="perspective-row"><span className="perspective-number">02</span><div className="perspective-title"><Radio size={23} strokeWidth={1.4} /><h3>Prowadzę zdarzenie.</h3><span>Dyspozytor</span></div><p>Zatwierdzasz polecenia. Widzisz odpowiedzi, nowe obserwacje i zgłoszone trudności. Wiesz, które informacje dotarły do centrali.</p><span className="perspective-detail">Wiem, co się dzieje.<ArrowUpRight size={19} /></span></div>
        <div className="perspective-row"><span className="perspective-number">03</span><div className="perspective-title"><ClipboardCheck size={23} strokeWidth={1.4} /><h3>Przejmuję na miejscu.</h3><span>Ratownik</span></div><p>Otwierasz uporządkowany raport. Widzisz obserwacje, wykonane czynności i braki informacji. Historia dociera razem ze zdarzeniem.</p><span className="perspective-detail">Wiem, co było wcześniej.<ArrowUpRight size={19} /></span></div>
      </section>
      <section className="brand-offline" id="ciaglosc">
        <div className="brand-section-label"><span>03 / Ciągłość</span><WifiOff size={19} /></div>
        <div className="brand-offline-heading"><h2>Połączenie może się urwać.<br /><span>Historia nie musi.</span></h2><p>Telefon zachowuje pobrane instrukcje i zapisuje nowe wpisy. Gdy wraca internet, wysyła kolejkę i czeka na potwierdzenie odbioru.</p></div>
        <div className="brand-receipt"><div><span>Na telefonie</span><strong>14:32:08</strong><p>Zapisano obserwację</p></div><div className="receipt-gap"><span>Przerwa w połączeniu</span><div aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div><small>Wpis czeka lokalnie</small></div><div><span>W centrali</span><strong>14:32:41</strong><p><Check size={15} /> Potwierdzono odbiór</p></div></div>
        <div className="brand-offline-foot"><span>Przykładowe czasy jednego wpisu.</span><p>Podczas przerwy centrala nie otrzymuje aktualizacji, a świadek nie dostaje nowych poleceń. Zapis na telefonie i odbiór w centrali to dwa osobne momenty.</p></div>
      </section>
      <section className="brand-close"><div className="brand-close-symbol"><Logo size={56} /></div><p>Działający prototyp na fikcyjnym zdarzeniu.</p><h2>Zobacz to w działaniu.<br /><span>Telefon i centrala, na żywo.</span></h2><Link to="/demo" className="brand-button">Uruchom demo <ArrowUpRight size={18} /></Link><span>Zapisz obserwację, wyłącz zasięg i sprawdź, co trafi do ratownika.</span></section>
    </main>
    <footer className="brand-footer"><div><Link to="/" className="brand"><Logo size={26} /><span>Do przyjazdu.</span></Link><span>HackYeah 2026</span></div><p>Prototyp demonstracyjny. Nie wzywa pomocy ani nie zastępuje kontaktu ze służbami. Treść scenariusza wymaga zatwierdzenia przez lekarza z zespołu.</p><Link to="/dispatcher">Panel zespołu <ArrowRight size={15} /></Link></footer>
  </div>;
}
