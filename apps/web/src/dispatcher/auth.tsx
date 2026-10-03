// Sesja panelu. Sam adres panelu nie daje uprawnień — backend sprawdza każde żądanie.
import type { MeResponse } from '@do-przyjazdu/shared';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { ServerCrash } from 'lucide-react';
import { Splash } from '../components/ui';
import { api, ApiError } from '../lib/api';
import { LoginScreen } from './LoginScreen';

interface AuthState {
  me: MeResponse;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth poza RequireStaff');
  return ctx;
}

export function RequireStaff({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<MeResponse | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setMe(await api<MeResponse>('/auth/me'));
      setError(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) setMe(null);
      else setError('Brak połączenia z serwerem.');
    }
  }, []);

  useEffect(() => void load(), [load]);

  if (error && me === undefined) {
    return (
      <Splash icon={<ServerCrash size={34} />} tone="red" title="Brak połączenia">
        <p>{error}</p>
        <button className="btn btn-lg btn-primary" onClick={() => void load()}>
          Spróbuj ponownie
        </button>
      </Splash>
    );
  }
  if (me === undefined) return <Splash title="Do przyjazdu" />;
  if (me === null) return <LoginScreen onLogin={setMe} />;

  const logout = async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => undefined);
    setMe(null);
  };
  return <AuthContext.Provider value={{ me, logout }}>{children}</AuthContext.Provider>;
}
