import { NextResponse } from "next/server";
import { getCurrentAuth } from "@/lib/auth/rbac";

export async function GET() {
  const auth = await getCurrentAuth();

  if (!auth) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    user: auth.user,
    employee: auth.employee,
    role: {
      name: auth.role.name,
      displayName: auth.role.displayName,
    },
    permissions: auth.permissions,
  });
}
