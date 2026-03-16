import {
  insertAuditLog,
  listAuditLogs,
} from "../repositories/audit.repository";

export async function logAuditEvent(input: {
  eventType: string;
  actorUserId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: any;
}) {
  return insertAuditLog(input);
}

export async function getAuditLogs(limit = 50) {
  return listAuditLogs(limit);
}
