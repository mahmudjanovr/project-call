import crypto from "crypto";
import { eq, and, gt } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users, employees, roles, rolePermissions, permissions, type Session, type Employee, type Role, type SafeUser, toSafeUser } from "@/db/schema";

export const SESSION_COOKIE_NAME = "projectcall_session";
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

export interface AuthContext {
  session: Session;
  user: SafeUser;
  employee: Employee;
  role: Role;
  permissions: string[];
}

/**
 * Creates a new secure server-side session in PostgreSQL.
 * Token is cryptographically random (64 hex characters).
 */
export async function createSession(
  userId: string,
  metadata?: { ipAddress?: string; userAgent?: string }
): Promise<{ session: Session; token: string }> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  const [session] = await db
    .insert(sessions)
    .values({
      userId,
      token,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
      expiresAt,
    })
    .returning();

  if (!session) {
    throw new Error("Failed to create session in database.");
  }

  return { session, token };
}

/**
 * Validates a session token directly against PostgreSQL.
 * Enforces:
 * - Session expiration
 * - User active status
 * - Employee active status
 * - Full RBAC permissions resolution
 */
export async function validateSessionToken(token: string): Promise<AuthContext | null> {
  if (!token || typeof token !== "string") {
    return null;
  }

  // 1. Fetch session record
  const [session] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
    .limit(1);

  if (!session) {
    return null;
  }

  // 2. Fetch linked user and verify active status
  const [userRecord] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!userRecord || !userRecord.isActive) {
    // If user is deactivated or deleted, prune session immediately
    await invalidateSession(token);
    return null;
  }

  // 3. Fetch linked employee and verify active status
  const [employeeRecord] = await db
    .select()
    .from(employees)
    .where(eq(employees.userId, userRecord.id))
    .limit(1);

  if (!employeeRecord || !employeeRecord.isActive) {
    // If employee profile is deactivated, prune session immediately
    await invalidateSession(token);
    return null;
  }

  // 4. Fetch role and permissions
  const [roleRecord] = await db
    .select()
    .from(roles)
    .where(eq(roles.id, userRecord.roleId))
    .limit(1);

  if (!roleRecord) {
    await invalidateSession(token);
    return null;
  }

  const rolePerms = await db
    .select({ code: permissions.code })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.roleId, roleRecord.id));

  const permissionCodes = rolePerms.map((rp) => rp.code);

  return {
    session,
    user: toSafeUser(userRecord),
    employee: employeeRecord,
    role: roleRecord,
    permissions: permissionCodes,
  };
}

/**
 * Invalidates (deletes) a specific session from PostgreSQL.
 */
export async function invalidateSession(token: string): Promise<void> {
  if (!token) return;
  await db.delete(sessions).where(eq(sessions.token, token));
}

/**
 * Invalidates all active sessions for a specific user (e.g., on deactivation or password reset).
 */
export async function invalidateAllUserSessions(userId: string): Promise<void> {
  if (!userId) return;
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

/**
 * Returns secure cookie configuration options.
 */
export function getSessionCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}
