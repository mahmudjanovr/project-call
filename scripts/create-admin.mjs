import * as dotenv from "dotenv";
import pg from "pg";
import crypto from "crypto";
import { hash, Algorithm } from "@node-rs/argon2";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const { Pool } = pg;

async function createAdminUser() {
  console.log("==================================================================");
  console.log("  ProjectCall — Secure Administrator Provisioning CLI");
  console.log("==================================================================");

  const databaseUrl = process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL configuration.");
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const client = await pool.connect();

  try {
    const email = process.argv[2] || "admin@projectcall.uz";
    const password = process.argv[3] || crypto.randomBytes(12).toString("base64url") + "A1!";
    const employeeCode = process.argv[4] || "EMP-ADMIN-001";
    const firstName = process.argv[5] || "Admin";
    const lastName = process.argv[6] || "System";

    // 1. Find Admin role
    const roleRes = await client.query("SELECT id FROM roles WHERE name = 'admin';");
    if (roleRes.rows.length === 0) {
      throw new Error("Admin role not found. Please run 'npm run db:seed' first.");
    }
    const adminRoleId = roleRes.rows[0].id;

    // 2. Check if admin user already exists
    const existingUser = await client.query("SELECT id FROM users WHERE email = $1;", [email]);
    if (existingUser.rows.length > 0) {
      console.log(`Administrator account for '${email}' already exists (ID: ${existingUser.rows[0].id}).`);
      return;
    }

    // 3. Hash password using Argon2id
    console.log(`Hashing password with Argon2id for '${email}'...`);
    const passwordHash = await hash(password, {
      algorithm: Algorithm.Argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    // 4. Create User and Employee atomically in a transaction
    await client.query("BEGIN;");

    const userRes = await client.query(
      `INSERT INTO users (email, password_hash, role_id, is_active)
       VALUES ($1, $2, $3, true)
       RETURNING id, email, role_id;`,
      [email, passwordHash, adminRoleId]
    );
    const userId = userRes.rows[0].id;

    const empRes = await client.query(
      `INSERT INTO employees (user_id, employee_code, first_name, last_name, position, department, is_active)
       VALUES ($1, $2, $3, $4, 'Bosh Administrator', 'IT & Boshqaruv', true)
       RETURNING id, employee_code;`,
      [userId, employeeCode, firstName, lastName]
    );
    const employeeId = empRes.rows[0].id;

    await client.query("COMMIT;");

    console.log("✓ Administrator provisioned successfully in single transaction!");
    console.log("------------------------------------------------------------------");
    console.log(`Email         : ${email}`);
    console.log(`Employee Code : ${employeeCode}`);
    console.log(`Name          : ${firstName} ${lastName}`);
    console.log(`User ID       : ${userId}`);
    console.log(`Employee ID   : ${employeeId}`);
    if (!process.argv[3]) {
      console.log(`Generated Pwd : ${password}`);
      console.log("IMPORTANT: Save the generated password. It is NOT stored in plaintext.");
    } else {
      console.log("Password      : [SECURED - AS PROVIDED]");
    }
    console.log("==================================================================");
  } catch (err) {
    await client.query("ROLLBACK;");
    console.error("Failed to provision administrator:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

createAdminUser();
