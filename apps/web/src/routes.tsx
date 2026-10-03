import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Splash } from './components/ui';
import { RequireStaff } from './dispatcher/auth';
const DispatcherHome = lazy(() => import('./dispatcher/DispatcherHome').then(m => ({ default: m.DispatcherHome })));
const IncidentPanel = lazy(() => import('./dispatcher/IncidentPanel').then(m => ({ default: m.IncidentPanel })));
const HandoverView = lazy(() => import('./handover/HandoverView').then(m => ({ default: m.HandoverView })));
const WitnessApp = lazy(() => import('./witness/WitnessApp').then(m => ({ default: m.WitnessApp })));
const BrandHome = lazy(() => import('./brand/BrandHome').then(m => ({ default: m.BrandHome })));
const DemoStudio = lazy(() => import('./demo/DemoStudio').then(m => ({ default: m.DemoStudio })));

function page(children: ReactNode) {
  return <Suspense fallback={<Splash title="Wczytywanie…" />}>{children}</Suspense>;
}

function RouteError() {
  return <Splash title="Nie udało się wczytać widoku" tone="orange">
    <p>Sprawdź połączenie i wczytaj stronę ponownie. Wpisy zapisane na telefonie pozostają w jego pamięci.</p>
    <button className="btn btn-primary" onClick={() => window.location.reload()}>Wczytaj ponownie</button>
  </Splash>;
}

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
  {
    errorElement: <RouteError />,
    children: [
      { path: '/', element: page(<BrandHome />) },
      { path: '/demo', element: page(<RequireStaff><DemoStudio /></RequireStaff>) },
      { path: '/w/:token', element: page(<WitnessApp />) },
      { path: '/dispatcher', element: page(<RequireStaff><DispatcherHome /></RequireStaff>) },
      { path: '/dispatcher/:id', element: page(<RequireStaff><IncidentPanel /></RequireStaff>) },
      { path: '/handover/:id', element: page(<RequireStaff><HandoverView /></RequireStaff>) },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
