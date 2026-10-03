import type { Author, DualTimestamps } from './common.js';

/**
 * Obiekt „Wyposażenie”. Dostawa dronem to wpis dyspozytora -
 * prototyp nie komunikuje się z dronem (sekcja 12).
 */
export interface EquipmentItem {
  id: string;
  incidentId: string;
  name: string;
  state: 'declared-available' | 'delivered' | 'unavailable';
  /** Identyfikator pakietu z rekwizytu demonstracyjnego. */
  packageId: string | null;
  author: Author;
  times: DualTimestamps;
}
