import * as React from "react";
import { requireAuth } from "@/lib/auth/rbac";
import { getDashboardData } from "@/lib/dashboard/queries";
import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { AnalyticsCharts } from "@/components/dashboard/analytics-charts";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { QuickActions } from "@/components/dashboard/quick-actions";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // 1. Enforce Server-Side Authentication
  const auth = await requireAuth();

  // 2. Fetch all database-backed metrics, analytics, and activities
  const data = await getDashboardData(auth);

  const roleNameMap: Record<string, string> = {
    admin: "Bosh Administrator",
    manager: "Operatsiyalar Menejeri",
    operator: "Sotuv Operatori",
  };

  const userRoleDisplay = roleNameMap[auth.role.name] || auth.role.displayName || auth.role.name;

  return (
    <PageContainer
      title="Boshqaruv paneli"
      description="ProjectCall kompaniya ichki CRM va savdo boshqaruvi tizimi."
      actions={<QuickActions permissions={data.permissions} />}
    >
      <div className="space-y-6">
        {/* Welcome Banner */}
        <Card className="p-5 sm:p-6 bg-gradient-to-r from-white via-slate-50 to-blue-50/30 border border-slate-200">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                  Xush kelibsiz, {auth.employee.firstName} {auth.employee.lastName}!
                </h2>
                <Badge variant="default" className="text-[11px] font-semibold">
                  {userRoleDisplay}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
                Tizim real vaqt rejimida PostgreSQL ma&apos;lumotlar bazasi bilan sinxronlashgan. Barcha ko&apos;rsatkichlar haqiqiy yozuvlar asosida hisoblanadi.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 shadow-2xs">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
                <span className="text-xs font-medium text-slate-700">
                  Baza: <span className="font-semibold text-slate-900">Neon PostgreSQL</span>
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Section 1: Database-backed KPI Cards */}
        <section aria-label="Asosiy ko'rsatkichlar">
          <KpiCards kpis={data.kpis} />
        </section>

        {/* Section 2: Real Database Analytics & Trends */}
        <section aria-label="Tahliliy hisobotlar va dinamika">
          <AnalyticsCharts
            revenueOverview={data.revenueOverview}
            ordersByStatus={data.ordersByStatus}
            monthlySales={data.monthlySales}
            customerGrowth={data.customerGrowth}
            canViewRevenue={Boolean(data.kpis.totalRevenue !== null)}
            canReadOrders={data.permissions.canReadOrders}
            canReadCustomers={data.permissions.canReadCustomers}
          />
        </section>

        {/* Section 3: Recent Activity & Audit Feeds */}
        <section aria-label="So'nggi faollik va jurnallar">
          <RecentActivity
            recentOrders={data.recentOrders}
            recentCustomers={data.recentCustomers}
            recentEmployeeActivity={data.recentEmployeeActivity}
            canReadOrders={data.permissions.canReadOrders}
            canReadCustomers={data.permissions.canReadCustomers}
            canReadEmployees={data.permissions.canReadEmployees}
          />
        </section>
      </div>
    </PageContainer>
  );
}
