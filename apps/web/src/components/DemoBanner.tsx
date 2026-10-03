// Stałe, wyraźne oznaczenie symulacji (sekcja 6.10). Widoczne na każdym ekranie demo.
import { FlaskConical } from 'lucide-react';

export function DemoBanner({ visible = true }: { visible?: boolean }) {
  if (!visible) return null;
  return (
    <div className="demo-banner" role="note">
      <FlaskConical size={13} strokeWidth={2.4} aria-hidden />
      <strong>SYMULACJA</strong>
      <span>· dane fikcyjne · to nie jest narzędzie ratunkowe</span>
    </div>
  );
}
