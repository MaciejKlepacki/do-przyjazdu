// Ekran wejścia: oznaczenie trybu demo, identyfikator zdarzenia, potwierdzenie dołączenia.
// Bez zakładania konta.
import type { WitnessSessionResponse } from '@do-przyjazdu/shared';

export function JoinScreen({ session, onJoin }: { session: WitnessSessionResponse; onJoin: () => void }) {
  return (
    <div className="witness-join">
      <p className="muted">Dołączasz do zdarzenia</p>
      <h1 className="incident-id">{session.incident.id}</h1>
      <p className="lead">{session.incident.description}</p>
      <div className="notice">
        <p>Ta strona pokazuje polecenia zatwierdzone przez prowadzącego i przekazuje mu Twoje odpowiedzi.</p>
        <p>
          <strong>Nie zastępuje rozmowy.</strong> Jeśli możesz dzwonić, rozmawiaj z prowadzącym. Strona nie wzywa pomocy.
        </p>
      </div>
      <p>Sprawdź, czy prowadzący podał Ci ten sam identyfikator zdarzenia.</p>
      <button className="btn btn-primary btn-large" onClick={onJoin}>
        Tak, dołączam do {session.incident.id}
      </button>
    </div>
  );
}
