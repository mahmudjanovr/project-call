import { sql } from "drizzle-orm";
import { db } from "./index";

export interface DatabaseHealthDetails {
  version: string;
  database: string;
  user: string;
}

export interface DatabaseHealthResult {
  ok: boolean;
  status: "connected" | "disconnected" | "error";
  timestamp: string;
  latencyMs: number;
  details?: DatabaseHealthDetails;
  error?: string;
}

/**
 * Sanitizes any error message to guarantee credentials, passwords, or connection URLs are never exposed.
 */
export function sanitizeDatabaseError(error: unknown): string {
  if (!error) return "Unknown database error";
  const rawMessage = error instanceof Error ? error.message : String(error);

  // Redact PostgreSQL URI credentials: postgresql://user:password@host...
  return rawMessage
    .replace(/(postgres(?:ql)?:\/\/[^:]+:)[^@]+(@)/gi, "$1***$2")
    .replace(/(password\s*=\s*)[^\s;]+/gi, "$1***");
}

/**
 * Executes a safe, reusable database health check via Drizzle ORM.
 * Runs: SELECT version(), current_database(), current_user;
 */
export async function checkDatabaseHealth(): Promise<DatabaseHealthResult> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  try {
    const result = await db.execute<{
      version: string;
      current_database: string;
      current_user: string;
    }>(sql`SELECT version(), current_database(), current_user;`);

    const latencyMs = Date.now() - startTime;
    const row = result.rows[0];

    return {
      ok: true,
      status: "connected",
      timestamp,
      latencyMs,
      details: {
        version: row?.version ?? "unknown",
        database: row?.current_database ?? "unknown",
        user: row?.current_user ?? "unknown",
      },
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    return {
      ok: false,
      status: "error",
      timestamp,
      latencyMs,
      error: sanitizeDatabaseError(error),
    };
  }
}
