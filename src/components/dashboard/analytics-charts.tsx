import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type {
  RevenueChartPoint,
  OrderStatusDistribution,
  MonthlySalesPoint,
  CustomerGrowthPoint,
} from "@/lib/dashboard/types";

interface AnalyticsChartsProps {
  revenueOverview: RevenueChartPoint[];
  ordersByStatus: OrderStatusDistribution[];
  monthlySales: MonthlySalesPoint[];
  customerGrowth: CustomerGrowthPoint[];
  canViewRevenue: boolean;
  canReadOrders: boolean;
  canReadCustomers: boolean;
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) {
    return (amount / 1_000_000_000).toFixed(1) + " mlrd UZS";
  }
  if (amount >= 1_000_000) {
    return (amount / 1_000_000).toFixed(1) + " mln UZS";
  }
  return new Intl.NumberFormat("uz-UZ").format(amount) + " UZS";
}

export function AnalyticsCharts({
  revenueOverview,
  ordersByStatus,
  monthlySales,
  customerGrowth,
  canViewRevenue,
  canReadOrders,
  canReadCustomers,
}: AnalyticsChartsProps) {
  // Check if datasets have actual non-zero activity
  const hasRevenueData = revenueOverview.some((p) => p.revenue > 0);
  const totalOrdersCount = ordersByStatus.reduce((acc, curr) => acc + curr.count, 0);
  const hasCustomerGrowthData = customerGrowth.some((p) => p.newCustomers > 0);

  // Maximum revenue for chart scaling
  const maxRevenue = Math.max(...revenueOverview.map((p) => p.revenue), 100_000);
  const maxMonthlyOrders = Math.max(...monthlySales.map((p) => p.orderCount), 5);
  const maxCustomerGrowth = Math.max(...customerGrowth.map((p) => p.newCustomers), 5);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* 1. Revenue Overview Chart */}
      <Card className="flex flex-col justify-between">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">Tushum dinamikasi</CardTitle>
              <CardDescription className="text-xs mt-1">
                Oxirgi 6 oylik bajarilgan buyurtmalar tushumi
              </CardDescription>
            </div>
            {canViewRevenue && (
              <Badge variant="outline" className="text-[11px] font-normal">
                Oxirgi 6 oy
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-6 flex-1 flex flex-col justify-center">
          {!canViewRevenue ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Ushbu moliyaviy hisobotni ko&apos;rish uchun `reports.read` ruxsati talab etiladi.
            </div>
          ) : !hasRevenueData ? (
            <EmptyState
              variant="card"
              className="border-0 bg-transparent p-6 shadow-none"
              icon={
                <svg
                  width="24"
                  height="24"
                  className="h-6 w-6 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                  />
                </svg>
              }
              title="Hozircha tushum ma'lumotlari mavjud emas"
              description="Buyurtmalar rasmiylashtirilib yakunlanganidan so'ng, oylik tushum egri chizig'i ushbu maydonda avtomatik chiziladi."
            />
          ) : (
            <div className="space-y-4">
              {/* Scaled Bar Visual for 6 Months */}
              <div className="flex h-44 items-end gap-2 sm:gap-4 pt-4 border-b border-slate-100 pb-2">
                {revenueOverview.map((pt) => {
                  const heightPercent = Math.max(
                    Math.round((pt.revenue / maxRevenue) * 100),
                    pt.revenue > 0 ? 8 : 2
                  );
                  return (
                    <div
                      key={pt.monthKey}
                      className="group flex flex-1 flex-col items-center justify-end h-full relative"
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] rounded px-2 py-1 pointer-events-none whitespace-nowrap z-10 shadow-md">
                        {pt.monthLabel}: {new Intl.NumberFormat("uz-UZ").format(pt.revenue)} UZS
                      </div>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full max-w-[40px] rounded-t transition-all duration-300 ${
                          pt.revenue > 0
                            ? "bg-blue-600 group-hover:bg-blue-700"
                            : "bg-slate-100 group-hover:bg-slate-200"
                        }`}
                      />
                      <span className="mt-2 text-[10px] sm:text-xs font-medium text-slate-500 truncate w-full text-center">
                        {pt.monthLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Minimal: 0 UZS</span>
                <span className="font-medium text-slate-700">Maksimal: {formatCurrency(maxRevenue)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Orders by Status */}
      <Card className="flex flex-col justify-between">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">Buyurtmalar holati</CardTitle>
              <CardDescription className="text-xs mt-1">
                Jami buyurtmalarning statuslar bo&apos;yicha taqsimoti
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-[11px]">
              Jami: {totalOrdersCount}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-6 flex-1 flex flex-col justify-center">
          {!canReadOrders ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Buyurtmalar statistikasini ko&apos;rish uchun `orders.read` ruxsati talab etiladi.
            </div>
          ) : totalOrdersCount === 0 ? (
            <EmptyState
              variant="card"
              className="border-0 bg-transparent p-6 shadow-none"
              icon={
                <svg
                  width="24"
                  height="24"
                  className="h-6 w-6 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                  />
                </svg>
              }
              title="Hozircha buyurtmalar ro'yxatga olinmagan"
              description="Tezkor amal orqali yangi buyurtma yaratganingizdan so'ng, statuslar taqsimoti bu yerda shakllanadi."
            />
          ) : (
            <div className="space-y-5">
              {/* Proportional Segmented Progress Bar */}
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
                {ordersByStatus.map(
                  (s) =>
                    s.count > 0 && (
                      <div
                        key={s.status}
                        style={{ width: `${s.percentage}%` }}
                        className={`${s.color} transition-all duration-300`}
                        title={`${s.label}: ${s.count} ta (${s.percentage}%)`}
                      />
                    )
                )}
              </div>

              {/* Status List Breakdown Cards */}
              <div className="grid grid-cols-2 gap-3">
                {ordersByStatus.map((s) => (
                  <div
                    key={s.status}
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/70 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
                      <span className="text-xs font-medium text-slate-700">{s.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-900">{s.count}</span>
                      <span className="text-[10px] text-slate-400 ml-1">({s.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Monthly Sales Performance */}
      <Card className="flex flex-col justify-between">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">Oylik savdo unumdorligi</CardTitle>
              <CardDescription className="text-xs mt-1">
                Oylar kesimida tuzilgan buyurtmalar soni
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[11px] font-normal">
              Hajm (dona)
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-6 flex-1 flex flex-col justify-center">
          {!canReadOrders ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Savdo statistikasini ko&apos;rish ruxsati mavjud emas.
            </div>
          ) : totalOrdersCount === 0 ? (
            <EmptyState
              variant="card"
              className="border-0 bg-transparent p-6 shadow-none"
              title="Oylik savdo yozuvlari yo'q"
              description="Oy davomida rasmiylashtirilgan buyurtmalar soni ushbu ustunli diagrammada aks etadi."
            />
          ) : (
            <div className="space-y-4">
              <div className="flex h-44 items-end gap-2 sm:gap-4 pt-4 border-b border-slate-100 pb-2">
                {monthlySales.map((pt) => {
                  const heightPercent = Math.max(
                    Math.round((pt.orderCount / maxMonthlyOrders) * 100),
                    pt.orderCount > 0 ? 10 : 2
                  );
                  return (
                    <div
                      key={pt.monthKey}
                      className="group flex flex-1 flex-col items-center justify-end h-full relative"
                    >
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] rounded px-2 py-1 pointer-events-none whitespace-nowrap z-10 shadow-md">
                        {pt.monthLabel}: {pt.orderCount} ta buyurtma
                      </div>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full max-w-[36px] rounded-t transition-all duration-300 ${
                          pt.orderCount > 0
                            ? "bg-violet-600 group-hover:bg-violet-700"
                            : "bg-slate-100"
                        }`}
                      />
                      <span className="mt-2 text-[10px] sm:text-xs font-medium text-slate-500 truncate w-full text-center">
                        {pt.monthLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>0 ta</span>
                <span className="font-medium text-slate-700">Maksimal: {maxMonthlyOrders} ta</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. Customer Growth Overview */}
      <Card className="flex flex-col justify-between">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">Mijozlar o&apos;sishi dinamikasi</CardTitle>
              <CardDescription className="text-xs mt-1">
                Yangi mijozlar qo&apos;shilishi sur&apos;ati
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[11px] font-normal">
              O&apos;sish
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-6 flex-1 flex flex-col justify-center">
          {!canReadCustomers ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Mijozlar statistikasini ko&apos;rish uchun `customers.read` ruxsati talab etiladi.
            </div>
          ) : !hasCustomerGrowthData ? (
            <EmptyState
              variant="card"
              className="border-0 bg-transparent p-6 shadow-none"
              title="Mijozlar bazasida yangi yozuvlar yo'q"
              description="Yangi mijozlar ro'yxatdan o'tkazilganda, oylik o'sish dinamikasi ushbu maydonda taqdim etiladi."
            />
          ) : (
            <div className="space-y-4">
              <div className="flex h-44 items-end gap-2 sm:gap-4 pt-4 border-b border-slate-100 pb-2">
                {customerGrowth.map((pt) => {
                  const heightPercent = Math.max(
                    Math.round((pt.newCustomers / maxCustomerGrowth) * 100),
                    pt.newCustomers > 0 ? 10 : 2
                  );
                  return (
                    <div
                      key={pt.monthKey}
                      className="group flex flex-1 flex-col items-center justify-end h-full relative"
                    >
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] rounded px-2 py-1 pointer-events-none whitespace-nowrap z-10 shadow-md">
                        {pt.monthLabel}: +{pt.newCustomers} ta yangi
                      </div>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full max-w-[36px] rounded-t transition-all duration-300 ${
                          pt.newCustomers > 0
                            ? "bg-emerald-600 group-hover:bg-emerald-700"
                            : "bg-slate-100"
                        }`}
                      />
                      <span className="mt-2 text-[10px] sm:text-xs font-medium text-slate-500 truncate w-full text-center">
                        {pt.monthLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>0 ta</span>
                <span className="font-medium text-slate-700">Maksimal: +{maxCustomerGrowth} yangi</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
