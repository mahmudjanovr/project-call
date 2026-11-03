import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import type { RecentOrder, RecentCustomer, RecentEmployeeActivity } from "@/lib/dashboard/types";

interface RecentActivityProps {
  recentOrders: RecentOrder[];
  recentCustomers: RecentCustomer[];
  recentEmployeeActivity: RecentEmployeeActivity[];
  canReadOrders: boolean;
  canReadCustomers: boolean;
  canReadEmployees: boolean;
}

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatRelativeTime(date: Date | null): string {
  if (!date) return "—";
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Hozirgina";
  if (diffMins < 60) return `${diffMins} daqiqa oldin`;
  if (diffHours < 24) return `${diffHours} soat oldin`;
  if (diffDays === 1) return "Kecha";
  if (diffDays < 7) return `${diffDays} kun oldin`;
  return formatDate(date);
}

function getOrderStatusBadge(status: string) {
  switch (status?.toLowerCase()) {
    case "completed":
      return <Badge variant="success">Bajarildi</Badge>;
    case "processing":
      return <Badge variant="default">Jarayonda</Badge>;
    case "pending":
      return <Badge variant="warning">Kutilmoqda</Badge>;
    case "cancelled":
      return <Badge variant="destructive">Bekor qilindi</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export function RecentActivity({
  recentOrders,
  recentCustomers,
  recentEmployeeActivity,
  canReadOrders,
  canReadCustomers,
  canReadEmployees,
}: RecentActivityProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* 1. Latest Orders (2 Columns on large screens) */}
      <Card className="lg:col-span-2 flex flex-col justify-between">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <CardTitle className="text-sm font-semibold">So&apos;nggi buyurtmalar</CardTitle>
            <CardDescription className="text-xs mt-1">
              Tizimga kiritilgan eng oxirgi rasmiylashtirilgan savdolar
            </CardDescription>
          </div>
          {canReadOrders && (
            <Link
              href="/orders"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
            >
              Barchasini ko&apos;rish
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </CardHeader>

        <CardContent className="p-0 flex-1 flex flex-col justify-center">
          {!canReadOrders ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Buyurtmalar ro&apos;yxatini ko&apos;rish ruxsati mavjud emas.
            </div>
          ) : recentOrders.length === 0 ? (
            <EmptyState
              variant="card"
              className="border-0 bg-transparent p-8 shadow-none"
              title="So'nggi buyurtmalar mavjud emas"
              description="Hozircha tizimda birorta ham buyurtma rasmiylashtirilmagan."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table className="rounded-none border-0 shadow-none">
                <TableHeader>
                  <TableRow>
                    <TableHead>Buyurtma ID</TableHead>
                    <TableHead>Mijoz</TableHead>
                    <TableHead>Summa</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead>Sana</TableHead>
                    <TableHead className="text-right">Amal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-slate-50/60">
                      <TableCell className="font-medium text-slate-900 text-xs">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell className="text-xs text-slate-700">
                        {order.customerName}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-slate-900">
                        {new Intl.NumberFormat("uz-UZ").format(order.amount)} UZS
                      </TableCell>
                      <TableCell>{getOrderStatusBadge(order.status)}</TableCell>
                      <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                        {formatRelativeTime(order.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href="/orders"
                          className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          Batafsil
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Customer & Employee Activity Feeds (1 Column on large screens) */}
      <div className="space-y-6">
        {/* Recently Added Customers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Yangi mijozlar
              </CardTitle>
              <CardDescription className="text-[11px] mt-0.5">
                Oxirgi qo&apos;shilgan mijozlar profillari
              </CardDescription>
            </div>
            {canReadCustomers && (
              <Link
                href="/customers"
                className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
              >
                Mijozlar &rarr;
              </Link>
            )}
          </CardHeader>

          <CardContent className="pt-3">
            {!canReadCustomers ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Mijozlarni ko&apos;rish ruxsati yo&apos;q.
              </div>
            ) : recentCustomers.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Hozircha yangi mijozlar ro&apos;yxati bo&apos;sh.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentCustomers.map((cust) => (
                  <div key={cust.id} className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0">
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {cust.name}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{cust.phone}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 block">
                        {formatRelativeTime(cust.createdAt)}
                      </span>
                      <Link
                        href="/customers"
                        className="text-[11px] text-blue-600 hover:underline font-medium"
                      >
                        Profil &rarr;
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Employee Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Xodimlar faoliyati
              </CardTitle>
              <CardDescription className="text-[11px] mt-0.5">
                Xodimlar tizimga kirish va faollik holati
              </CardDescription>
            </div>
            {canReadEmployees && (
              <Link
                href="/employees"
                className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
              >
                Xodimlar &rarr;
              </Link>
            )}
          </CardHeader>

          <CardContent className="pt-3">
            {!canReadEmployees ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Xodimlar faoliyatini ko&apos;rish ruxsati cheklangan.
              </div>
            ) : recentEmployeeActivity.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Xodimlar qaydnomasi topilmadi.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentEmployeeActivity.map((emp) => (
                  <div key={emp.id} className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0">
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {emp.fullName}
                        </p>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate pl-3">
                        {emp.position || emp.department || emp.employeeCode}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 block">
                        {emp.lastLoginAt ? formatRelativeTime(emp.lastLoginAt) : "Yangi xodim"}
                      </span>
                      <Link
                        href="/employees"
                        className="text-[11px] text-blue-600 hover:underline font-medium"
                      >
                        Batafsil
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
