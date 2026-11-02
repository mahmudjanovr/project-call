import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { invalidateSession, SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function POST() {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await invalidateSession(token);
    cookieStore.delete(SESSION_COOKIE_NAME);
  }

  return NextResponse.json({ success: true, message: "Logged out successfully" });
}
