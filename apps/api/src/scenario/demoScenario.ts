// Scenariusz demonstracyjny: pola formularza i instrukcje.
//
// UWAGA: treść ROBOCZA przygotowana przez zespół techniczny jako wypełniacz, żeby przepływ dało się
// przejść od początku do końca. Właścicielem treści jest lekarz w zespole (docs/scenariusz-demo.md).
// Przed pokazem treść musi zostać przejrzana i zastąpiona albo zatwierdzona przez lekarza.
// Dane są fikcyjne. To nie jest procedura TOPR.
import type { ObservationField } from '@do-przyjazdu/shared';

export const SCENARIO_AUTHOR_ID = 'scenariusz-roboczy';

export const DEMO_INCIDENT_DESCRIPTION =
  'Szlak w rejonie Doliny Pięciu Stawów (fikcyjne). Dwie osoby, jedna po upadku na szlaku, druga wezwała pomoc. Pogoda pogarsza się.';

/** Odpowiedź „nie wiem” dokłada interfejs przy każdym polu - nie jest opcją w danych. */
export const SCENARIO_FIELDS: Array<Omit<ObservationField, 'allowsUnknown'>> = [
  {
    key: 'responds',
    label: 'Czy osoba odpowiada, gdy do niej mówisz?',
    kind: 'single-choice',
    options: [
      { value: 'yes', label: 'Tak, wyraźnie' },
      { value: 'unclear', label: 'Niewyraźnie lub z opóźnieniem' },
      { value: 'no', label: 'Nie odpowiada' },
    ],
  },
  {
    key: 'breathing',
    label: 'Czy widzisz lub słyszysz, że oddycha?',
    kind: 'single-choice',
    options: [
      { value: 'yes', label: 'Tak' },
      { value: 'no', label: 'Nie' },
    ],
  },
  {
    key: 'bleeding',
    label: 'Czy widzisz krwawienie?',
    kind: 'single-choice',
    options: [
      { value: 'none', label: 'Nie widzę' },
      { value: 'minor', label: 'Niewielkie' },
      { value: 'heavy', label: 'Duże, nie ustaje' },
    ],
  },
  {
    key: 'pain_location',
    label: 'Gdzie osoba wskazuje ból?',
    kind: 'multi-choice',
    options: [
      { value: 'head', label: 'Głowa' },
      { value: 'neck_back', label: 'Szyja lub plecy' },
      { value: 'chest', label: 'Klatka piersiowa' },
      { value: 'belly', label: 'Brzuch' },
      { value: 'arm', label: 'Ręka' },
      { value: 'leg', label: 'Noga' },
      { value: 'none', label: 'Nie wskazuje bólu' },
    ],
  },
  {
    key: 'can_move',
    label: 'Czy osoba może sama się poruszać?',
    kind: 'single-choice',
    options: [
      { value: 'yes', label: 'Tak' },
      { value: 'difficult', label: 'Z trudem' },
      { value: 'no', label: 'Nie' },
    ],
  },
  {
    key: 'cold',
    label: 'Czy osoba drży albo mówi, że jest jej zimno?',
    kind: 'single-choice',
    options: [
      { value: 'yes', label: 'Tak' },
      { value: 'no', label: 'Nie' },
    ],
  },
  {
    key: 'equipment',
    label: 'Co macie przy sobie?',
    kind: 'multi-choice',
    options: [
      { value: 'clothes', label: 'Dodatkowe ubranie lub kurtka' },
      { value: 'mat', label: 'Karimata lub plecak do podłożenia' },
      { value: 'foil', label: 'Folia NRC' },
      { value: 'first_aid', label: 'Apteczka' },
      { value: 'light', label: 'Czołówka lub latarka' },
      { value: 'food_drink', label: 'Jedzenie lub picie' },
      { value: 'powerbank', label: 'Powerbank' },
    ],
  },
  {
    key: 'weather',
    label: 'Jaka jest teraz pogoda?',
    kind: 'single-choice',
    options: [
      { value: 'dry', label: 'Sucho' },
      { value: 'rain', label: 'Deszcz' },
      { value: 'snow', label: 'Śnieg' },
      { value: 'wind', label: 'Silny wiatr' },
      { value: 'fog', label: 'Mgła' },
    ],
  },
];

export interface ScenarioInstruction {
  text: string;
  packageId: string | null;
}

export const DEMO_PACKAGE_ID = 'PAKIET-01';

/** Instrukcje trafiają do bazy jako szkice - świadek zobaczy je dopiero po zatwierdzeniu (sekcja 8). */
export const SCENARIO_INSTRUCTIONS: ScenarioInstruction[] = [
  {
    text: 'Zostań przy poszkodowanym. Nie przemieszczaj go, chyba że w miejscu, w którym jesteście, grozi wam niebezpieczeństwo.',
    packageId: null,
  },
  {
    text: 'Odizoluj poszkodowanego od zimnego podłoża: podłóż plecak, karimatę lub ubranie pod plecy i biodra, poruszając go jak najmniej.',
    packageId: null,
  },
  {
    text: 'Okryj poszkodowanego dodatkowym ubraniem. Zakryj także głowę i szyję.',
    packageId: null,
  },
  {
    text: 'Co kilka minut zapytaj poszkodowanego, jak się czuje. Jeśli przestanie odpowiadać albo coś się zmieni, od razu naciśnij „Zgłoś zmianę”.',
    packageId: null,
  },
  {
    text: 'Otwórz pakiet dostarczony dronem. Wyjmij folię NRC i owiń nią poszkodowanego na ubraniu. Twarz zostaw odkrytą.',
    packageId: DEMO_PACKAGE_ID,
  },
  {
    text: 'Wyjmij z pakietu ogrzewacz chemiczny. Uruchom go według opisu na opakowaniu i połóż na ubraniu, nie bezpośrednio na skórze.',
    packageId: DEMO_PACKAGE_ID,
  },
];
