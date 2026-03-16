import { pool } from "../lib/db";

export async function findWebhookEventByProviderId(providerEventId: string) {
  const r = await pool.query(
    `SELECT * FROM webhook_events WHERE provider_event_id = $1`,
    [providerEventId],
  );
  return r.rows[0] ?? null;
}

export async function insertWebhookEvent(input: {
  providerEventId: string;
  eventType: string;
  payload: any;
}) {
  const r = await pool.query(
    `
    INSERT INTO webhook_events (provider_event_id, event_type, payload)
    VALUES ($1, $2, $3)
    RETURNING *
    `,
    [input.providerEventId, input.eventType, input.payload ?? null],
  );
  return r.rows[0];
}
