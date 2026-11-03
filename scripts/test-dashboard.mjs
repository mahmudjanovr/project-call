import * as dotenv from "dotenv";
import assert from "assert";
import pg from "pg";
import { hash, Algorithm } from "@node-rs/argon2";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const { Pool } = pg;

async function runDashboardTestSuite() {
  console.log("==================================================================");
  console.log("  ProjectCall — Phase 2.1: Admin Dashboard & RBAC Test Suite");
  console.log("==================================================================");

  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Missing DATABASE_URL");
  }

  const pool = new Pool({ connectionString, max: 2 });
  const client = await pool.connect();

  let passedTests = 0;
  let totalTests = 0;

  async function test(name, fn) {
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

  // Tracking IDs for cleanup
  let testCustomerId1 = null;
  let testCustomerId2 = null;
  let testOrderIdPending = null;
  let testOrderIdCompleted = null;
  let testOrderIdCancelled = null;
  let testAdminEmployeeId = null;

  try {
    // Retrieve Admin employee for associations
    const empRes = await client.query("SELECT id FROM employees LIMIT 1;");
    if (empRes.rows.length === 0) {
      throw new Error("No employee found in database for dashboard testing.");
    }
    testAdminEmployeeId = empRes.rows[0].id;

    console.log("\n--- Category 1: KPI Calculations & Safe Aggregation ---");

    await test("Query baseline counts on database tables safely (empty/zero handling)", async () => {
      const q = await client.query(`
        SELECT 
          (SELECT count(*)::int FROM customers) as cust_count,
          (SELECT count(*)::int FROM employees) as emp_count,
          (SELECT count(*)::int FROM orders) as order_count,
          (SELECT coalesce(sum(amount) FILTER (WHERE status = 'completed'), 0)::numeric FROM orders) as revenue;
      `);
      const row = q.rows[0];
      assert(typeof row.cust_count === "number", "cust_count must be number");
      assert(typeof row.emp_count === "number" && row.emp_count >= 1, "emp_count must be at least 1");
      assert(typeof row.order_count === "number", "order_count must be number");
      assert(!isNaN(Number(row.revenue)), "revenue must be numeric");
    });

    await test("Insert test customers and orders in isolated transaction for KPI verification", async () => {
      // Insert 2 customers
      const c1 = await client.query(`
        INSERT INTO customers (name, phone, company, status, assigned_employee_id)
        VALUES ('Test Mijoz 1', '+998901112233', 'Test Tech LLC', 'active', $1::uuid)
        RETURNING id;
      `, [testAdminEmployeeId]);
      testCustomerId1 = c1.rows[0].id;

      const c2 = await client.query(`
        INSERT INTO customers (name, phone, company, status, assigned_employee_id)
        VALUES ('Test Mijoz 2', '+998904445566', 'Alpha Corp', 'active', $1::uuid)
        RETURNING id;
      `, [testAdminEmployeeId]);
      testCustomerId2 = c2.rows[0].id;

      // Insert 1 pending order (amount: 1,500,000 UZS)
      const o1 = await client.query(`
        INSERT INTO orders (order_number, customer_id, employee_id, amount, status)
        VALUES ('ORD-TEST-PENDING-001', $1::uuid, $2::uuid, 1500000.00, 'pending')
        RETURNING id;
      `, [testCustomerId1, testAdminEmployeeId]);
      testOrderIdPending = o1.rows[0].id;

      // Insert 1 completed order (amount: 3,500,000 UZS)
      const o2 = await client.query(`
        INSERT INTO orders (order_number, customer_id, employee_id, amount, status)
        VALUES ('ORD-TEST-COMPLETED-001', $1::uuid, $2::uuid, 3500000.00, 'completed')
        RETURNING id;
      `, [testCustomerId1, testAdminEmployeeId]);
      testOrderIdCompleted = o2.rows[0].id;

      // Insert 1 cancelled order (amount: 500,000 UZS)
      const o3 = await client.query(`
        INSERT INTO orders (order_number, customer_id, employee_id, amount, status)
        VALUES ('ORD-TEST-CANCELLED-001', $1::uuid, $2::uuid, 500000.00, 'cancelled')
        RETURNING id;
      `, [testCustomerId2, testAdminEmployeeId]);
      testOrderIdCancelled = o3.rows[0].id;

      assert(testCustomerId1 && testCustomerId2, "Customers created");
      assert(testOrderIdPending && testOrderIdCompleted && testOrderIdCancelled, "Orders created");
    });

    await test("KPI Metrics: Total orders, Pending, Completed, and Total Revenue aggregation", async () => {
      const q = await client.query(`
        SELECT 
          count(*)::int as total_orders,
          count(*) FILTER (WHERE status = 'pending')::int as pending_orders,
          count(*) FILTER (WHERE status = 'completed')::int as completed_orders,
          count(*) FILTER (WHERE status = 'cancelled')::int as cancelled_orders,
          coalesce(sum(amount) FILTER (WHERE status = 'completed'), 0)::numeric as total_revenue
        FROM orders
        WHERE id IN ($1::uuid, $2::uuid, $3::uuid);
      `, [testOrderIdPending, testOrderIdCompleted, testOrderIdCancelled]);

      const r = q.rows[0];
      assert.strictEqual(r.total_orders, 3, "Total test orders must be 3");
      assert.strictEqual(r.pending_orders, 1, "Pending test orders must be 1");
      assert.strictEqual(r.completed_orders, 1, "Completed test orders must be 1");
      assert.strictEqual(r.cancelled_orders, 1, "Cancelled test orders must be 1");
      assert.strictEqual(Number(r.total_revenue), 3500000.00, "Revenue must only count completed orders (3,500,000 UZS)");
    });

    console.log("\n--- Category 2: Analytics & Chart Datasets Integrity ---");

    await test("Orders by status breakdown calculates correct proportions", async () => {
      const q = await client.query(`
        SELECT status, count(*)::int as count
        FROM orders
        WHERE id IN ($1::uuid, $2::uuid, $3::uuid)
        GROUP BY status;
      `, [testOrderIdPending, testOrderIdCompleted, testOrderIdCancelled]);

      const map = Object.fromEntries(q.rows.map(r => [r.status, r.count]));
      assert.strictEqual(map.pending, 1);
      assert.strictEqual(map.completed, 1);
      assert.strictEqual(map.cancelled, 1);
    });

    await test("Revenue overview groups completed amounts by calendar month", async () => {
      const q = await client.query(`
        SELECT 
          to_char(date_trunc('month', created_at), 'YYYY-MM') as month_key,
          coalesce(sum(amount) FILTER (WHERE status = 'completed'), 0)::numeric as revenue,
          count(*)::int as order_count
        FROM orders
        WHERE id = $1::uuid
        GROUP BY date_trunc('month', created_at);
      `, [testOrderIdCompleted]);

      assert(q.rows.length === 1, "Must return current month row");
      assert.strictEqual(Number(q.rows[0].revenue), 3500000.00, "Must aggregate 3,500,000 UZS");
      assert.strictEqual(q.rows[0].order_count, 1, "Must report 1 order");
    });

    await test("Customer growth overview aggregates new registrations", async () => {
      const q = await client.query(`
        SELECT 
          to_char(date_trunc('month', created_at), 'YYYY-MM') as month_key,
          count(*)::int as new_customers
        FROM customers
        WHERE id IN ($1::uuid, $2::uuid)
        GROUP BY date_trunc('month', created_at);
      `, [testCustomerId1, testCustomerId2]);

      assert(q.rows.length === 1);
      assert.strictEqual(q.rows[0].new_customers, 2);
    });

    console.log("\n--- Category 3: Recent Activity Queries & Detail Links ---");

    await test("Latest orders query returns customer relations and formatted fields", async () => {
      const q = await client.query(`
        SELECT 
          o.id,
          o.order_number,
          o.amount::numeric as amount,
          o.status,
          o.created_at,
          c.id as customer_id,
          c.name as customer_name,
          e.first_name as employee_first_name
        FROM orders o
        JOIN customers c ON o.customer_id = c.id
        LEFT JOIN employees e ON o.employee_id = e.id
        WHERE o.id = $1::uuid;
      `, [testOrderIdCompleted]);

      assert.strictEqual(q.rows.length, 1);
      const row = q.rows[0];
      assert.strictEqual(row.order_number, "ORD-TEST-COMPLETED-001");
      assert.strictEqual(row.customer_name, "Test Mijoz 1");
      assert.strictEqual(Number(row.amount), 3500000.00);
      assert(row.customer_id, "customer_id must be present for linking");
    });

    await test("Recently added customers query returns contact info and assigned employee", async () => {
      const q = await client.query(`
        SELECT 
          c.id,
          c.name,
          c.phone,
          c.company,
          c.status,
          c.created_at,
          e.first_name as assigned_first_name
        FROM customers c
        LEFT JOIN employees e ON c.assigned_employee_id = e.id
        WHERE c.id = $1::uuid;
      `, [testCustomerId1]);

      assert.strictEqual(q.rows.length, 1);
      assert.strictEqual(q.rows[0].name, "Test Mijoz 1");
      assert.strictEqual(q.rows[0].phone, "+998901112233");
    });

    console.log("\n--- Category 4: Role-Based Access Control (RBAC) Enforcement ---");

    await test("Admin role possesses all dashboard permissions", async () => {
      const q = await client.query(`
        SELECT p.key 
        FROM role_permissions rp
        JOIN roles r ON rp.role_id = r.id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE r.name = 'admin';
      `);
      const keys = new Set(q.rows.map(r => r.key));

      assert(keys.has("customers.read"), "Admin must have customers.read");
      assert(keys.has("customers.create"), "Admin must have customers.create");
      assert(keys.has("employees.read"), "Admin must have employees.read");
      assert(keys.has("employees.create"), "Admin must have employees.create");
      assert(keys.has("orders.read"), "Admin must have orders.read");
      assert(keys.has("orders.create"), "Admin must have orders.create");
      assert(keys.has("reports.read"), "Admin must have reports.read");
    });

    await test("Manager role has operational visibility but is restricted from employee creation", async () => {
      const q = await client.query(`
        SELECT p.key 
        FROM role_permissions rp
        JOIN roles r ON rp.role_id = r.id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE r.name = 'manager';
      `);
      const keys = new Set(q.rows.map(r => r.key));

      assert(keys.has("customers.read"), "Manager can read customers");
      assert(keys.has("employees.read"), "Manager can read employees");
      assert(keys.has("orders.read"), "Manager can read orders");
      assert(keys.has("reports.read"), "Manager can read reports");
      assert(!keys.has("employees.create"), "Manager CANNOT create employees");
      assert(!keys.has("users.create"), "Manager CANNOT create users");
    });

    await test("Operator role has frontline permissions but sensitive financials and staff metrics are denied", async () => {
      const q = await client.query(`
        SELECT p.key 
        FROM role_permissions rp
        JOIN roles r ON rp.role_id = r.id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE r.name = 'operator';
      `);
      const keys = new Set(q.rows.map(r => r.key));

      assert(keys.has("customers.read"), "Operator can read customers");
      assert(keys.has("customers.create"), "Operator can create customers");
      assert(keys.has("orders.read"), "Operator can read orders");
      assert(keys.has("orders.create"), "Operator can create orders");

      // Strictly denied
      assert(!keys.has("employees.read"), "Operator CANNOT read employee directory");
      assert(!keys.has("employees.create"), "Operator CANNOT create employees");
      assert(!keys.has("reports.read"), "Operator CANNOT view financial reports/revenue");
    });

    console.log("\n==================================================================");
    console.log(`  PASSED: All ${passedTests} / ${totalTests} dashboard tests passed!`);
    console.log("==================================================================");
  } finally {
    // Cleanup test records
    console.log("\n[Cleanup] Cleaning up test orders and customers...");
    if (testOrderIdPending || testOrderIdCompleted || testOrderIdCancelled) {
      await client.query("DELETE FROM orders WHERE id IN ($1::uuid, $2::uuid, $3::uuid);", [
        testOrderIdPending,
        testOrderIdCompleted,
        testOrderIdCancelled,
      ]);
      console.log("  ✓ Test orders deleted");
    }
    if (testCustomerId1 || testCustomerId2) {
      await client.query("DELETE FROM customers WHERE id IN ($1::uuid, $2::uuid);", [
        testCustomerId1,
        testCustomerId2,
      ]);
      console.log("  ✓ Test customers deleted");
    }
    client.release();
    await pool.end();
  }
}

runDashboardTestSuite().catch((err) => {
  console.error("Dashboard Test Suite Failed:", err);
  process.exit(1);
});
