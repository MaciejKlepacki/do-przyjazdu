// Wpis wyposażenia i dostawy pakietu (np. dronem) z identyfikatorem pakietu.
// Prototyp nie komunikuje się z dronem — dostawę wpisuje dyspozytor (sekcja 12).
import type { EquipmentItem, StaffUser } from '@do-przyjazdu/shared';
import { AnimatePresence, motion } from 'framer-motion';
import { Package, Plus } from 'lucide-react';
import { useState } from 'react';
import { softSpring } from '../components/ui';
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
        <p className="hint">Brak wpisów. Dodaj, co jest na miejscu albo co dostarczono.</p>
      ) : (
        <ul className="equip-list">
          <AnimatePresence initial={false}>
            {equipment.map((e) => (
              <motion.li key={e.id} layout className="equip" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={softSpring}>
                <span className="equip-icon">
                  <Package size={17} />
                </span>
                <div className="equip-body">
                  <strong>{e.name}</strong>
                  <span>
                    {formatTime(e.times.receivedTime)} · {who(e)}
                  </span>
                </div>
                {e.packageId && <span className="badge badge-indigo">{e.packageId}</span>}
                <span className={`badge ${e.state === 'unavailable' ? 'badge-red' : 'badge-green'}`}>{EQUIPMENT_STATE_LABEL[e.state]}</span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
      {canManage && (
        <div className="inline-form">
          <input placeholder="np. Pakiet z drona: folia NRC, ogrzewacz" value={name} onChange={(e) => setName(e.target.value)} />
          <select value={state} onChange={(e) => setState(e.target.value as EquipmentItem['state'])}>
            {Object.entries(EQUIPMENT_STATE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <input style={{ flex: '0 1 9rem' }} placeholder="ID pakietu" value={packageId} onChange={(e) => setPackageId(e.target.value)} />
          <button
            className="btn btn-tint-blue"
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
            <Plus size={16} /> Zapisz
          </button>
        </div>
      )}
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
