-- Reservation requests hold inventory for two hours pending operator decision.
-- The DB exclusion constraint continues to cover requested/confirmed rows only.
BEGIN;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
UPDATE reservations SET expires_at=created_at+INTERVAL '2 hours' WHERE expires_at IS NULL;
ALTER TABLE reservations ALTER COLUMN expires_at SET NOT NULL;
ALTER TABLE reservations ALTER COLUMN expires_at SET DEFAULT (NOW()+INTERVAL '2 hours');
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_status_check;
ALTER TABLE reservations ADD CONSTRAINT reservations_status_check
  CHECK (status IN ('requested','confirmed','cancelled','rejected','completed','expired'));
CREATE INDEX IF NOT EXISTS idx_reservation_expiry
  ON reservations(resource_id,expires_at) WHERE status='requested';
COMMIT;
