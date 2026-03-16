import { pool } from "../lib/db";

export async function insertAuditLog(input: {
  eventType: string;
  actorUserId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: any;
}) {
  await pool.query(
    `
    INSERT INTO audit_logs (
      event_type,
      actor_user_id,
      entity_type,
      entity_id,
      metadata
    )
    VALUES ($1,$2,$3,$4,$5)
    `,
    [
      input.eventType,
      input.actorUserId ?? null,
      input.entityType ?? null,
      input.entityId ?? null,
      input.metadata ?? null,
    ],
  );
}

export async function listAuditLogs(limit = 50) {
  const r = await pool.query(
    `
    SELECT *
    FROM audit_logs
    ORDER BY created_at DESC
    LIMIT $1
    `,
    [limit],
  );

  return r.rows;
}
