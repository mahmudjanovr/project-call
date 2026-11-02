import * as dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import pg from "pg";

const { Pool } = pg;

// 1. Load environment variables from .env.local and .env
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

/**
 * Sanitizes URLs to prevent credentials from ever leaking in logs or console output.
 */
function sanitizeConnectionString(url) {
  if (!url) return "<EMPTY>";
  return url.replace(/(postgres(?:ql)?:\/\/[^:]+:)[^@]+(@)/gi, "$1***$2");
}

/**
 * Sanitizes error messages to protect database secrets.
 */
function sanitizeErrorMessage(error) {
  if (!error) return "Unknown error";
  const msg = error instanceof Error ? error.message : String(error);
  return msg
    .replace(/(postgres(?:ql)?:\/\/[^:]+:)[^@]+(@)/gi, "$1***$2")
    .replace(/(password\s*=\s*)[^\s;]+/gi, "$1***");
}

async function runDatabaseConnectivityAudit() {
  console.log("==================================================================");
  console.log("  ProjectCall — Phase 1.4: Real PostgreSQL Connection Audit");
  console.log("==================================================================");
  console.log(`Environment     : ${process.env.NODE_ENV || "development"}`);
  console.log(`Node.js Runtime : ${process.version}`);
  console.log(`Target DB URL   : ${sanitizeConnectionString(process.env.DATABASE_URL)}`);
  console.log(`Max Connections : ${process.env.DB_MAX_CONNECTIONS || "10 (default)"}`);
  console.log("------------------------------------------------------------------");

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || databaseUrl.trim() === "") {
    console.error("FATAL: DATABASE_URL is missing. Please configure .env.local.");
    process.exit(1);
  }

  const sslRequired =
    process.env.DATABASE_SSL === "true" ||
    databaseUrl.includes("sslmode=require") ||
    databaseUrl.includes("sslmode=verify-full") ||
    databaseUrl.includes("sslmode=verify-ca");

  const pool = new Pool({
    connectionString: databaseUrl,
    max: process.env.DB_MAX_CONNECTIONS ? parseInt(process.env.DB_MAX_CONNECTIONS, 10) : 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ...(sslRequired ? { ssl: { rejectUnauthorized: true } } : {}),
  });

  pool.on("error", (err) => {
    console.error("Unexpected error on idle PostgreSQL client:", sanitizeErrorMessage(err));
  });

  const db = drizzle(pool);

  try {
    // ----------------------------------------------------------------
    // Step 1: Direct pg.Pool SQL Execution
    // ----------------------------------------------------------------
    console.log("Step 1: Direct pg.Pool Query Execution...");
    const client = await pool.connect();
    let rawRow;
    try {
      const startPg = Date.now();
      const rawResult = await client.query(
        "SELECT version(), current_database(), current_user;"
      );
      const pgLatency = Date.now() - startPg;
      rawRow = rawResult.rows[0];

      console.log(`  ✓ Query succeeded in ${pgLatency}ms`);
      console.log(`  ✓ Version          : ${rawRow.version}`);
      console.log(`  ✓ Current Database : ${rawRow.current_database}`);
      console.log(`  ✓ Current User     : ${rawRow.current_user}`);
    } finally {
      client.release();
    }

    console.log("------------------------------------------------------------------");

    // ----------------------------------------------------------------
    // Step 2: Drizzle ORM SQL Execution
    // ----------------------------------------------------------------
    console.log("Step 2: Drizzle ORM Query Execution...");
    const startDrizzle = Date.now();
    const drizzleResult = await db.execute(
      sql`SELECT version(), current_database(), current_user;`
    );
    const drizzleLatency = Date.now() - startDrizzle;
    const drizzleRow = drizzleResult.rows[0];

    console.log(`  ✓ Drizzle query succeeded in ${drizzleLatency}ms`);
    console.log(`  ✓ Version          : ${drizzleRow.version}`);
    console.log(`  ✓ Current Database : ${drizzleRow.current_database}`);
    console.log(`  ✓ Current User     : ${drizzleRow.current_user}`);

    console.log("------------------------------------------------------------------");

    // ----------------------------------------------------------------
    // Step 3: Consistency & Verification Checks
    // ----------------------------------------------------------------
    console.log("Step 3: Verification Checks...");
    if (
      rawRow.current_database === drizzleRow.current_database &&
      rawRow.current_user === drizzleRow.current_user
    ) {
      console.log("  ✓ Raw pg.Pool and Drizzle ORM query results match identically.");
    } else {
      throw new Error("Mismatch detected between pg.Pool and Drizzle query results.");
    }

    console.log("==================================================================");
    console.log("  STATUS: REAL POSTGRESQL CONNECTION VERIFIED SUCCESSFULLY");
    console.log("==================================================================");
  } catch (err) {
    console.error("==================================================================");
    console.error("  CONNECTION TEST FAILED");
    console.error("==================================================================");
    console.error("Safe Error Details:", sanitizeErrorMessage(err));
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

runDatabaseConnectivityAudit();
