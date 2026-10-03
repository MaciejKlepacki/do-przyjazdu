// Stałe, wyraźne oznaczenie symulacji (sekcja 6.10). Widoczne na każdym ekranie demo.
export function DemoBanner({ visible = true }: { visible?: boolean }) {
  if (!visible) return null;
  return (
    <div className="demo-banner" role="note">
      SYMULACJA · dane fikcyjne · to nie jest narzędzie ratunkowe
    </div>
  );
}
