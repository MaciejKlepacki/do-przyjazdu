// Wpis wyposażenia i dostawy pakietu (np. dronem) z identyfikatorem pakietu.
// Prototyp nie komunikuje się z dronem — dostawę wpisuje dyspozytor (sekcja 12).
import type { EquipmentItem, StaffUser } from '@do-przyjazdu/shared';
import { useState } from 'react';
import { api, errorMessage } from '../lib/api';
import { EQUIPMENT_STATE_LABEL } from '../lib/labels';
import { formatTime } from '../lib/time';

interface Props {
  incidentId: string;
  equipment: EquipmentItem[];
  staff: StaffUser[];
  canManage: boolean;
  onChange: () => void;
}

export function EquipmentEntry({ incidentId, equipment, staff, canManage, onChange }: Props) {
  const [name, setName] = useState('');
  const [state, setState] = useState<EquipmentItem['state']>('delivered');
  const [packageId, setPackageId] = useState('PAKIET-01');
  const [error, setError] = useState<string | null>(null);
  const who = (e: EquipmentItem) => (e.author.kind === 'dispatcher' ? staff.find((s) => s.id === (e.author as { userId: string }).userId)?.displayName : 'świadek');

  return (
    <div>
      {equipment.length === 0 ? (
        <p className="muted">Brak wpisów.</p>
      ) : (
        <ul className="equipment">
          {equipment.map((e) => (
            <li key={e.id}>
              <strong>{e.name}</strong> — {EQUIPMENT_STATE_LABEL[e.state]}
              {e.packageId && <span className="chip chip-info">{e.packageId}</span>}
              <span className="muted small">
                {' '}
                · {formatTime(e.times.receivedTime)} · {who(e)}
              </span>
            </li>
          ))}
        </ul>
      )}
      {canManage && (
        <div className="row wrap">
          <input className="grow" placeholder="np. Pakiet z drona: folia NRC, ogrzewacz" value={name} onChange={(e) => setName(e.target.value)} />
          <select value={state} onChange={(e) => setState(e.target.value as EquipmentItem['state'])}>
            {Object.entries(EQUIPMENT_STATE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <input className="short" placeholder="ID pakietu" value={packageId} onChange={(e) => setPackageId(e.target.value)} />
          <button
            className="btn btn-small"
            disabled={!name.trim()}
            onClick={async () => {
              try {
                await api(`/incidents/${incidentId}/equipment`, { method: 'POST', body: { name, state, packageId: packageId || null } });
                setName('');
                onChange();
              } catch (err) {
                setError(errorMessage(err));
              }
            }}
          >
            Zapisz
          </button>
        </div>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
