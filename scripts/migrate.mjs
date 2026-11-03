import * as dotenv from "dotenv";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import fs from "fs";
import path from "path";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const { Pool } = pg;

async function runProductionMigrations() {
  console.log("==================================================================");
  console.log("  ProjectCall — Safe Production Migration Runner (Neon PostgreSQL)");
  console.log("==================================================================");

  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("FATAL: Neither DATABASE_URL_UNPOOLED nor DATABASE_URL is defined.");
    process.exit(1);
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(connectionString);
  } catch (err) {
    console.error("FATAL: Failed to parse target database URL:", err.message);
    process.exit(1);
  }

  const hostname = parsedUrl.hostname;
  const database = parsedUrl.pathname.replace(/^\//, "");

  console.log(`Target Database Host : ${hostname}`);
  console.log(`Target Database Name : ${database}`);
  console.log(`Connection Mode      : ${process.env.DATABASE_URL_UNPOOLED ? "Direct (Unpooled)" : "Pooled"}`);
  console.log("------------------------------------------------------------------");

  // Verify target hostname is a valid Neon host
  const isNeonHost = hostname.endsWith(".neon.tech") || hostname.includes("neon.tech");
  if (!isNeonHost) {
    console.error(`FATAL SAFETY ABORT: Target host '${hostname}' is not a recognized Neon PostgreSQL host (*.neon.tech).`);
    process.exit(1);
  }

  if (database !== "neondb") {
    console.error(`FATAL SAFETY ABORT: Target database '${database}' does not match expected production database 'neondb'.`);
    process.exit(1);
  }

  // Pre-migration verification of migration files and journal
  const migrationsFolder = "./drizzle";
  const journalPath = path.join(migrationsFolder, "meta", "_journal.json");

  if (!fs.existsSync(journalPath)) {
    console.error(`FATAL: Migration journal not found at '${journalPath}'`);
    process.exit(1);
  }

  const journal = JSON.parse(fs.readFileSync(journalPath, "utf8"));
  console.log(`Found ${journal.entries.length} registered migrations in journal:`);
  for (const entry of journal.entries) {
    const sqlFile = path.join(migrationsFolder, `${entry.tag}.sql`);
    if (!fs.existsSync(sqlFile)) {
      console.error(`FATAL: Migration SQL file missing: ${sqlFile}`);
      process.exit(1);
    }
    console.log(`  - [Migration ${entry.idx}] ${entry.tag}.sql (registered)`);
  }
  console.log("------------------------------------------------------------------");

  // Connect using a single connection pool
  const pool = new Pool({
    connectionString,
    max: 1,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const client = await pool.connect();

    // Verify existing tables in database before migration
    const initialTablesCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('roles', 'users', 'permissions', 'user_roles', 'role_permissions', 'employees', 'sessions');
    `);

    if (initialTablesCheck.rows.length > 0) {
      console.error("WARNING: Found existing application tables:", initialTablesCheck.rows.map(r => r.table_name));
    } else {
      console.log("Pre-check confirmed: Public schema is clean of foundational application tables.");
    }

    client.release();

    const db = drizzle(pool);

    console.log("\nExecuting migrations via Drizzle ORM migrator...");
    const startTime = Date.now();

    await migrate(db, {
      migrationsFolder,
      migrationsTable: "__drizzle_migrations",
      migrationsSchema: "drizzle",
    });

    const elapsed = Date.now() - startTime;
    console.log(`\n✓ All migrations executed successfully in ${elapsed}ms!`);

    // Post-migration verification
    const postClient = await pool.connect();
    const migrationRecords = await postClient.query(`
      SELECT id, hash, created_at 
      FROM drizzle.__drizzle_migrations 
      ORDER BY id ASC;
    `);

    console.log(`\nConfirmed ${migrationRecords.rows.length} migration records in drizzle.__drizzle_migrations:`);
    for (const row of migrationRecords.rows) {
      console.log(`  - Record ${row.id}: hash=${row.hash.substring(0, 16)}..., created_at=${row.created_at}`);
    }

    postClient.release();
    console.log("==================================================================");
    console.log("  MIGRATION EXECUTION COMPLETE & VERIFIED");
    console.log("==================================================================");
  } catch (err) {
    console.error("\nFATAL MIGRATION FAILURE:");
    console.error(err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runProductionMigrations();
