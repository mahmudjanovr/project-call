"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { users, employees, roles, userRoles, type Employee, type Role } from "@/db/schema";
import { hashPassword, verifyPassword } from "./password";
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from "./rate-limiter";
import {
  createSession,
  invalidateSession,
  invalidateAllUserSessions,
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "./session";
import { requireAuth, requirePermission, getCurrentAuth, ForbiddenError } from "./rbac";

export interface ActionResponse<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

export interface EmployeeListItem {
  id: string;
  userId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  position: string | null;
  department: string | null;
  isActive: boolean;
  email: string;
  roleName: string;
  roleDisplayName: string;
  createdAt: Date;
}

/**
 * Server action: User login with rate limiting & generic error messages.
 */
export async function loginAction(
  _prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "Email va parolni kiriting." };
  }

  // 1. Rate limiting check per target email / identifier
  const rateLimit = checkRateLimit(email);
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: `Juda ko'p muvaffaqiyatsiz urinishlar. Iltimos, ${rateLimit.retryAfterSeconds} soniyadan keyin qayta urinib ko'ring.`,
    };
  }

  // 2. Fetch user by email
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    recordFailedAttempt(email);
    // Generic error: never reveal if email exists
    return { success: false, error: "Email yoki parol noto'g'ri." };
  }

  // 3. Verify password hash using Argon2id
  const isPasswordValid = await verifyPassword(user.passwordHash, password);
  if (!isPasswordValid) {
    recordFailedAttempt(email);
    return { success: false, error: "Email yoki parol noto'g'ri." };
  }

  // 4. Verify account active state
  if (!user.isActive) {
    return {
      success: false,
      error: "Ushbu hisob faolsizlantirilgan. Iltimos, administratorga murojaat qiling.",
    };
  }

  // 5. Verify linked employee active state
  const [employee] = await db
    .select()
    .from(employees)
    .where(eq(employees.userId, user.id))
    .limit(1);

  if (!employee || !employee.isActive) {
    return {
      success: false,
      error: "Ushbu xodim profili faolsizlantirilgan. Iltimos, administratorga murojaat qiling.",
    };
  }

  // 6. Reset rate limit on successful authentication
  resetRateLimit(email);

  // 7. Update last_login_at
  await db
    .update(users)
    .set({ lastLoginAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, user.id));

  // 8. Create server-side session in PostgreSQL
  const { token } = await createSession(user.id);

  // 9. Set HTTP-only secure session cookie
  const cookieOpts = getSessionCookieOptions();
  cookies().set(cookieOpts.name, token, cookieOpts);

  redirect("/");
}

/**
 * Server action: Logout and session invalidation.
 */
export async function logoutAction(): Promise<void> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await invalidateSession(token);
    cookieStore.delete(SESSION_COOKIE_NAME);
  }

  redirect("/login");
}

export interface CreateEmployeeInput {
  firstName: string;
  lastName: string;
  email: string;
  employeeCode: string;
  roleId: string;
  password: string;
  phone?: string;
  position?: string;
  department?: string;
}

/**
 * Server action: Create an employee profile and linked user account in a single transaction.
 * Admin-only: requires 'employees:manage' and 'users:manage' permissions.
 * Prevents privilege escalation.
 */
export async function createEmployeeAction(
  input: CreateEmployeeInput
): Promise<ActionResponse<EmployeeListItem>> {
  const auth = await requirePermission("employees.create");
  if (!auth.permissions.includes("users.create") && !auth.permissions.includes("users:manage")) {
    throw new ForbiddenError("Missing 'users.create' permission.");
  }

  const { firstName, lastName, email, employeeCode, roleId, password, phone, position, department } = input;

  if (!firstName || !lastName || !email || !employeeCode || !roleId || !password) {
    return { success: false, error: "Barcha majburiy maydonlarni to'ldiring." };
  }

  if (password.length < 8) {
    return { success: false, error: "Parol kamida 8 ta belgidan iborat bo'lishi kerak." };
  }

  // Target role check
  const [targetRole] = await db.select().from(roles).where(eq(roles.id, roleId)).limit(1);
  if (!targetRole) {
    return { success: false, error: "Tanlangan rol topilmadi." };
  }

  // Privilege escalation prevention:
  // Only an Admin can assign the 'admin' role.
  if (targetRole.name === "admin" && auth.role.name !== "admin") {
    throw new ForbiddenError("Faqat bosh administrator boshqa administratorni tayinlashi mumkin.");
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Check unique email
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (existingUser) {
    return { success: false, error: "Ushbu email bilan hisob allaqachon mavjud." };
  }

  // Check unique employee code
  const [existingEmp] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(eq(employees.employeeCode, employeeCode.trim()))
    .limit(1);

  if (existingEmp) {
    return { success: false, error: "Ushbu xodim kodi (ID) allaqachon mavjud." };
  }

  // Hash password using Argon2id
  const passwordHash = await hashPassword(password);

  // Atomically create User and Employee inside a database transaction
  const result = await db.transaction(async (tx) => {
    const [newUser] = await tx
      .insert(users)
      .values({
        email: normalizedEmail,
        passwordHash,
        isActive: true,
        emailVerified: false,
      })
      .returning();

    if (!newUser) {
      throw new Error("Foydalanuvchi hisobini yaratishda xatolik yuz berdi.");
    }

    // Assign user role in canonical user_roles join table
    await tx.insert(userRoles).values({
      userId: newUser.id,
      roleId: targetRole.id,
    });

    const [newEmployee] = await tx
      .insert(employees)
      .values({
        userId: newUser.id,
        employeeCode: employeeCode.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone?.trim() || null,
        position: position?.trim() || null,
        department: department?.trim() || null,
        isActive: true,
      })
      .returning();

    if (!newEmployee) {
      throw new Error("Xodim profilini yaratishda xatolik yuz berdi.");
    }

    return {
      id: newEmployee.id,
      userId: newUser.id,
      employeeCode: newEmployee.employeeCode,
      firstName: newEmployee.firstName,
      lastName: newEmployee.lastName,
      phone: newEmployee.phone,
      position: newEmployee.position,
      department: newEmployee.department,
      isActive: newEmployee.isActive,
      email: newUser.email,
      roleName: targetRole.name,
      roleDisplayName: targetRole.displayName,
      createdAt: newEmployee.createdAt,
    };
  });

  revalidatePath("/employees");
  return { success: true, data: result };
}

/**
 * Server action: Activate or deactivate an employee account.
 * Invalidates all active sessions when deactivated.
 */
export async function toggleEmployeeStatusAction(
  employeeId: string,
  isActive: boolean
): Promise<ActionResponse> {
  const auth = await requirePermission("users.update");

  const [employee] = await db
    .select()
    .from(employees)
    .where(eq(employees.id, employeeId))
    .limit(1);

  if (!employee) {
    return { success: false, error: "Xodim topilmadi." };
  }

  // Prevent self-deactivation
  if (employee.userId === auth.user.id && !isActive) {
    return { success: false, error: "O'z hisobingizni faolsizlantira olmaysiz." };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(employees)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(employees.id, employeeId));

    await tx
      .update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(users.id, employee.userId));
  });

  // If deactivated, revoke all active sessions immediately
  if (!isActive) {
    await invalidateAllUserSessions(employee.userId);
  }

  revalidatePath("/employees");
  return { success: true };
}

/**
 * Server action: Admin reset password for an employee.
 * Hashes new password with Argon2id and invalidates all active sessions for that user.
 */
export async function resetEmployeePasswordAction(
  employeeId: string,
  newPassword: string
): Promise<ActionResponse> {
  const auth = await requirePermission("users.update");

  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: "Yangi parol kamida 8 ta belgidan iborat bo'lishi kerak." };
  }

  const [employee] = await db
    .select()
    .from(employees)
    .where(eq(employees.id, employeeId))
    .limit(1);

  if (!employee) {
    return { success: false, error: "Xodim topilmadi." };
  }

  // Fetch target user's role to prevent non-admins from resetting admin passwords
  const [targetUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, employee.userId))
    .limit(1);

  if (!targetUser) {
    return { success: false, error: "Foydalanuvchi hisobi topilmadi." };
  }

  const [targetUserRole] = await db
    .select({ roleName: roles.name })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, employee.userId))
    .limit(1);

  if (targetUserRole?.roleName === "admin" && auth.role.name !== "admin") {
    throw new ForbiddenError("Faqat bosh administrator boshqa administrator parolini yangilay oladi.");
  }

  const newPasswordHash = await hashPassword(newPassword);

  await db
    .update(users)
    .set({ passwordHash: newPasswordHash, updatedAt: new Date() })
    .where(eq(users.id, employee.userId));

  // Invalidate all active sessions for security so user must re-authenticate with new password
  await invalidateAllUserSessions(employee.userId);

  return { success: true };
}

/**
 * Queries employees with user accounts and roles.
 */
export async function getEmployeesList(): Promise<EmployeeListItem[]> {
  await requirePermission("employees.read");

  const rows = await db
    .select({
      id: employees.id,
      userId: employees.userId,
      employeeCode: employees.employeeCode,
      firstName: employees.firstName,
      lastName: employees.lastName,
      phone: employees.phone,
      position: employees.position,
      department: employees.department,
      isActive: employees.isActive,
      email: users.email,
      roleName: roles.name,
      roleDisplayName: roles.displayName,
      createdAt: employees.createdAt,
    })
    .from(employees)
    .innerJoin(users, eq(employees.userId, users.id))
    .innerJoin(userRoles, eq(users.id, userRoles.userId))
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .orderBy(desc(employees.createdAt));

  return rows;
}

/**
 * Queries system roles.
 */
export async function getRolesList(): Promise<Role[]> {
  await requireAuth();
  return await db.select().from(roles).orderBy(roles.name);
}
