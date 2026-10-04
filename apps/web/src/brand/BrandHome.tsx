import { ArrowDown, ArrowRight, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/ui';

const flow = [
  { number: '01', title: 'Świadek wie, co robić.', text: 'Link bez zakładania konta. Jedno zatwierdzone polecenie na ekranie. Prosta odpowiedź: wykonane, nie mogę, potrzebuję wyjaśnienia.' },
  { number: '02', title: 'Dyspozytor widzi, co się dzieje.', text: 'Obserwacje, odpowiedzi i zgłoszenia w jednej historii. Każde polecenie ma autora i wersję. Każdy wpis ma czas.' },
  { number: '03', title: 'Ratownik przejmuje całą historię.', text: 'Na miejscu dostaje ostatnie obserwacje, wykonane czynności i nierozwiązane trudności. Widzi również to, czego wciąż nie wiadomo.' },
];

export function BrandHome() {
  return (
    <div className="brand-page">
      <header className="brand-nav">
        <Link to="/" className="brand" aria-label="Do przyjazdu, strona główna">
          <Logo size={38} />
          <span className="brand-name">Do przyjazdu<span className="wordmark-stop">.</span>
          </span>
        </Link>
        <nav aria-label="Nawigacja">
          <a href="#jak-dziala">Jak to działa</a>
          <Link to="/dispatcher">Panel <ArrowUpRight size={16} />
          </Link>
        </nav>
      </header>
      <main>
        <section className="brand-hero">
          <div className="brand-hero-copy">
            <p className="brand-context">Od wezwania pomocy do przejęcia na miejscu.</p>
            <h1><span className="brand-headline-line">Pomoc jest w drodze.</span>{' '}
              <span className="brand-headline-line brand-headline-rest">Kontakt zostaje.</span></h1>
            <p className="brand-lead">Polecenia dyspozytora. Odpowiedzi świadka. Jedna historia, która dociera do ratownika.</p>
            <div className="brand-hero-actions">
              <Link to="/demo" className="btn btn-primary btn-lg">Zobacz działające demo <ArrowRight size={19} />
              </Link>
              <a href="#jak-dziala" className="brand-text-link">Poznaj przepływ <ArrowDown size={16} />
              </a>
            </div>
            <p className="brand-demo-note">Prototyp HackYeah 2026. Pokaz na fikcyjnym zdarzeniu.</p>
          </div>
          <div className="continuity-figure" role="img" aria-label="Świadek, dyspozytor i ratownik połączeni jedną historią. Podczas przerwy w internecie wpisy czekają na telefonie.">
            <div className="figure-top">
              <span>Jedno zdarzenie.</span>
              <span>Trzy perspektywy.</span>
            </div>
            <svg viewBox="0 0 430 410" fill="none" aria-hidden>
              <path d="M40 80h350M40 200h350M40 320h350" className="figure-guides" />
              <path className="figure-route" pathLength="1" d="M70 80h175a45 45 0 0 1 45 45v30a45 45 0 0 1-45 45H150a45 45 0 0 0-45 45v30a45 45 0 0 0 45 45h195" stroke="#f7f9fc" strokeWidth="6" strokeLinecap="round" />
              <path d="M170 200h54" stroke="#18243a" strokeWidth="12" />
              <path d="M170 200h54" stroke="#d5e8a1" strokeWidth="6" strokeDasharray="2 10" strokeLinecap="round" />
              <circle className="figure-point figure-point-witness" cx="70" cy="80" r="11" fill="#d5e8a1" stroke="#18243a" strokeWidth="5" />
              <circle className="figure-point figure-point-central" cx="290" cy="140" r="11" fill="#f7f9fc" stroke="#18243a" strokeWidth="5" />
              <circle className="figure-point figure-point-responder" cx="345" cy="320" r="11" fill="#d5e8a1" stroke="#18243a" strokeWidth="5" />
              <text x="62" y="47" className="figure-label">Świadek</text>
              <text x="315" y="145" className="figure-label">Centrala</text>
              <text x="285" y="358" className="figure-label">Ratownik</text>
              <text x="153" y="238" className="figure-note">Przerwa w internecie</text>
              <text x="153" y="259" className="figure-note">Wpisy czekają na telefonie.</text>
            </svg>
            <div className="figure-bottom">
              <span>Połączenie może się urwać.</span>
              <strong>Historia zostaje.</strong>
            </div>
          </div>
        </section>
        <section className="brand-flow" id="jak-dziala">
          <div className="brand-section-intro">
            <h2>Czas oczekiwania<br />też jest częścią akcji.</h2>
            <p>Pomoc została wezwana. Teraz trzeba wiedzieć, co zrobić, co już zrobiono i co zmieniło się po drodze.</p>
          </div>
          <div className="brand-flow-rows">{flow.map(item =>
            <article key={item.number}>
              <span className="flow-number">{item.number}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>)}</div>
        </section>
        <section className="brand-offline">
          <div>
            <span className="offline-line" aria-hidden />
            <h2>Bez internetu<br />nie tracisz zapisanych wpisów.</h2>
          </div>
          <div>
            <p>Po pobraniu sesji telefon zachowuje instrukcje i zapisuje odpowiedzi lokalnie. Gdy połączenie wraca, wysyła kolejkę i czeka na potwierdzenie serwera.</p>
            <p className="brand-offline-limit">Podczas przerwy centrala nie otrzymuje aktualizacji, a świadek nie dostaje nowych poleceń. Oba widoki pokazują tę granicę.</p>
          </div>
        </section>
        <section className="brand-close">
          <div>
            <h2>Sprawdź, jak historia<br />przechodzi z rąk do rąk.</h2>
            <p>Telefon świadka i centrala obok siebie. Rzeczywiste wpisy, rzeczywiste potwierdzenia.</p>
          </div>
          <Link to="/demo" className="btn btn-primary btn-lg">Otwórz demo <ArrowRight size={19} />
          </Link>
        </section>
      </main>
      <footer className="brand-footer">
        <span>Do przyjazdu.</span>
        <p>Symulacja. Prototyp nie wzywa pomocy ani nie zastępuje kontaktu ze służbami. Treść scenariusza wymaga zatwierdzenia przez lekarza z zespołu.</p>
        <Link to="/dispatcher">Panel zespołu <ArrowUpRight size={15} />
        </Link>
      </footer>
    </div>
  );
}
