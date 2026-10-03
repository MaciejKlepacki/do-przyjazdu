// Logowanie do panelu. Sam adres panelu nie daje uprawnień.
import type { MeResponse, StaffUser } from '@do-przyjazdu/shared';
import { useEffect, useState, type FormEvent } from 'react';
import { DemoBanner } from '../components/DemoBanner';
import { api, errorMessage } from '../lib/api';

export function LoginScreen({ onLogin }: { onLogin: (me: MeResponse) => void }) {
  const [accounts, setAccounts] = useState<StaffUser[]>([]);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<StaffUser[]>('/auth/accounts')
      .then((list) => {
        setAccounts(list);
        setUserId((prev) => prev || list[0]?.id || '');
      })
      .catch((err) => setError(errorMessage(err)));
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      onLogin(await api<MeResponse>('/auth/login', { method: 'POST', body: { userId, password } }));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <DemoBanner />
      <form className="card login" onSubmit={submit}>
        <h1>Do przyjazdu — panel</h1>
        <label className="field-label">
          Konto
          <select value={userId} onChange={(e) => setUserId(e.target.value)}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.displayName}
              </option>
            ))}
          </select>
        </label>
        <label className="field-label">
          Hasło
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary" disabled={busy || !userId || !password}>
          Zaloguj
        </button>
      </form>
    </div>
  );
}
