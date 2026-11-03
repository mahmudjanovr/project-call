export interface KpiMetrics {
  totalCustomers: number | null;
  totalEmployees: number | null;
  totalOrders: number | null;
  pendingOrders: number | null;
  completedOrders: number | null;
  totalRevenue: number | null;
  newCustomersThisMonth: number | null;
  activeEmployees: number | null;
}

export interface RevenueChartPoint {
  monthKey: string;
  monthLabel: string;
  revenue: number;
  orderCount: number;
}

export interface OrderStatusDistribution {
  status: "pending" | "processing" | "completed" | "cancelled";
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface MonthlySalesPoint {
  monthKey: string;
  monthLabel: string;
  revenue: number;
  orderCount: number;
}

export interface CustomerGrowthPoint {
  monthKey: string;
  monthLabel: string;
  newCustomers: number;
  cumulativeCustomers: number;
}

export interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerId: string;
  amount: number;
  status: string;
  createdAt: Date;
  employeeName: string | null;
}

export interface RecentCustomer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  status: string;
  createdAt: Date;
  assignedEmployeeName: string | null;
}

export interface RecentEmployeeActivity {
  id: string;
  employeeCode: string;
  fullName: string;
  position: string | null;
  department: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  isActive: boolean;
}

export interface DashboardPermissions {
  canReadCustomers: boolean;
  canCreateCustomer: boolean;
  canReadOrders: boolean;
  canCreateOrder: boolean;
  canReadEmployees: boolean;
  canCreateEmployee: boolean;
  canReadReports: boolean;
}

export interface DashboardData {
  kpis: KpiMetrics;
  revenueOverview: RevenueChartPoint[];
  ordersByStatus: OrderStatusDistribution[];
  monthlySales: MonthlySalesPoint[];
  customerGrowth: CustomerGrowthPoint[];
  recentOrders: RecentOrder[];
  recentCustomers: RecentCustomer[];
  recentEmployeeActivity: RecentEmployeeActivity[];
  permissions: DashboardPermissions;
}
