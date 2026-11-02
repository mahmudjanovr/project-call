import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { validateSessionToken, SESSION_COOKIE_NAME, type AuthContext } from "./session";

export class UnauthorizedError extends Error {
  constructor(message = "Authentication required. Please log in.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Access denied. Insufficient permissions.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Retrieves the currently authenticated context from the request session cookie.
 * Returns null if not authenticated, expired, or deactivated.
 */
export async function getCurrentAuth(): Promise<AuthContext | null> {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  return await validateSessionToken(sessionToken);
}

/**
 * Requires authentication. If unauthenticated:
 * - In server components / pages: redirects to /login.
 * - In server actions / API endpoints: throws UnauthorizedError.
 */
export async function requireAuth(shouldRedirect = true): Promise<AuthContext> {
  const auth = await getCurrentAuth();

  if (!auth) {
    if (shouldRedirect) {
      redirect("/login");
    }
    throw new UnauthorizedError();
  }

  return auth;
}

/**
 * Deny-by-default permission guard.
 * Validates that the authenticated actor possesses the specified permission.
 * Throws ForbiddenError if permission is missing.
 */
export async function requirePermission(
  permissionCode: string,
  shouldRedirect = false
): Promise<AuthContext> {
  const auth = await requireAuth(shouldRedirect);

  if (!auth.permissions.includes(permissionCode)) {
    if (shouldRedirect) {
      redirect("/");
    }
    throw new ForbiddenError(`Forbidden: Missing required permission '${permissionCode}'`);
  }

  return auth;
}

/**
 * Checks if the actor has a given permission without throwing.
 */
export function hasPermission(
  auth: AuthContext | null,
  permissionCode: string
): boolean {
  if (!auth) return false;
  return auth.permissions.includes(permissionCode);
}

/**
 * Checks if the actor has any of the listed permissions.
 */
export function hasAnyPermission(
  auth: AuthContext | null,
  permissionCodes: string[]
): boolean {
  if (!auth) return false;
  return permissionCodes.some((code) => auth.permissions.includes(code));
}
