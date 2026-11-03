import * as dotenv from "dotenv";
import pg from "pg";
import fs from "fs";
import { hash, Algorithm } from "@node-rs/argon2";
import readline from "readline";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const { Pool } = pg;

function promptPassword(query) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function createAdminUser() {
  console.log("==================================================================");
  console.log("  ProjectCall — Secure Administrator Provisioning CLI");
  console.log("==================================================================");

  const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL configuration.");
  }

  const pool = new Pool({ connectionString: databaseUrl, max: 1 });
  const client = await pool.connect();

  try {
    const email = (process.env.INITIAL_ADMIN_EMAIL || process.argv[2] || "admin@projectcall.uz").trim().toLowerCase();
    let password = process.env.INITIAL_ADMIN_PASSWORD || process.argv[3];
    const employeeCode = (process.env.INITIAL_ADMIN_CODE || process.argv[4] || "EMP-ADMIN-001").trim();
    const firstName = (process.env.INITIAL_ADMIN_FIRST_NAME || process.argv[5] || "Admin").trim();
    const lastName = (process.env.INITIAL_ADMIN_LAST_NAME || process.argv[6] || "System").trim();

    if (!password) {
      if (process.stdin.isTTY) {
        password = await promptPassword("Enter administrator password (min 8 chars): ");
      } else {
        // Read from piped stdin synchronously
        try {
          const piped = fs.readFileSync(0, "utf8").trim();
          if (piped) password = piped;
        } catch {
          // stdin not available
        }
      }
    }

    // 1. Password validation: Never use or print default hardcoded passwords
    if (!password || password.length < 8) {
      throw new Error(
        "Security Error: Administrator password must be at least 8 characters long."
      );
    }

    // 2. Find Admin role
    const roleRes = await client.query("SELECT id FROM roles WHERE name = 'admin';");
    if (roleRes.rows.length === 0) {
      throw new Error("Admin role not found. Please run 'npm run db:seed' first.");
    }
    const adminRoleId = roleRes.rows[0].id;

    // 3. Check if admin user already exists
    const existingUser = await client.query("SELECT id FROM users WHERE email = $1;", [email]);
    if (existingUser.rows.length > 0) {
      console.log(`Administrator account for '${email}' already exists (ID: ${existingUser.rows[0].id}).`);
      return;
    }

    // 4. Hash password using Argon2id with OWASP-recommended parameters
    console.log(`Hashing password with Argon2id for '${email}'...`);
    const passwordHash = await hash(password, {
      algorithm: Algorithm.Argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    // 5. Create User, Employee profile, and User-Role assignment atomically in a transaction
    await client.query("BEGIN;");

    const userRes = await client.query(
      `INSERT INTO users (email, password_hash, is_active, email_verified)
       VALUES ($1, $2, true, true)
       RETURNING id, email;`,
      [email, passwordHash]
    );
    const userId = userRes.rows[0].id;

    // Canonical role assignment via user_roles join table
    await client.query(
      `INSERT INTO user_roles (user_id, role_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, role_id) DO NOTHING;`,
      [userId, adminRoleId]
    );

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
    console.log("Role          : admin (via user_roles canonical table)");
    console.log("Password      : [CONFIGURED SECURELY - NOT DISPLAYED]");
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
