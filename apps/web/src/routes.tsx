// /w/:token            telefon świadka (dołączenie przez link, bez konta)
// /dispatcher          panel dyspozytora (wymaga uwierzytelnienia)
// /dispatcher/:id      prowadzenie zdarzenia
// /handover/:id        widok przekazania dla ratownika
import { createBrowserRouter, Link, Navigate } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Splash } from './components/ui';
import { RequireStaff } from './dispatcher/auth';
import { DispatcherHome } from './dispatcher/DispatcherHome';
import { IncidentPanel } from './dispatcher/IncidentPanel';
import { HandoverView } from './handover/HandoverView';
import { WitnessApp } from './witness/WitnessApp';

function NotFound() {
  return (
    <Splash icon={<Compass size={34} />} tone="orange" title="Nie ma takiej strony">
      <p>Świadek otwiera link otrzymany od prowadzącego.</p>
      <Link to="/dispatcher" className="btn btn-primary">
        Przejdź do panelu
      </Link>
    </Splash>
  );
}

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/dispatcher" replace /> },
  { path: '/w/:token', element: <WitnessApp /> },
  { path: '/dispatcher', element: <RequireStaff><DispatcherHome /></RequireStaff> },
  { path: '/dispatcher/:id', element: <RequireStaff><IncidentPanel /></RequireStaff> },
  { path: '/handover/:id', element: <RequireStaff><HandoverView /></RequireStaff> },
  { path: '*', element: <NotFound /> },
]);
