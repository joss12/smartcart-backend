CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  payload JSONB,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_provider_event_id
ON webhook_events(provider_event_id);
