import * as dotenv from "dotenv";
import pg from "pg";
import crypto from "crypto";
import fs from "fs";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const { Pool } = pg;

async function setupDatabaseSecurity() {
  console.log("==================================================================");
  console.log("  ProjectCall — Phase 1.6: Database Least-Privilege Setup");
  console.log("==================================================================");

  const adminUrl = process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL;
  if (!adminUrl) {
    throw new Error("Missing admin DATABASE_URL for setup.");
  }

  const adminPool = new Pool({ connectionString: adminUrl });
  const adminClient = await adminPool.connect();

  try {
    // 1. Audit current connection privileges
    console.log("1. Auditing current database connection privileges...");
    const auditRes = await adminClient.query(`
      SELECT 
        rolname, 
        rolsuper, 
        rolinherit, 
        rolcreaterole, 
        rolcreatedb, 
        rolcanlogin 
      FROM pg_roles 
      WHERE rolname = current_user;
    `);
    const currentAdminUser = auditRes.rows[0];
    console.log(`   Connected as user : ${currentAdminUser.rolname}`);
    console.log(`   Superuser status  : ${currentAdminUser.rolsuper ? "YES (Excessive for runtime)" : "NO"}`);
    console.log(`   Create DB status  : ${currentAdminUser.rolcreatedb ? "YES" : "NO"}`);

    // 2. Generate or retrieve secure password for application role
    const appRoleName = "projectcall_app";
    // Generate secure random password
    const appPassword = crypto.randomBytes(24).toString("base64url");

    console.log(`\n2. Provisioning dedicated application role: '${appRoleName}'...`);
    await adminClient.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${appRoleName}') THEN
          CREATE ROLE ${appRoleName} WITH LOGIN PASSWORD '${appPassword}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;
        ELSE
          ALTER ROLE ${appRoleName} WITH LOGIN PASSWORD '${appPassword}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;
        END IF;
      END
      $$;
    `);
    console.log(`   ✓ Role '${appRoleName}' created/updated with NOSUPERUSER, NOCREATEDB, NOCREATEROLE.`);

    // 3. Grant least-privilege DML access only (no DDL)
    console.log("\n3. Configuring schema privileges...");
    await adminClient.query(`GRANT CONNECT ON DATABASE projectcall TO ${appRoleName};`);
    await adminClient.query(`GRANT USAGE ON SCHEMA public TO ${appRoleName};`);
    await adminClient.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${appRoleName};`);
    await adminClient.query(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${appRoleName};`);

    // Ensure future tables created by migrations also grant DML to projectcall_app
    await adminClient.query(`
      ALTER DEFAULT PRIVILEGES IN SCHEMA public 
      GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${appRoleName};
    `);
    await adminClient.query(`
      ALTER DEFAULT PRIVILEGES IN SCHEMA public 
      GRANT USAGE, SELECT ON SEQUENCES TO ${appRoleName};
    `);
    console.log(`   ✓ DML permissions granted: SELECT, INSERT, UPDATE, DELETE on public schema.`);
    console.log(`   ✓ Default privileges configured for future tables.`);

    // 4. Construct least-privilege connection string
    // Parse existing URL to maintain host, port, db name, and schema
    const adminUrlObj = new URL(adminUrl);
    adminUrlObj.username = appRoleName;
    adminUrlObj.password = appPassword;
    const appDatabaseUrl = adminUrlObj.toString();

    // 5. Update .env.local securely
    console.log("\n4. Updating environment configurations securely...");
    let envContent = "";
    if (fs.existsSync(".env.local")) {
      envContent = fs.readFileSync(".env.local", "utf8");
    }

    // Preserve the admin URL as MIGRATION_DATABASE_URL
    const parsedEnv = dotenv.parse(envContent);
    const originalAdminUrl = parsedEnv.MIGRATION_DATABASE_URL || parsedEnv.DATABASE_URL || adminUrl;

    // Rewrite .env.local with separation of concerns
    const envLines = [];
    const handledKeys = new Set();

    for (const line of envContent.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=/);
      if (match) {
        const key = match[1];
        handledKeys.add(key);
        if (key === "DATABASE_URL") {
          envLines.push(`DATABASE_URL="${appDatabaseUrl}"`);
        } else if (key === "MIGRATION_DATABASE_URL") {
          envLines.push(`MIGRATION_DATABASE_URL="${originalAdminUrl}"`);
        } else if (key === "APP_DATABASE_URL") {
          envLines.push(`APP_DATABASE_URL="${appDatabaseUrl}"`);
        } else {
          envLines.push(line);
        }
      } else {
        envLines.push(line);
      }
    }

    if (!handledKeys.has("MIGRATION_DATABASE_URL")) {
      envLines.push(`MIGRATION_DATABASE_URL="${originalAdminUrl}"`);
    }
    if (!handledKeys.has("APP_DATABASE_URL")) {
      envLines.push(`APP_DATABASE_URL="${appDatabaseUrl}"`);
    }

    fs.writeFileSync(".env.local", envLines.join("\n"));
    console.log("   ✓ .env.local updated: DATABASE_URL points to least-privilege role.");
    console.log("   ✓ MIGRATION_DATABASE_URL preserved for schema migrations.");

    // 6. Test least-privilege enforcement
    console.log("\n5. Testing least-privilege enforcement with 'projectcall_app'...");
    const appPool = new Pool({ connectionString: appDatabaseUrl });
    const appClient = await appPool.connect();

    try {
      // Test DML (SELECT should succeed)
      const testSelect = await appClient.query("SELECT COUNT(*) FROM roles;");
      console.log(`   ✓ DML test passed: SELECT roles returned ${testSelect.rows[0].count} roles.`);

      // Test DDL (CREATE TABLE should be REJECTED)
      let ddlBlocked = false;
      try {
        await appClient.query("CREATE TABLE test_security_leak (id int);");
      } catch (err) {
        if (err.code === "42501") { // permission_denied
          ddlBlocked = true;
        }
      }

      if (!ddlBlocked) {
        throw new Error("Security Alert: Application role was able to execute DDL (CREATE TABLE)!");
      }
      console.log("   ✓ DDL test passed: CREATE TABLE was correctly REJECTED with 42501 permission_denied.");
    } finally {
      appClient.release();
      await appPool.end();
    }

    console.log("\n==================================================================");
    console.log("  DATABASE LEAST-PRIVILEGE ROLE SETUP COMPLETED SUCCESSFULLY");
    console.log("==================================================================");
  } finally {
    adminClient.release();
    await adminPool.end();
  }
}

setupDatabaseSecurity().catch((err) => {
  console.error("Database security setup failed:", err.message);
  process.exit(1);
});
