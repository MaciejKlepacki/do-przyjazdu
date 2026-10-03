// Trzy obszary z sekcji 7: telefon świadka, panel dyspozytora, widok przekazania.
// Baner trybu demonstracyjnego renderuje każdy obszar sam — zna stan DEMO_MODE z API.
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';

export function App() {
  return <RouterProvider router={router} />;
}
