// Sesja panelu. Sam adres panelu nie daje uprawnień — backend sprawdza każde żądanie.
import type { MeResponse } from '@do-przyjazdu/shared';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
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
      <div className="page centered">
        <p>{error}</p>
        <button className="btn" onClick={() => void load()}>
          Spróbuj ponownie
        </button>
      </div>
    );
  }
  if (me === undefined) return <div className="page centered">Ładowanie…</div>;
  if (me === null) return <LoginScreen onLogin={setMe} />;

  const logout = async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => undefined);
    setMe(null);
  };
  return <AuthContext.Provider value={{ me, logout }}>{children}</AuthContext.Provider>;
}
