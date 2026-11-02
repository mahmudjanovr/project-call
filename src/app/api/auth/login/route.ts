import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, employees } from "@/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from "@/lib/auth/rate-limiter";
import { createSession, getSessionCookieOptions } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = body?.email?.trim().toLowerCase();
    const password = body?.password;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email va parolni kiriting." },
        { status: 400 }
      );
    }

    // 1. Rate limiting check
    const rateLimit = checkRateLimit(email);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Juda ko'p muvaffaqiyatsiz urinishlar. Iltimos, ${rateLimit.retryAfterSeconds} soniyadan keyin qayta urinib ko'ring.`,
        },
        { status: 429 }
      );
    }

    // 2. Query user
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      recordFailedAttempt(email);
      return NextResponse.json(
        { success: false, error: "Email yoki parol noto'g'ri." },
        { status: 401 }
      );
    }

    // 3. Verify password
    const isPasswordValid = await verifyPassword(user.passwordHash, password);
    if (!isPasswordValid) {
      recordFailedAttempt(email);
      return NextResponse.json(
        { success: false, error: "Email yoki parol noto'g'ri." },
        { status: 401 }
      );
    }

    // 4. Check user active status
    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: "Ushbu hisob faolsizlantirilgan. Iltimos, administratorga murojaat qiling." },
        { status: 403 }
      );
    }

    // 5. Check employee active status
    const [employee] = await db.select().from(employees).where(eq(employees.userId, user.id)).limit(1);
    if (!employee || !employee.isActive) {
      return NextResponse.json(
        { success: false, error: "Ushbu xodim profili faolsizlantirilgan. Iltimos, administratorga murojaat qiling." },
        { status: 403 }
      );
    }

    // 6. Reset rate limit
    resetRateLimit(email);

    // 7. Update last login
    await db
      .update(users)
      .set({ lastLoginAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, user.id));

    // 8. Create session
    const { token } = await createSession(user.id);

    // 9. Build response with HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      message: "Authentication successful",
      user: {
        id: user.id,
        email: user.email,
      },
    });

    const cookieOpts = getSessionCookieOptions();
    response.cookies.set(cookieOpts.name, token, cookieOpts);

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
