import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";
import * as schema from "./schema";

/**
 * Server-only guard: Database modules must never be loaded or accessed in the browser.
 */
if (typeof window !== "undefined") {
  throw new Error("Security Violation: Database client cannot be accessed client-side.");
}

/**
 * Global pool reference to prevent connection exhaustion during Next.js hot reload in development.
 */
declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

/**
 * Validates and sanitizes the database URL retrieval.
 * Protects credentials by throwing safe descriptive errors without exposing connection strings.
 */
export function getValidatedDatabaseUrl(): string {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString || connectionString.trim() === "") {
    throw new Error(
      "Configuration error: DATABASE_URL environment variable is missing or empty. Please configure it in .env.local."
    );
  }

  if (
    !connectionString.startsWith("postgresql://") &&
    !connectionString.startsWith("postgres://")
  ) {
    throw new Error(
      "Configuration error: DATABASE_URL must start with 'postgresql://' or 'postgres://'."
    );
  }

  return connectionString;
}

/**
 * Creates or reuses a singleton pg.Pool instance.
 */
function getPool(): Pool {
  if (global._pgPool) {
    return global._pgPool;
  }

  const connectionString = getValidatedDatabaseUrl();

  const isProduction = process.env.NODE_ENV === "production";
  const sslModeRequired =
    process.env.DATABASE_SSL === "true" ||
    connectionString.includes("sslmode=require") ||
    connectionString.includes("sslmode=verify-full") ||
    connectionString.includes("sslmode=verify-ca");

  const poolConfig: PoolConfig = {
    connectionString,
    max: process.env.DB_MAX_CONNECTIONS
      ? parseInt(process.env.DB_MAX_CONNECTIONS, 10)
      : 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    // When SSL is required, strictly enforce certificate verification.
    // Never set rejectUnauthorized to false.
    ...(sslModeRequired ? { ssl: { rejectUnauthorized: true } } : {}),
  };

  const newPool = new Pool(poolConfig);

  // Prevent uncaught exceptions on idle pool clients
  newPool.on("error", (err) => {
    console.error("PostgreSQL pool idle client error:", err.message);
  });

  if (!isProduction) {
    global._pgPool = newPool;
  }

  return newPool;
}

export const pool = getPool();

/**
 * Typed Drizzle ORM database instance.
 * Server-only: Never import or access directly from React client components.
 */
export const db: NodePgDatabase<typeof schema> = drizzle(pool, { schema });

export type Database = typeof db;

/**
 * Gracefully terminates the connection pool. Useful during testing and shutdown.
 */
export async function closePool(): Promise<void> {
  if (global._pgPool) {
    await global._pgPool.end();
    global._pgPool = undefined;
  }
}
