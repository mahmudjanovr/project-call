import * as dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function verifyPostgreSqlSchema() {
  console.log("==================================================================");
  console.log("  ProjectCall — PostgreSQL Schema & Constraints Verification");
  console.log("==================================================================");

  try {
    // 1. Tables
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log("\n[1] Public Tables:");
    tablesRes.rows.forEach(r => console.log(`  - ${r.table_name}`));

    // 2. Constraints (Primary Keys, Foreign Keys, Unique)
    const constraintsRes = await pool.query(`
      SELECT 
        tc.table_name,
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      LEFT JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
        AND tc.table_schema = ccu.table_schema
      LEFT JOIN information_schema.referential_constraints rc
        ON tc.constraint_name = rc.constraint_name
        AND tc.table_schema = rc.constraint_schema
      WHERE tc.table_schema = 'public'
      ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name, kcu.ordinal_position;
    `);

    console.log("\n[2] Constraints:");
    constraintsRes.rows.forEach(r => {
      const fkTarget = r.foreign_table_name ? ` -> ${r.foreign_table_name}(${r.foreign_column_name}) [ON DELETE ${r.delete_rule}]` : "";
      console.log(`  - [${r.table_name}] ${r.constraint_type}: ${r.constraint_name} (${r.column_name})${fkTarget}`);
    });

    // 3. Indexes
    const indexesRes = await pool.query(`
      SELECT
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `);

    console.log("\n[3] Indexes:");
    indexesRes.rows.forEach(r => {
      console.log(`  - [${r.tablename}] ${r.indexname} => ${r.indexdef}`);
    });

    console.log("\n==================================================================");
    console.log("  PostgreSQL Schema Inspection Completed Successfully");
    console.log("==================================================================");
  } catch (err) {
    console.error("Schema inspection error:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

verifyPostgreSqlSchema();
