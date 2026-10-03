// POST /witness/sync   wysłanie kolejki z urządzenia
// Przyjmuje tablicę SyncEnvelope, zwraca SyncResponse z duplicate=true dla ponowień (reguła 2).
// Zapisuje device_time i received_time oddzielnie (reguła 3).
