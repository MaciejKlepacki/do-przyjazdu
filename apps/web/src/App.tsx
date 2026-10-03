// Trzy obszary z sekcji 7: telefon świadka, panel dyspozytora, widok przekazania.
// Baner trybu demonstracyjnego renderuje każdy obszar sam - zna stan DEMO_MODE z API.
import { MotionConfig } from 'framer-motion';
import { RouterProvider } from 'react-router-dom';
import { ToastProvider } from './components/ui';
import { router } from './routes';

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </MotionConfig>
  );
}
