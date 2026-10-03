-- Uzupełnienia schematu potrzebne w prototypie.

-- Kolejność czynności i powiązanie z pakietem dostarczonym dronem.
ALTER TABLE instructions ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE instructions ADD COLUMN package_id TEXT;

-- Ratownik przejmujący ma dostęp tylko do przydzielonego zdarzenia (sekcja 5).
CREATE TABLE incident_responders (
  incident_id     TEXT NOT NULL REFERENCES incidents(id),
  responder_id    TEXT NOT NULL REFERENCES dispatchers(id),
  assigned_at     TEXT NOT NULL,
  assigned_by_id  TEXT NOT NULL,
  PRIMARY KEY (incident_id, responder_id)
);

-- Szkic AI: zdania z odnośnikami i liczba zdań odrzuconych przez kontrolę.
ALTER TABLE ai_summary_drafts ADD COLUMN sentences_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE ai_summary_drafts ADD COLUMN rejected_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX idx_ack_incident ON acknowledgements(incident_id, received_time);
CREATE INDEX idx_situation_incident ON situation_change_reports(incident_id, received_time);
CREATE INDEX idx_sms_incident ON sms_inbound(linked_incident_id, received_time);
