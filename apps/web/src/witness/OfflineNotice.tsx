// Granica z sekcji 4: bez internetu nie przyjdą nowe polecenia ani nie wyjdą aktualizacje.
// Pokazujemy, kiedy treść została ostatnio pobrana.
import { StalenessLabel } from '../components/StalenessLabel';

export function OfflineNotice({ fetchedAt, onSms }: { fetchedAt: string; onSms: (() => void) | null }) {
  return (
    <div className="notice notice-offline">
      <p>
        <strong>Brak internetu.</strong> Nie dostaniesz nowych poleceń ani informacji o ich wycofaniu. Twoje odpowiedzi zapisują się na
        telefonie i zostaną wysłane po powrocie połączenia.
      </p>
      <p>
        <StalenessLabel prefix="Instrukcje pobrano" at={fetchedAt} staleAfterSeconds={60} />
      </p>
      <p>Jeśli możesz dzwonić — rozmawiaj z prowadzącym. Ta strona nie wzywa pomocy i nie przekazuje lokalizacji.</p>
      {onSms && (
        <button className="btn btn-secondary" onClick={onSms}>
          Wyślij ostatnią aktualizację SMS-em
        </button>
      )}
    </div>
  );
}
