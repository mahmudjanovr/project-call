import { sql } from "drizzle-orm";
import { db } from "@/db";
import { hasPermission } from "@/lib/auth/rbac";
import type { AuthContext } from "@/lib/auth/session";
import type {
  DashboardData,
  KpiMetrics,
  RevenueChartPoint,
  OrderStatusDistribution,
  MonthlySalesPoint,
  CustomerGrowthPoint,
  RecentOrder,
  RecentCustomer,
  RecentEmployeeActivity,
  DashboardPermissions,
} from "./types";

const UZ_MONTH_NAMES = [
  "Yan", "Fev", "Mar", "Apr", "May", "Iyun",
  "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"
];

function getLast6Months(): { key: string; label: string }[] {
  const result: { key: string; label: string }[] = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const key = `${year}-${month}`;
    const label = `${UZ_MONTH_NAMES[d.getMonth()]} ${year !== now.getFullYear() ? year : ""}`.trim();
    result.push({ key, label });
  }

  return result;
}

/**
 * Fetches all real database metrics, charts, and activity for the Admin Dashboard.
 * Strictly enforces RBAC permissions per dataset and prevents N+1 queries.
 */
export async function getDashboardData(auth: AuthContext): Promise<DashboardData> {
  const canReadCustomers = hasPermission(auth, "customers.read");
  const canCreateCustomer = hasPermission(auth, "customers.create");
  const canReadOrders = hasPermission(auth, "orders.read");
  const canCreateOrder = hasPermission(auth, "orders.create");
  const canReadEmployees = hasPermission(auth, "employees.read");
  const canCreateEmployee = hasPermission(auth, "employees.create");
  const canReadReports = hasPermission(auth, "reports.read");

  // Financial revenue is restricted to roles with reports.read permission or admin
  const canViewRevenue = canReadReports || auth.role.name === "admin" || auth.role.name === "manager";

  const permissions: DashboardPermissions = {
    canReadCustomers,
    canCreateCustomer,
    canReadOrders,
    canCreateOrder,
    canReadEmployees,
    canCreateEmployee,
    canReadReports,
  };

  const months6 = getLast6Months();

  // Run all authorized aggregated queries in parallel
  const [
    customersKpiResult,
    employeesKpiResult,
    ordersKpiResult,
    revenueChartResult,
    orderStatusResult,
    customerGrowthResult,
    recentOrdersResult,
    recentCustomersResult,
    recentEmployeesResult,
  ] = await Promise.all([
    // 1. Customers KPI
    canReadCustomers
      ? db.execute<{ total: number; this_month: number }>(sql`
          SELECT 
            count(*)::int as total,
            count(*) FILTER (WHERE created_at >= date_trunc('month', now()))::int as this_month
          FROM customers;
        `).catch(() => ({ rows: [] }))
      : Promise.resolve({ rows: [] }),

    // 2. Employees KPI
    canReadEmployees
      ? db.execute<{ total: number; active: number }>(sql`
          SELECT 
            count(*)::int as total,
            count(*) FILTER (WHERE is_active = true)::int as active
          FROM employees;
        `).catch(() => ({ rows: [] }))
      : Promise.resolve({ rows: [] }),

    // 3. Orders KPI & Total Revenue (Efficient single SQL aggregation)
    canReadOrders
      ? db.execute<{
          total_orders: number;
          pending_orders: number;
          completed_orders: number;
          total_revenue: string;
        }>(sql`
          SELECT 
            count(*)::int as total_orders,
            count(*) FILTER (WHERE status = 'pending')::int as pending_orders,
            count(*) FILTER (WHERE status = 'completed')::int as completed_orders,
            coalesce(sum(amount) FILTER (WHERE status = 'completed'), 0)::numeric as total_revenue
          FROM orders;
        `).catch(() => ({ rows: [] }))
      : Promise.resolve({ rows: [] }),

    // 4. Revenue Overview (Last 6 months)
    canViewRevenue && canReadOrders
      ? db.execute<{ month_key: string; revenue: string; order_count: number }>(sql`
          SELECT 
            to_char(date_trunc('month', created_at), 'YYYY-MM') as month_key,
            coalesce(sum(amount) FILTER (WHERE status = 'completed'), 0)::numeric as revenue,
            count(*)::int as order_count
          FROM orders
          WHERE created_at >= date_trunc('month', now() - interval '5 months')
          GROUP BY date_trunc('month', created_at)
          ORDER BY date_trunc('month', created_at) ASC;
        `).catch(() => ({ rows: [] }))
      : Promise.resolve({ rows: [] }),

    // 5. Orders by Status
    canReadOrders
      ? db.execute<{ status: string; count: number }>(sql`
          SELECT 
            status,
            count(*)::int as count
          FROM orders
          GROUP BY status;
        `).catch(() => ({ rows: [] }))
      : Promise.resolve({ rows: [] }),

    // 6. Customer Growth Overview (Last 6 months)
    canReadCustomers
      ? db.execute<{ month_key: string; new_customers: number }>(sql`
          SELECT 
            to_char(date_trunc('month', created_at), 'YYYY-MM') as month_key,
            count(*)::int as new_customers
          FROM customers
          WHERE created_at >= date_trunc('month', now() - interval '5 months')
          GROUP BY date_trunc('month', created_at)
          ORDER BY date_trunc('month', created_at) ASC;
        `).catch(() => ({ rows: [] }))
      : Promise.resolve({ rows: [] }),

    // 7. Recent Orders (Latest 5)
    canReadOrders
      ? db.execute<{
          id: string;
          order_number: string;
          customer_id: string;
          customer_name: string;
          amount: string;
          status: string;
          created_at: Date;
          employee_first_name: string | null;
          employee_last_name: string | null;
        }>(sql`
          SELECT 
            o.id,
            o.order_number,
            o.customer_id,
            c.name as customer_name,
            o.amount::numeric as amount,
            o.status,
            o.created_at,
            e.first_name as employee_first_name,
            e.last_name as employee_last_name
          FROM orders o
          JOIN customers c ON o.customer_id = c.id
          LEFT JOIN employees e ON o.employee_id = e.id
          ORDER BY o.created_at DESC
          LIMIT 5;
        `).catch(() => ({ rows: [] }))
      : Promise.resolve({ rows: [] }),

    // 8. Recent Customers (Latest 5)
    canReadCustomers
      ? db.execute<{
          id: string;
          name: string;
          phone: string;
          email: string | null;
          status: string;
          created_at: Date;
          assigned_first_name: string | null;
          assigned_last_name: string | null;
        }>(sql`
          SELECT 
            c.id,
            c.name,
            c.phone,
            c.email,
            c.status,
            c.created_at,
            e.first_name as assigned_first_name,
            e.last_name as assigned_last_name
          FROM customers c
          LEFT JOIN employees e ON c.assigned_employee_id = e.id
          ORDER BY c.created_at DESC
          LIMIT 5;
        `).catch(() => ({ rows: [] }))
      : Promise.resolve({ rows: [] }),

    // 9. Recent Employee Activity (Latest 5)
    canReadEmployees
      ? db.execute<{
          id: string;
          employee_code: string;
          first_name: string;
          last_name: string;
          position: string | null;
          department: string | null;
          is_active: boolean;
          created_at: Date;
          last_login_at: Date | null;
        }>(sql`
          SELECT 
            e.id,
            e.employee_code,
            e.first_name,
            e.last_name,
            e.position,
            e.department,
            e.is_active,
            e.created_at,
            u.last_login_at
          FROM employees e
          JOIN users u ON e.user_id = u.id
          ORDER BY coalesce(u.last_login_at, e.created_at) DESC
          LIMIT 5;
        `).catch(() => ({ rows: [] }))
      : Promise.resolve({ rows: [] }),
  ]);

  // Parse KPI metrics safely
  const custRow = customersKpiResult.rows[0];
  const empRow = employeesKpiResult.rows[0];
  const orderRow = ordersKpiResult.rows[0];

  const kpis: KpiMetrics = {
    totalCustomers: canReadCustomers ? (custRow?.total ?? 0) : null,
    newCustomersThisMonth: canReadCustomers ? (custRow?.this_month ?? 0) : null,
    totalEmployees: canReadEmployees ? (empRow?.total ?? 0) : null,
    activeEmployees: canReadEmployees ? (empRow?.active ?? 0) : null,
    totalOrders: canReadOrders ? (orderRow?.total_orders ?? 0) : null,
    pendingOrders: canReadOrders ? (orderRow?.pending_orders ?? 0) : null,
    completedOrders: canReadOrders ? (orderRow?.completed_orders ?? 0) : null,
    totalRevenue: canViewRevenue && canReadOrders ? Number(orderRow?.total_revenue ?? 0) : null,
  };

  // Map 6-month Revenue Overview
  const revenueMap = new Map<string, { revenue: number; orderCount: number }>();
  for (const row of revenueChartResult.rows) {
    revenueMap.set(row.month_key, {
      revenue: Number(row.revenue ?? 0),
      orderCount: Number(row.order_count ?? 0),
    });
  }

  const revenueOverview: RevenueChartPoint[] = months6.map((m) => {
    const data = revenueMap.get(m.key);
    return {
      monthKey: m.key,
      monthLabel: m.label,
      revenue: data?.revenue ?? 0,
      orderCount: data?.orderCount ?? 0,
    };
  });

  const monthlySales: MonthlySalesPoint[] = revenueOverview.map((r) => ({
    monthKey: r.monthKey,
    monthLabel: r.monthLabel,
    revenue: r.revenue,
    orderCount: r.orderCount,
  }));

  // Orders by Status distribution
  const statusCounts: Record<string, number> = {
    pending: 0,
    processing: 0,
    completed: 0,
    cancelled: 0,
  };
  let totalStatusOrders = 0;

  for (const row of orderStatusResult.rows) {
    const s = row.status?.toLowerCase();
    const count = Number(row.count ?? 0);
    if (s === "pending" || s === "processing" || s === "completed" || s === "cancelled") {
      statusCounts[s] = (statusCounts[s] ?? 0) + count;
      totalStatusOrders += count;
    }
  }

  const statusConfigs: {
    status: "pending" | "processing" | "completed" | "cancelled";
    label: string;
    color: string;
  }[] = [
    { status: "pending", label: "Kutilmoqda", color: "bg-amber-500" },
    { status: "processing", label: "Jarayonda", color: "bg-blue-500" },
    { status: "completed", label: "Bajarildi", color: "bg-emerald-500" },
    { status: "cancelled", label: "Bekor qilindi", color: "bg-rose-500" },
  ];

  const ordersByStatus: OrderStatusDistribution[] = statusConfigs.map((cfg) => {
    const count = statusCounts[cfg.status] || 0;
    const percentage = totalStatusOrders > 0 ? Math.round((count / totalStatusOrders) * 100) : 0;
    return {
      status: cfg.status,
      label: cfg.label,
      count,
      percentage,
      color: cfg.color,
    };
  });

  // Customer Growth (6 months)
  const growthMap = new Map<string, number>();
  for (const row of customerGrowthResult.rows) {
    growthMap.set(row.month_key, Number(row.new_customers ?? 0));
  }

  let cumulativeCount = 0;
  const customerGrowth: CustomerGrowthPoint[] = months6.map((m) => {
    const newCust = growthMap.get(m.key) ?? 0;
    cumulativeCount += newCust;
    return {
      monthKey: m.key,
      monthLabel: m.label,
      newCustomers: newCust,
      cumulativeCustomers: cumulativeCount,
    };
  });

  // Recent Orders list
  const recentOrders: RecentOrder[] = recentOrdersResult.rows.map((row) => ({
    id: row.id,
    orderNumber: row.order_number,
    customerId: row.customer_id,
    customerName: row.customer_name,
    amount: Number(row.amount ?? 0),
    status: row.status,
    createdAt: new Date(row.created_at),
    employeeName: row.employee_first_name
      ? `${row.employee_first_name} ${row.employee_last_name ?? ""}`.trim()
      : null,
  }));

  // Recent Customers list
  const recentCustomers: RecentCustomer[] = recentCustomersResult.rows.map((row) => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    status: row.status,
    createdAt: new Date(row.created_at),
    assignedEmployeeName: row.assigned_first_name
      ? `${row.assigned_first_name} ${row.assigned_last_name ?? ""}`.trim()
      : null,
  }));

  // Recent Employee Activity
  const recentEmployeeActivity: RecentEmployeeActivity[] = recentEmployeesResult.rows.map((row) => ({
    id: row.id,
    employeeCode: row.employee_code,
    fullName: `${row.first_name} ${row.last_name}`,
    position: row.position,
    department: row.department,
    lastLoginAt: row.last_login_at ? new Date(row.last_login_at) : null,
    createdAt: new Date(row.created_at),
    isActive: row.is_active,
  }));

  return {
    kpis,
    revenueOverview,
    ordersByStatus,
    monthlySales,
    customerGrowth,
    recentOrders,
    recentCustomers,
    recentEmployeeActivity,
    permissions,
  };
}
