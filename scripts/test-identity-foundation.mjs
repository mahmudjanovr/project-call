import * as dotenv from "dotenv";
import assert from "assert";
import fs from "fs";
import { hash, verify, Algorithm } from "@node-rs/argon2";
import {
  INITIAL_ROLES,
  INITIAL_PERMISSIONS,
  ROLE_PERMISSION_MAPPING,
} from "./seed-roles-permissions.mjs";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

async function runIdentityFoundationTestSuite() {
  console.log("==================================================================");
  console.log("  ProjectCall — Phase 1.5: Identity & Schema Validation Suite");
  console.log("==================================================================");

  let passedTests = 0;
  let totalTests = 0;

  function test(name, fn) {
    totalTests++;
    try {
      fn();
      console.log(`  ✓ [Test ${totalTests}] ${name}`);
      passedTests++;
    } catch (err) {
      console.error(`  ✗ [Test ${totalTests}] FAILED: ${name}`);
      console.error(`    Error: ${err.message}`);
      throw err;
    }
  }

  async function asyncTest(name, fn) {
    totalTests++;
    try {
      await fn();
      console.log(`  ✓ [Test ${totalTests}] ${name}`);
      passedTests++;
    } catch (err) {
      console.error(`  ✗ [Test ${totalTests}] FAILED: ${name}`);
      console.error(`    Error: ${err.message}`);
      throw err;
    }
  }

  console.log("\n--- Category 1: Schema Source Files & Migration Verification ---");

  test("All foundational schema files exist in src/db/schema/", () => {
    const requiredFiles = [
      "src/db/schema/index.ts",
      "src/db/schema/roles.ts",
      "src/db/schema/permissions.ts",
      "src/db/schema/user-roles.ts",
      "src/db/schema/role-permissions.ts",
      "src/db/schema/users.ts",
      "src/db/schema/employees.ts",
      "src/db/schema/sessions.ts",
    ];

    for (const f of requiredFiles) {
      assert(fs.existsSync(f), `Required schema file missing: ${f}`);
    }
  });

  test("Generated migration files exist and contain foundational DDL", () => {
    assert(fs.existsSync("drizzle/0000_known_preak.sql"), "0000 migration missing");
    assert(fs.existsSync("drizzle/0001_uneven_morg.sql"), "0001 migration missing");
    assert(fs.existsSync("drizzle/0002_dashing_mastermind.sql"), "0002 migration missing");
    assert(fs.existsSync("drizzle/0003_sour_nightmare.sql"), "0003 migration missing");
    assert(fs.existsSync("drizzle/0004_freezing_paladin.sql"), "0004 migration missing");

    const m2 = fs.readFileSync("drizzle/0002_dashing_mastermind.sql", "utf8");
    assert(m2.includes('CREATE TABLE "user_roles"'), "0002 must create user_roles table");
    assert(m2.includes('ALTER TABLE "permissions" ADD COLUMN "key" varchar(100);'), "0002 must add key column as nullable first");
    assert(m2.includes('ALTER TABLE "users" ADD COLUMN "email_verified"'), "0002 must add email_verified to users");
    assert(m2.includes('REFERENCES "public"."users"("id") ON DELETE cascade'), "0002 must set cascade delete for user_roles");
    assert(m2.includes('REFERENCES "public"."roles"("id") ON DELETE cascade'), "0002 must set cascade delete for user_roles");

    const m3 = fs.readFileSync("drizzle/0003_sour_nightmare.sql", "utf8");
    assert(m3.includes('ALTER TABLE "users" DROP COLUMN "role_id"'), "0003 must drop role_id from users");
    assert(m3.includes('DROP CONSTRAINT "users_role_id_roles_id_fk"'), "0003 must drop role_id foreign key constraint");
  });

  test("Phase 1.5.2: Migration 0002 implements safe nullable addition, deterministic backfill, and PL/pgSQL validation", () => {
    const m2 = fs.readFileSync("drizzle/0002_dashing_mastermind.sql", "utf8");

    // 1. Column added as nullable
    const addColIdx = m2.indexOf('ALTER TABLE "permissions" ADD COLUMN "key" varchar(100);');
    assert(addColIdx !== -1, "0002 must add key column as nullable without immediate NOT NULL");

    // 2. Deterministic data backfill
    const backfillCodeIdx = m2.indexOf('SET "key" = "code"');
    const backfillFallbackIdx = m2.indexOf("'perm.' || \"id\"::text");
    assert(backfillCodeIdx > addColIdx, "Backfill from code must occur after adding nullable key column");
    assert(backfillFallbackIdx > backfillCodeIdx, "Fallback backfill must occur after code backfill");

    // 3. Validation block
    const validationIdx = m2.indexOf("DO $$");
    assert(validationIdx > backfillFallbackIdx, "PL/pgSQL validation must run after backfill");
    assert(m2.includes("RAISE EXCEPTION 'Migration 0002 hardening failed: permissions.key contains NULL values'"), "Validation block must check for NULL keys");
    assert(m2.includes("RAISE EXCEPTION 'Migration 0002 hardening failed: duplicate keys detected in permissions table'"), "Validation block must check for duplicate keys");

    // 4. Deferred NOT NULL and UNIQUE constraint
    const setNotNullIdx = m2.indexOf('ALTER TABLE "permissions" ALTER COLUMN "key" SET NOT NULL;');
    const addUniqueIdx = m2.indexOf('ALTER TABLE "permissions" ADD CONSTRAINT "permissions_key_unique" UNIQUE("key");');
    assert(setNotNullIdx > validationIdx, "SET NOT NULL must only be applied after validation block");
    assert(addUniqueIdx > validationIdx, "UNIQUE constraint must only be applied after validation block");
  });

  test("Phase 1.5.2: Migration 0003 backfills user roles into user_roles before dropping users.role_id", () => {
    const m3 = fs.readFileSync("drizzle/0003_sour_nightmare.sql", "utf8");

    const backfillIdx = m3.indexOf('INSERT INTO "user_roles" ("user_id", "role_id", "assigned_at")');
    const selectIdx = m3.indexOf('SELECT "id", "role_id", COALESCE("created_at", now())');
    const conflictIdx = m3.indexOf('ON CONFLICT ("user_id", "role_id") DO NOTHING;');
    const dropColIdx = m3.indexOf('ALTER TABLE "users" DROP COLUMN "role_id";');

    assert(backfillIdx !== -1, "0003 must include INSERT INTO user_roles");
    assert(selectIdx !== -1, "0003 must select role assignments from users table");
    assert(conflictIdx !== -1, "0003 must use ON CONFLICT DO NOTHING for idempotent role backfill");
    assert(backfillIdx < dropColIdx, "Role assignment backfill must execute BEFORE dropping users.role_id");
  });

  test("Phase 1.5.2: Redundant indexes removed while critical query & FK indexes are retained", () => {
    const permSchema = fs.readFileSync("src/db/schema/permissions.ts", "utf8");
    const sessionSchema = fs.readFileSync("src/db/schema/sessions.ts", "utf8");
    const userRolesSchema = fs.readFileSync("src/db/schema/user-roles.ts", "utf8");
    const rolePermsSchema = fs.readFileSync("src/db/schema/role-permissions.ts", "utf8");
    const employeeSchema = fs.readFileSync("src/db/schema/employees.ts", "utf8");

    // Assert Redundant Indexes are REMOVED from TypeScript schema definitions
    assert(!permSchema.includes("permissions_key_idx"), "permissions_key_idx is redundant with UNIQUE(key) and must be removed");
    assert(!sessionSchema.includes("sessions_token_idx"), "sessions_token_idx is redundant with UNIQUE(token) and must be removed");
    assert(!userRolesSchema.includes("user_roles_user_id_idx"), "user_roles_user_id_idx is redundant with PK(user_id, role_id) leading column and must be removed");
    assert(!rolePermsSchema.includes("role_permissions_role_id_idx"), "role_permissions_role_id_idx is redundant with PK(role_id, permission_id) leading column and must be removed");
    assert(!employeeSchema.includes("employees_user_id_idx"), "employees_user_id_idx is redundant with UNIQUE(user_id) and must be removed");

    // Assert Genuinely Useful Indexes are RETAINED in TypeScript schema definitions
    assert(permSchema.includes("permissions_module_idx"), "permissions_module_idx must be retained for module filtering");
    assert(userRolesSchema.includes("user_roles_role_id_idx"), "user_roles_role_id_idx must be retained for role lookups and FK cascades");
    assert(rolePermsSchema.includes("role_permissions_permission_id_idx"), "role_permissions_permission_id_idx must be retained for permission lookups and FK cascades");
    assert(sessionSchema.includes("sessions_user_id_idx"), "sessions_user_id_idx must be retained for user sessions lookup");
    assert(sessionSchema.includes("sessions_expires_at_idx"), "sessions_expires_at_idx must be retained for pruning expired sessions");
    assert(employeeSchema.includes("employees_is_active_idx"), "employees_is_active_idx must be retained for status filtering");

    // Assert Migration 0004 drops the 5 redundant indexes
    const m4 = fs.readFileSync("drizzle/0004_freezing_paladin.sql", "utf8");
    assert(m4.includes('DROP INDEX "permissions_key_idx";'), "0004 must drop redundant permissions_key_idx");
    assert(m4.includes('DROP INDEX "role_permissions_role_id_idx";'), "0004 must drop redundant role_permissions_role_id_idx");
    assert(m4.includes('DROP INDEX "user_roles_user_id_idx";'), "0004 must drop redundant user_roles_user_id_idx");
    assert(m4.includes('DROP INDEX "employees_user_id_idx";'), "0004 must drop redundant employees_user_id_idx");
    assert(m4.includes('DROP INDEX "sessions_token_idx";'), "0004 must drop redundant sessions_token_idx");

    // Assert Journal consistency
    const journal = JSON.parse(fs.readFileSync("drizzle/meta/_journal.json", "utf8"));
    assert.strictEqual(journal.entries.length, 5, "Journal must contain exactly 5 sequential migrations");
    assert.strictEqual(journal.entries[4].tag, "0004_freezing_paladin", "Journal entry 4 must be 0004_freezing_paladin");
  });

  test("Canonical role assignment pattern is enforced: user_roles is the single source of truth", () => {
    const userCols = fs.readFileSync("src/db/schema/users.ts", "utf8");
    assert(!userCols.includes('roleId: uuid("role_id")'), "users table must NOT retain redundant role_id column");
    assert(userCols.includes('userRoles: many(userRoles)'), "users must link to userRoles relation");
  });

  console.log("\n--- Category 2: Role & Permission Matrix Integrity ---");

  test("All three primary system roles are defined", () => {
    const roleNames = INITIAL_ROLES.map((r) => r.name);
    assert(roleNames.includes("admin"), "Admin role must be defined");
    assert(roleNames.includes("manager"), "Manager role must be defined");
    assert(roleNames.includes("operator"), "Operator role must be defined");
    assert.strictEqual(roleNames.length, 3, "Exactly 3 foundational roles defined");
  });

  test("Granular dot-notation permission keys defined per specifications", () => {
    const requiredKeys = [
      "users.read",
      "users.create",
      "users.update",
      "users.delete",
      "employees.read",
      "employees.create",
      "employees.update",
      "employees.delete",
      "customers.read",
      "customers.create",
      "customers.update",
      "orders.read",
      "orders.create",
      "orders.update",
      "reports.read",
      "settings.manage",
    ];

    const definedKeys = new Set(INITIAL_PERMISSIONS.map((p) => p.key));
    for (const reqKey of requiredKeys) {
      assert(definedKeys.has(reqKey), `Missing required permission key: '${reqKey}'`);
    }
  });

  test("Default permission mappings enforce strict segregation of duties", () => {
    const adminPerms = new Set(ROLE_PERMISSION_MAPPING.admin);
    const managerPerms = new Set(ROLE_PERMISSION_MAPPING.manager);
    const operatorPerms = new Set(ROLE_PERMISSION_MAPPING.operator);

    // Operator Segregation: Operator must NOT have administrative powers
    assert(!operatorPerms.has("users.create"), "Operator must NOT create users");
    assert(!operatorPerms.has("users.delete"), "Operator must NOT delete users");
    assert(!operatorPerms.has("employees.create"), "Operator must NOT create employees");
    assert(!operatorPerms.has("settings.manage"), "Operator must NOT manage settings");
    assert(!operatorPerms.has("reports.read"), "Operator must NOT read reports");
    assert(!operatorPerms.has("orders.approve"), "Operator must NOT approve orders");
    assert(!operatorPerms.has("orders.reject"), "Operator must NOT reject orders");

    // Operator Capabilities: Operator CAN manage customers and submit orders
    assert(operatorPerms.has("customers.read"), "Operator must read customers");
    assert(operatorPerms.has("customers.create"), "Operator must create customers");
    assert(operatorPerms.has("orders.create"), "Operator must create orders");
    assert(operatorPerms.has("orders.submit"), "Operator must submit orders");

    // Manager Segregation: Manager must NOT manage user accounts or system settings
    assert(!managerPerms.has("users.create"), "Manager must NOT create users");
    assert(!managerPerms.has("users.delete"), "Manager must NOT delete users");
    assert(!managerPerms.has("settings.manage"), "Manager must NOT manage system settings");

    // Manager Capabilities: Manager CAN view employees, approve/reject orders, view reports
    assert(managerPerms.has("employees.read"), "Manager must read employees");
    assert(managerPerms.has("orders.review"), "Manager must review orders");
    assert(managerPerms.has("orders.approve"), "Manager must approve orders");
    assert(managerPerms.has("orders.reject"), "Manager must reject orders");
    assert(managerPerms.has("reports.read"), "Manager must read reports");

    // Admin Capabilities: Admin has comprehensive permissions
    assert(adminPerms.has("users.create"), "Admin must create users");
    assert(adminPerms.has("employees.create"), "Admin must create employees");
    assert(adminPerms.has("settings.manage"), "Admin must manage settings");
    assert(adminPerms.has("audit.read"), "Admin must read audit logs");
  });

  test("All role mappings reference valid defined permissions (referential integrity)", () => {
    const definedKeys = new Set(INITIAL_PERMISSIONS.map((p) => p.key));
    for (const [roleName, mappedKeys] of Object.entries(ROLE_PERMISSION_MAPPING)) {
      for (const key of mappedKeys) {
        assert(definedKeys.has(key), `Role '${roleName}' references unknown permission key '${key}'`);
      }
    }
  });

  console.log("\n--- Category 3: Argon2id Password Hashing Security ---");

  await asyncTest("Argon2id produces OWASP-compliant hash ($argon2id$v=19$)", async () => {
    const testPassword = "ComplexPassword123!@#";
    const hashed = await hash(testPassword, {
      algorithm: Algorithm.Argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    assert(hashed.startsWith("$argon2id$v=19$"), "Hash must begin with $argon2id$v=19$");
    const isValid = await verify(hashed, testPassword);
    const isInvalid = await verify(hashed, "WrongPassword");

    assert.strictEqual(isValid, true, "Valid password must verify successfully");
    assert.strictEqual(isInvalid, false, "Invalid password must be rejected");
  });

  console.log("\n--- Category 4: Seed Idempotency Logic ---");

  test("Seed lists have no duplicate roles or permissions", () => {
    const roleNames = INITIAL_ROLES.map((r) => r.name);
    const uniqueRoleNames = new Set(roleNames);
    assert.strictEqual(roleNames.length, uniqueRoleNames.size, "Role names must be globally unique");

    const permKeys = INITIAL_PERMISSIONS.map((p) => p.key);
    const uniquePermKeys = new Set(permKeys);
    assert.strictEqual(permKeys.length, uniquePermKeys.size, "Permission keys must be globally unique");
  });

  console.log("\n==================================================================");
  console.log(`  PASSED: All ${passedTests} / ${totalTests} identity & schema validation tests passed!`);
  console.log("==================================================================");
}

runIdentityFoundationTestSuite().catch((err) => {
  console.error("Test Suite Failed:", err);
  process.exit(1);
});
