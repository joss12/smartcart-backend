import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  createUser,
  findUserByEmail,
  findUserById,
} from "../repositories/users.repository";
import {
  insertRefreshToken,
  listRefreshTokensByUser,
  deleteRefreshTokensByUser,
} from "../repositories/refresh-tokens.repository";
import { logAuditEvent } from "./audit.service";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev_secret";

export function signAccessToken(user: { id: string; role: string }) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "15m" });
}

export function signRefreshToken(user: { id: string }) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as { id: string; role?: string };
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function register(input: { email: string; password: string }) {
  const passwordHash = await hashPassword(input.password);

  const user = await createUser({
    email: input.email,
    passwordHash,
  });

  await logAuditEvent({
    eventType: "user.registered",
    actorUserId: user.id,
    entityType: "user",
    entityId: user.id,
    metadata: { email: user.email },
  });

  return user;
}

export async function login(input: { email: string; password: string }) {
  const user = await findUserByEmail(input.email);
  if (!user) return null;

  const ok = await verifyPassword(input.password, user.password_hash);
  if (!ok) return null;

  const accessToken = signAccessToken({
    id: user.id,
    role: user.role,
  });

  const refreshToken = signRefreshToken({
    id: user.id,
  });

  const tokenHash = await bcrypt.hash(refreshToken, 10);
  await insertRefreshToken({
    userId: user.id,
    tokenHash,
  });

  await logAuditEvent({
    eventType: "user.logged_in",
    actorUserId: user.id,
    entityType: "user",
    entityId: user.id,
    metadata: { email: user.email },
  });

  return { accessToken, refreshToken };
}

export async function refreshAccessToken(refreshToken: string) {
  const payload = verifyToken(refreshToken);
  const tokens = await listRefreshTokensByUser(payload.id);

  for (const row of tokens) {
    const valid = await bcrypt.compare(refreshToken, row.token_hash);
    if (valid) {
      const user = await findUserById(payload.id);
      if (!user) return null;

      const accessToken = signAccessToken({
        id: user.id,
        role: user.role,
      });

      return { accessToken };
    }
  }

  return null;
}

export async function logout(userId: string) {
  await deleteRefreshTokensByUser(userId);

  await logAuditEvent({
    eventType: "user.logged_out",
    actorUserId: userId,
    entityType: "user",
    entityId: userId,
  });
}

export async function me(userId: string) {
  return findUserById(userId);
}
