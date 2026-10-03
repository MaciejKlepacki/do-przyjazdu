// /w/:token            telefon świadka (dołączenie przez link, bez konta)
// /dispatcher          panel dyspozytora (wymaga uwierzytelnienia)
// /dispatcher/:id      prowadzenie zdarzenia
// /handover/:id        widok przekazania dla ratownika
import { createBrowserRouter, Link, Navigate } from 'react-router-dom';
import { RequireStaff } from './dispatcher/auth';
import { DispatcherHome } from './dispatcher/DispatcherHome';
import { IncidentPanel } from './dispatcher/IncidentPanel';
import { HandoverView } from './handover/HandoverView';
import { WitnessApp } from './witness/WitnessApp';

function NotFound() {
  return (
    <div className="page centered">
      <h1>Nie ma takiej strony</h1>
      <p>Świadek otwiera link otrzymany od prowadzącego. Panel: <Link to="/dispatcher">/dispatcher</Link>.</p>
    </div>
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
