-- Model danych z sekcji 11 dokumentu.
-- Zasada nadrzędna: wpisów się nie usuwa, poprawka to nowy wpis z własnym czasem i autorem.

PRAGMA foreign_keys = ON;

CREATE TABLE incidents (
  id                  TEXT PRIMARY KEY,
  description         TEXT NOT NULL,
  status              TEXT NOT NULL CHECK (status IN ('open', 'handed-over', 'closed')),
  lead_dispatcher_id  TEXT NOT NULL,
  created_at          TEXT NOT NULL,
  closed_at           TEXT,
  is_demo             INTEGER NOT NULL DEFAULT 1 CHECK (is_demo IN (0, 1))
);

-- Token świadka: w bazie tylko skrót. Dostęp ograniczony do jednej sesji.
CREATE TABLE witness_access (
  id            TEXT PRIMARY KEY,
  incident_id   TEXT NOT NULL REFERENCES incidents(id),
  token_hash    TEXT NOT NULL UNIQUE,
  expires_at    TEXT NOT NULL,
  revoked_at    TEXT,
  created_at    TEXT NOT NULL,
  last_seen_at  TEXT
);

CREATE TABLE dispatchers (
  id             TEXT PRIMARY KEY,
  display_name   TEXT NOT NULL,
  role           TEXT NOT NULL CHECK (role IN ('dispatcher', 'responder')),
  password_hash  TEXT NOT NULL,
  created_at     TEXT NOT NULL
);

-- Pola formularza obserwacji ustalone dla scenariusza przez lekarza.
CREATE TABLE observation_fields (
  incident_id  TEXT NOT NULL REFERENCES incidents(id),
  field_key    TEXT NOT NULL,
  label        TEXT NOT NULL,
  kind         TEXT NOT NULL CHECK (kind IN ('single-choice', 'multi-choice', 'short-text', 'number')),
  options_json TEXT,
  unit         TEXT,
  sort_order   INTEGER NOT NULL,
  PRIMARY KEY (incident_id, field_key)
);

-- entry_id pochodzi z urządzenia i jest kluczem idempotencji (reguły 1 i 2).
CREATE TABLE observations (
  entry_id        TEXT PRIMARY KEY,
  incident_id     TEXT NOT NULL REFERENCES incidents(id),
  author_kind     TEXT NOT NULL CHECK (author_kind IN ('witness', 'dispatcher', 'responder', 'system')),
  author_id       TEXT,
  source          TEXT NOT NULL CHECK (source IN ('witness-observation', 'device-measurement', 'dispatcher-assessment', 'simulated')),
  channel         TEXT NOT NULL CHECK (channel IN ('https', 'sms-inbound', 'demo-seed')),
  -- Odpowiedzi łącznie z „nie wiem”: brak danych zostaje zapisany jako brak.
  answers_json    TEXT NOT NULL,
  free_text       TEXT,
  device_id       TEXT,
  device_sequence INTEGER NOT NULL,
  device_time     TEXT NOT NULL,
  received_time   TEXT NOT NULL
);

CREATE INDEX idx_observations_incident ON observations(incident_id, received_time);

-- Instrukcja jest wersjonowana; każda wersja to osobny wiersz, nic się nie nadpisuje.
CREATE TABLE instructions (
  id                TEXT NOT NULL,
  version           INTEGER NOT NULL,
  incident_id       TEXT NOT NULL REFERENCES incidents(id),
  text              TEXT NOT NULL,
  illustration_url  TEXT,
  author_id         TEXT NOT NULL,
  approved_by_id    TEXT,
  status            TEXT NOT NULL CHECK (status IN ('draft', 'approved', 'withdrawn')),
  approved_at       TEXT,
  withdrawn_at      TEXT,
  created_at        TEXT NOT NULL,
  PRIMARY KEY (id, version)
);

CREATE INDEX idx_instructions_incident ON instructions(incident_id, status);

-- Potwierdzenie wiąże się z konkretną wersją instrukcji (reguły 4 i 5).
CREATE TABLE acknowledgements (
  entry_id            TEXT PRIMARY KEY,
  incident_id         TEXT NOT NULL REFERENCES incidents(id),
  instruction_id      TEXT NOT NULL,
  instruction_version INTEGER NOT NULL,
  result              TEXT NOT NULL CHECK (result IN ('done', 'cannot-do', 'needs-clarification')),
  comment             TEXT,
  channel             TEXT NOT NULL CHECK (channel IN ('https', 'sms-inbound', 'demo-seed')),
  device_id           TEXT,
  device_sequence     INTEGER NOT NULL,
  device_time         TEXT NOT NULL,
  received_time       TEXT NOT NULL,
  FOREIGN KEY (instruction_id, instruction_version) REFERENCES instructions(id, version)
);

CREATE TABLE equipment (
  id            TEXT PRIMARY KEY,
  incident_id   TEXT NOT NULL REFERENCES incidents(id),
  name          TEXT NOT NULL,
  state         TEXT NOT NULL CHECK (state IN ('declared-available', 'delivered', 'unavailable')),
  package_id    TEXT,
  author_kind   TEXT NOT NULL,
  author_id     TEXT,
  device_time   TEXT NOT NULL,
  received_time TEXT NOT NULL
);

-- Zgłoszenie zmiany sytuacji; obsługę potwierdza ręcznie prowadzący (sekcja 7).
CREATE TABLE situation_change_reports (
  entry_id        TEXT PRIMARY KEY,
  incident_id     TEXT NOT NULL REFERENCES incidents(id),
  text            TEXT NOT NULL,
  channel         TEXT NOT NULL CHECK (channel IN ('https', 'sms-inbound', 'demo-seed')),
  device_sequence INTEGER NOT NULL,
  device_time     TEXT NOT NULL,
  received_time   TEXT NOT NULL,
  reviewed_at     TEXT,
  reviewed_by_id  TEXT
);

-- Wiadomość SMS jako osobne zdarzenie osi czasu (reguły 8 i 9).
-- Nieznana sesja => needs_manual_review, bez dopisywania do innej akcji.
CREATE TABLE sms_inbound (
  id                   TEXT PRIMARY KEY,
  raw_text             TEXT NOT NULL,
  from_number_hash     TEXT,
  claimed_incident_id  TEXT,
  claimed_entry_id     TEXT,
  linked_incident_id   TEXT REFERENCES incidents(id),
  linked_entry_id      TEXT,
  needs_manual_review  INTEGER NOT NULL DEFAULT 1 CHECK (needs_manual_review IN (0, 1)),
  received_time        TEXT NOT NULL,
  read_by_id           TEXT,
  read_at              TEXT,
  is_simulated         INTEGER NOT NULL DEFAULT 1 CHECK (is_simulated IN (0, 1))
);

-- Okresy bez kontaktu, pokazywane w panelu i przy przekazaniu.
CREATE TABLE contact_gaps (
  id          TEXT PRIMARY KEY,
  incident_id TEXT NOT NULL REFERENCES incidents(id),
  started_at  TEXT NOT NULL,
  ended_at    TEXT
);

-- Szkic AI to osobny obiekt, nigdy obserwacja (sekcja 9).
CREATE TABLE ai_summary_drafts (
  id               TEXT PRIMARY KEY,
  incident_id      TEXT NOT NULL REFERENCES incidents(id),
  text             TEXT NOT NULL,
  cited_entry_ids  TEXT NOT NULL,
  generated_at     TEXT NOT NULL,
  approved_by_id   TEXT,
  approved_at      TEXT
);

CREATE TABLE handovers (
  id               TEXT PRIMARY KEY,
  incident_id      TEXT NOT NULL REFERENCES incidents(id),
  responder_id     TEXT NOT NULL,
  accepted_at      TEXT NOT NULL,
  approved_summary TEXT
);

-- Zmiany statusu zdarzenia: każda z autorem i czasem.
CREATE TABLE status_changes (
  id          TEXT PRIMARY KEY,
  incident_id TEXT NOT NULL REFERENCES incidents(id),
  from_status TEXT NOT NULL,
  to_status   TEXT NOT NULL,
  by_user_id  TEXT NOT NULL,
  at          TEXT NOT NULL
);
