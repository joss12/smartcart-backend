import {
  getStats,
  listUsers,
  updateUserRole,
} from "../repositories/admin.repository";
import { logAuditEvent } from "./audit.service";

export async function getAdminStats() {
  return getStats();
}

export async function getAdminUsers(input: { page: number; limit: number }) {
  const offset = (input.page - 1) * input.limit;
  return listUsers({ limit: input.limit, offset });
}

export async function setUserRole(input: {
  actorUserId: string;
  targetUserId: string;
  role: "user" | "admin";
}) {
  const user = await updateUserRole(input.targetUserId, input.role);
  if (!user) return null;

  await logAuditEvent({
    eventType: "user.role_updated",
    actorUserId: input.actorUserId,
    entityType: "user",
    entityId: input.targetUserId,
    metadata: { role: input.role },
  });

  return user;
}
