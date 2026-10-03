// POST /sms/inbound   webhook uzgodnionego odbiornika SMS (poza podstawowym MVP).
// Bez SMS_INBOUND_SECRET trasa działa wyłącznie w trybie symulacji i tak oznacza wpisy.
// Wiadomość bez poprawnego identyfikatora sesji => needs_manual_review, nigdy autoprzypisanie (reguła 9).
