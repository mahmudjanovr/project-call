import * as dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const { Pool } = pg;

async function setupCrmTables() {
  console.log("==================================================================");
  console.log("  ProjectCall — Safe CRM Schema Provisioning (Customers & Orders)");
  console.log("==================================================================");

  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("FATAL: DATABASE_URL is missing.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString, max: 1 });
  const client = await pool.connect();

  try {
    await client.query("BEGIN;");

    // 1. Create customers table
    console.log("1. Creating 'customers' table if not exists...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS "customers" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "name" varchar(255) NOT NULL,
        "phone" varchar(50) NOT NULL,
        "email" varchar(255),
        "company" varchar(255),
        "status" varchar(50) DEFAULT 'active' NOT NULL,
        "notes" text,
        "assigned_employee_id" uuid REFERENCES "employees"("id") ON DELETE SET NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
      );
    `);

    // Indexes for customers
    await client.query(`CREATE INDEX IF NOT EXISTS "customers_phone_idx" ON "customers" USING btree ("phone");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "customers_status_idx" ON "customers" USING btree ("status");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "customers_created_at_idx" ON "customers" USING btree ("created_at");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "customers_assigned_employee_id_idx" ON "customers" USING btree ("assigned_employee_id");`);

    // 2. Create orders table
    console.log("2. Creating 'orders' table if not exists...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS "orders" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "order_number" varchar(50) NOT NULL UNIQUE,
        "customer_id" uuid NOT NULL REFERENCES "customers"("id") ON DELETE RESTRICT,
        "employee_id" uuid REFERENCES "employees"("id") ON DELETE SET NULL,
        "amount" numeric(14, 2) DEFAULT '0' NOT NULL,
        "status" varchar(50) DEFAULT 'pending' NOT NULL,
        "notes" text,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
      );
    `);

    // Indexes for orders
    await client.query(`CREATE INDEX IF NOT EXISTS "orders_customer_id_idx" ON "orders" USING btree ("customer_id");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "orders_employee_id_idx" ON "orders" USING btree ("employee_id");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "orders_status_idx" ON "orders" USING btree ("status");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "orders_created_at_idx" ON "orders" USING btree ("created_at");`);

    await client.query("COMMIT;");
    console.log("✓ 'customers' and 'orders' tables and indexes successfully verified in Neon PostgreSQL.");
    console.log("==================================================================");
  } catch (err) {
    await client.query("ROLLBACK;");
    console.error("Setup failed, transaction rolled back:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

setupCrmTables();
