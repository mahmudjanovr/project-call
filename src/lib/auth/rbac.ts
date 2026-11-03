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

const PERMISSION_ALIASES: Record<string, string[]> = {
  "users:manage": ["users.read", "users.create", "users.update", "users.delete"],
  "employees:manage": ["employees.read", "employees.create", "employees.update", "employees.delete"],
  "roles:manage": ["roles.read", "roles.manage"],
  "products:manage": ["settings.manage"],
  "system:settings:manage": ["settings.manage"],
  "system:settings:read": ["settings.read", "settings.manage"],
  "audit:read": ["audit.read"],
  "customers:read": ["customers.read"],
  "customers:create": ["customers.create"],
  "orders:create": ["orders.create"],
  "orders:submit": ["orders.submit"],
  "orders:review": ["orders.review"],
  "orders:approve": ["orders.approve"],
  "orders:reject": ["orders.reject"],
  "operations:read": ["reports.read"],
};

/**
 * Checks if the actor has a given permission without throwing.
 */
export function hasPermission(
  auth: AuthContext | null,
  permissionKey: string
): boolean {
  if (!auth) return false;
  if (auth.permissions.includes(permissionKey)) return true;

  const aliases = PERMISSION_ALIASES[permissionKey];
  if (aliases && aliases.some((alias) => auth.permissions.includes(alias))) {
    return true;
  }

  return false;
}

/**
 * Deny-by-default permission guard.
 * Validates that the authenticated actor possesses the specified permission.
 * Throws ForbiddenError if permission is missing.
 */
export async function requirePermission(
  permissionKey: string,
  shouldRedirect = false
): Promise<AuthContext> {
  const auth = await requireAuth(shouldRedirect);

  if (!hasPermission(auth, permissionKey)) {
    if (shouldRedirect) {
      redirect("/");
    }
    throw new ForbiddenError(`Forbidden: Missing required permission '${permissionKey}'`);
  }

  return auth;
}

/**
 * Checks if the actor has any of the listed permissions.
 */
export function hasAnyPermission(
  auth: AuthContext | null,
  permissionKeys: string[]
): boolean {
  if (!auth) return false;
  return permissionKeys.some((key) => hasPermission(auth, key));
}
