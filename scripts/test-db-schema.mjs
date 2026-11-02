import * as dotenv from "dotenv";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { relations, eq } from "drizzle-orm";
import { pgTable, uuid, varchar, text, boolean, timestamp, primaryKey, index } from "drizzle-orm/pg-core";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const { Pool } = pg;

// -----------------------------------------------------------------------------
// Drizzle Schema Definitions for Relational Query Testing
// -----------------------------------------------------------------------------
const roles = pgTable("roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
});

const permissions = pgTable("permissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  module: varchar("module", { length: 50 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
});

const rolePermissions = pgTable("role_permissions", {
  roleId: uuid("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  permissionId: uuid("permission_id").notNull().references(() => permissions.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
}, (table) => [
  primaryKey({ columns: [table.roleId, table.permissionId] }),
]);

const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  roleId: uuid("role_id").notNull().references(() => roles.id, { onDelete: "restrict" }),
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true, mode: "date" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
});

const employees = pgTable("employees", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "restrict" }),
  employeeCode: varchar("employee_code", { length: 50 }).notNull().unique(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  position: varchar("position", { length: 100 }),
  department: varchar("department", { length: 100 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
});

const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
  rolePermissions: many(rolePermissions),
}));

const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, { fields: [rolePermissions.roleId], references: [roles.id] }),
  permission: one(permissions, { fields: [rolePermissions.permissionId], references: [permissions.id] }),
}));

const usersRelations = relations(users, ({ one }) => ({
  role: one(roles, { fields: [users.roleId], references: [roles.id] }),
  employee: one(employees, { fields: [users.id], references: [employees.userId] }),
}));

const employeesRelations = relations(employees, ({ one }) => ({
  user: one(users, { fields: [employees.userId], references: [users.id] }),
}));

const dSchema = {
  roles,
  permissions,
  rolePermissions,
  users,
  employees,
  rolesRelations,
  permissionsRelations,
  rolePermissionsRelations,
  usersRelations,
  employeesRelations,
};

async function runDatabaseSchemaTests() {
  console.log("==================================================================");
  console.log("  ProjectCall — Phase 1.5: Database Schema & RBAC Test Suite");
  console.log("==================================================================");

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema: dSchema });
  const client = await pool.connect();

  let testRoleId = null;
  let testPermId1 = null;
  let testPermId2 = null;
  let testUserId = null;
  let testEmployeeId = null;

  try {
    // -------------------------------------------------------------------------
    // Test 1: Insert a test role
    // -------------------------------------------------------------------------
    console.log("\n[Test 1] Insert a test role...");
    const roleInsertRes = await client.query(`
      INSERT INTO roles (name, display_name, description)
      VALUES ('test_auditor', 'Audit Tester', 'Temporary test role for verification')
      RETURNING id, name;
    `);
    testRoleId = roleInsertRes.rows[0].id;
    console.log(`  ✓ Test role created: ID ${testRoleId}`);

    // -------------------------------------------------------------------------
    // Test 2: Insert test permissions
    // -------------------------------------------------------------------------
    console.log("\n[Test 2] Insert test permissions...");
    const perm1Res = await client.query(`
      INSERT INTO permissions (code, name, module, description)
      VALUES ('test:audit:export', 'Test Audit Export', 'audit', 'Export logs test')
      RETURNING id, code;
    `);
    testPermId1 = perm1Res.rows[0].id;

    const perm2Res = await client.query(`
      INSERT INTO permissions (code, name, module, description)
      VALUES ('test:audit:archive', 'Test Audit Archive', 'audit', 'Archive logs test')
      RETURNING id, code;
    `);
    testPermId2 = perm2Res.rows[0].id;
    console.log(`  ✓ Test permissions created: ${testPermId1}, ${testPermId2}`);

    // -------------------------------------------------------------------------
    // Test 3: Associate permissions with test role
    // -------------------------------------------------------------------------
    console.log("\n[Test 3] Associate permissions with test role (role_permissions)...");
    await client.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      VALUES ($1, $2), ($1, $3);
    `, [testRoleId, testPermId1, testPermId2]);

    const mappedRes = await client.query(`
      SELECT p.code, p.name 
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = $1
      ORDER BY p.code;
    `, [testRoleId]);

    if (mappedRes.rows.length !== 2) {
      throw new Error(`Expected 2 permissions associated, got ${mappedRes.rows.length}`);
    }
    console.log(`  ✓ Associated ${mappedRes.rows.length} permissions successfully: ${mappedRes.rows.map(r => r.code).join(", ")}`);

    // -------------------------------------------------------------------------
    // Test 4: Create a user account
    // -------------------------------------------------------------------------
    console.log("\n[Test 4] Create a user account (system account with hashed password)...");
    const userInsertRes = await client.query(`
      INSERT INTO users (email, password_hash, role_id, is_active)
      VALUES ('test.auditor@projectcall.uz', '$argon2id$v=19$m=65536,t=3,p=4$dummy_secure_hash', $1, true)
      RETURNING id, email, role_id, is_active, created_at;
    `, [testRoleId]);
    testUserId = userInsertRes.rows[0].id;
    console.log(`  ✓ User created: ID ${testUserId}, Email: ${userInsertRes.rows[0].email}`);

    // -------------------------------------------------------------------------
    // Test 5: Create corresponding employee profile (1-to-1 relationship)
    // -------------------------------------------------------------------------
    console.log("\n[Test 5] Create corresponding employee profile (1-to-1 relationship)...");
    const empInsertRes = await client.query(`
      INSERT INTO employees (user_id, employee_code, first_name, last_name, phone, position, department, is_active)
      VALUES ($1, 'EMP-TEST-001', 'Sherzod', 'Testov', '+998901234567', 'Test Auditor', 'Auditing', true)
      RETURNING id, user_id, employee_code, first_name, last_name;
    `, [testUserId]);
    testEmployeeId = empInsertRes.rows[0].id;
    console.log(`  ✓ Employee created: ID ${testEmployeeId}, Code: ${empInsertRes.rows[0].employee_code}, UserID: ${empInsertRes.rows[0].user_id}`);

    // -------------------------------------------------------------------------
    // Test 6: Verify foreign key relationships
    // -------------------------------------------------------------------------
    console.log("\n[Test 6] Verify foreign key relationships...");
    const joinRes = await client.query(`
      SELECT e.id AS employee_id, e.employee_code, e.first_name, e.last_name,
             u.id AS user_id, u.email, u.is_active AS user_active,
             r.id AS role_id, r.name AS role_name
      FROM employees e
      JOIN users u ON e.user_id = u.id
      JOIN roles r ON u.role_id = r.id
      WHERE e.id = $1;
    `, [testEmployeeId]);

    if (joinRes.rows.length !== 1 || joinRes.rows[0].email !== "test.auditor@projectcall.uz") {
      throw new Error("Foreign key join verification failed!");
    }
    console.log(`  ✓ Foreign keys verified: Employee (${joinRes.rows[0].employee_code}) -> User (${joinRes.rows[0].email}) -> Role (${joinRes.rows[0].role_name})`);

    // -------------------------------------------------------------------------
    // Test 7: Verify unique constraints
    // -------------------------------------------------------------------------
    console.log("\n[Test 7] Verify unique constraints...");

    // 7a: Duplicate user email
    let duplicateEmailFailed = false;
    try {
      await client.query(`
        INSERT INTO users (email, password_hash, role_id)
        VALUES ('test.auditor@projectcall.uz', 'hash2', $1);
      `, [testRoleId]);
    } catch (err) {
      if (err.code === "23505") duplicateEmailFailed = true;
    }
    if (!duplicateEmailFailed) throw new Error("Unique constraint on users.email failed to reject duplicate!");
    console.log("  ✓ Duplicate user email correctly rejected (23505 unique_violation)");

    // 7b: Duplicate employee code
    let duplicateEmpCodeFailed = false;
    try {
      await client.query(`
        INSERT INTO employees (user_id, employee_code, first_name, last_name)
        VALUES (gen_random_uuid(), 'EMP-TEST-001', 'Another', 'Person');
      `);
    } catch (err) {
      if (err.code === "23505") duplicateEmpCodeFailed = true;
    }
    if (!duplicateEmpCodeFailed) throw new Error("Unique constraint on employees.employee_code failed to reject duplicate!");
    console.log("  ✓ Duplicate employee code correctly rejected (23505 unique_violation)");

    // 7c: Duplicate 1-to-1 employee link (same user_id for another employee)
    let duplicateUserIdFailed = false;
    try {
      await client.query(`
        INSERT INTO employees (user_id, employee_code, first_name, last_name)
        VALUES ($1, 'EMP-TEST-002', 'Second', 'Employee');
      `, [testUserId]);
    } catch (err) {
      if (err.code === "23505") duplicateUserIdFailed = true;
    }
    if (!duplicateUserIdFailed) throw new Error("Unique constraint on employees.user_id failed to enforce 1-to-1!");
    console.log("  ✓ 1-to-1 violation (reusing user_id for another employee) correctly rejected (23505 unique_violation)");

    // -------------------------------------------------------------------------
    // Test 8: Verify invalid relationships are rejected (FK integrity)
    // -------------------------------------------------------------------------
    console.log("\n[Test 8] Verify invalid relationships are rejected...");

    // 8a: User with non-existent role_id
    let invalidRoleRejected = false;
    try {
      await client.query(`
        INSERT INTO users (email, password_hash, role_id)
        VALUES ('invalid.role@projectcall.uz', 'hash', '00000000-0000-0000-0000-000000000000');
      `);
    } catch (err) {
      if (err.code === "23503") invalidRoleRejected = true;
    }
    if (!invalidRoleRejected) throw new Error("Foreign key check failed: accepted non-existent role_id!");
    console.log("  ✓ User with non-existent role_id rejected (23503 foreign_key_violation)");

    // 8b: Employee with non-existent user_id
    let invalidUserRejected = false;
    try {
      await client.query(`
        INSERT INTO employees (user_id, employee_code, first_name, last_name)
        VALUES ('00000000-0000-0000-0000-000000000000', 'EMP-TEST-INVALID', 'Ghost', 'Employee');
      `);
    } catch (err) {
      if (err.code === "23503") invalidUserRejected = true;
    }
    if (!invalidUserRejected) throw new Error("Foreign key check failed: accepted non-existent user_id!");
    console.log("  ✓ Employee with non-existent user_id rejected (23503 foreign_key_violation)");

    // -------------------------------------------------------------------------
    // Test 9: Verify historical record protection (ON DELETE RESTRICT)
    // -------------------------------------------------------------------------
    console.log("\n[Test 9] Verify ON DELETE RESTRICT protects historical records...");

    // Attempt to delete user when employee profile exists
    let deleteUserBlocked = false;
    try {
      await client.query("DELETE FROM users WHERE id = $1;", [testUserId]);
    } catch (err) {
      if (err.code === "23503") deleteUserBlocked = true;
    }
    if (!deleteUserBlocked) {
      throw new Error("Security failure: User was deleted even though an employee profile is linked!");
    }
    console.log("  ✓ Deleting user blocked by ON DELETE RESTRICT on employees (prevents loss of historical records)");

    // Attempt to delete role when user is assigned
    let deleteRoleBlocked = false;
    try {
      await client.query("DELETE FROM roles WHERE id = $1;", [testRoleId]);
    } catch (err) {
      if (err.code === "23503") deleteRoleBlocked = true;
    }
    if (!deleteRoleBlocked) {
      throw new Error("Security failure: Role was deleted even though users are assigned!");
    }
    console.log("  ✓ Deleting role blocked by ON DELETE RESTRICT on users");

    // Verify safe deactivation pattern
    await client.query("UPDATE users SET is_active = false WHERE id = $1;", [testUserId]);
    await client.query("UPDATE employees SET is_active = false WHERE id = $1;", [testEmployeeId]);
    const deactRes = await client.query(`
      SELECT u.is_active AS user_active, e.is_active AS emp_active
      FROM users u JOIN employees e ON u.id = e.user_id
      WHERE u.id = $1;
    `, [testUserId]);
    if (deactRes.rows[0].user_active !== false || deactRes.rows[0].emp_active !== false) {
      throw new Error("Deactivation update failed!");
    }
    console.log("  ✓ Deactivation supported cleanly: user.is_active=false, employee.is_active=false with full data integrity preserved");

    // -------------------------------------------------------------------------
    // Test 10: Verify transactions and rollback behavior
    // -------------------------------------------------------------------------
    console.log("\n[Test 10] Verify transactions and rollback behavior...");
    await client.query("BEGIN;");
    await client.query(`
      INSERT INTO users (email, password_hash, role_id)
      VALUES ('rollback.candidate@projectcall.uz', 'hash_rollback', $1);
    `, [testRoleId]);

    // Force rollback
    await client.query("ROLLBACK;");

    const checkRollback = await client.query(`
      SELECT id FROM users WHERE email = 'rollback.candidate@projectcall.uz';
    `);
    if (checkRollback.rows.length !== 0) {
      throw new Error("Transaction rollback test failed: record persisted after ROLLBACK!");
    }
    console.log("  ✓ Transaction rolled back successfully; no uncommitted data persisted");

    // -------------------------------------------------------------------------
    // Test 11: Drizzle ORM query & relation verification
    // -------------------------------------------------------------------------
    console.log("\n[Test 11] Drizzle ORM relations verification...");
    const drizzleAdminRole = await db.query.roles.findFirst({
      where: (r, { eq: eqOp }) => eqOp(r.name, "admin"),
      with: {
        rolePermissions: {
          with: {
            permission: true,
          },
        },
      },
    });

    if (!drizzleAdminRole || drizzleAdminRole.rolePermissions.length !== 7) {
      throw new Error(`Drizzle relation query failed: expected 7 permissions for admin, found ${drizzleAdminRole?.rolePermissions?.length}`);
    }
    console.log(`  ✓ Drizzle ORM loaded 'admin' role with ${drizzleAdminRole.rolePermissions.length} relational permissions`);

    console.log("\n==================================================================");
    console.log("  ALL DATABASE SCHEMA TESTS PASSED SUCCESSFULLY!");
    console.log("==================================================================");
  } finally {
    // -------------------------------------------------------------------------
    // Cleanup: Remove ONLY the test records created during this test
    // -------------------------------------------------------------------------
    console.log("\n[Cleanup] Cleaning up test records only...");
    if (testEmployeeId) {
      await client.query("DELETE FROM employees WHERE id = $1;", [testEmployeeId]);
      console.log(`  ✓ Cleaned up test employee: ${testEmployeeId}`);
    }
    if (testUserId) {
      await client.query("DELETE FROM users WHERE id = $1;", [testUserId]);
      console.log(`  ✓ Cleaned up test user: ${testUserId}`);
    }
    if (testRoleId) {
      await client.query("DELETE FROM role_permissions WHERE role_id = $1;", [testRoleId]);
      await client.query("DELETE FROM roles WHERE id = $1;", [testRoleId]);
      console.log(`  ✓ Cleaned up test role and mappings: ${testRoleId}`);
    }
    if (testPermId1 || testPermId2) {
      await client.query("DELETE FROM permissions WHERE id IN ($1, $2);", [testPermId1, testPermId2]);
      console.log(`  ✓ Cleaned up test permissions: ${testPermId1}, ${testPermId2}`);
    }

    client.release();
    await pool.end();
    console.log("  ✓ Test database connections released cleanly.\n");
  }
}

runDatabaseSchemaTests().catch((err) => {
  console.error("\nFATAL TEST FAILURE:", err);
  process.exit(1);
});
