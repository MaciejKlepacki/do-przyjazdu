// Granica z sekcji 4: bez internetu nie przyjdą nowe polecenia ani nie wyjdą aktualizacje.
// Pokazujemy, kiedy treść została ostatnio pobrana.
import { MessageSquare, WifiOff } from 'lucide-react';
import { StalenessLabel } from '../components/StalenessLabel';

export function OfflineNotice({ fetchedAt, onSms }: { fetchedAt: string; onSms: (() => void) | null }) {
  return (
    <div className="callout callout-dark">
      <WifiOff size={20} />
      <div className="stack-sm">
        <strong>Brak internetu</strong>
        <p className="small" style={{ opacity: 0.85 }}>
          Nie dostaniesz nowych poleceń ani informacji o ich wycofaniu. Odpowiedzi zapisują się na telefonie i wyślą się po powrocie połączenia.
        </p>
        <p className="small" style={{ color: '#ffd28a' }}>
          <StalenessLabel prefix="Instrukcje pobrano" at={fetchedAt} staleAfterSeconds={60} />
        </p>
        <p className="xsmall" style={{ opacity: 0.7 }}>
          Jeśli możesz dzwonić - rozmawiaj z prowadzącym. Ta strona nie wzywa pomocy i nie przekazuje lokalizacji.
        </p>
        {onSms && (
          <div>
            <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.14)', color: '#fff' }} onClick={onSms}>
              <MessageSquare size={15} /> Wyślij ostatnią aktualizację SMS-em
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
