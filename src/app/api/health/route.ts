import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "@/db/health";

export const dynamic = "force-dynamic";

export async function GET() {
  const health = await checkDatabaseHealth();

  if (health.ok) {
    return NextResponse.json(
      {
        status: "ok",
        database: health,
      },
      { status: 200 }
    );
  }

  return NextResponse.json(
    {
      status: "degraded",
      database: health,
    },
    { status: 503 }
  );
}
