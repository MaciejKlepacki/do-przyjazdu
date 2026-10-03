/** Konto panelu. Ratownik przejmujący widzi tylko przydzielone zdarzenia (sekcja 5). */
export type StaffRole = 'dispatcher' | 'responder';

export interface StaffUser {
  id: string;
  displayName: string;
  role: StaffRole;
}
