import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { KpiMetrics } from "@/lib/dashboard/types";

interface KpiCardsProps {
  kpis: KpiMetrics;
}

function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined) return "—";
  return new Intl.NumberFormat("uz-UZ", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(amount) + " UZS";
}

function formatCount(count: number | null): string {
  if (count === null || count === undefined) return "—";
  return new Intl.NumberFormat("uz-UZ").format(count);
}

export function KpiCards({ kpis }: KpiCardsProps) {
  const cards = [
    {
      title: "Jami mijozlar",
      value: formatCount(kpis.totalCustomers),
      isAvailable: kpis.totalCustomers !== null,
      subtext:
        kpis.totalCustomers !== null
          ? kpis.totalCustomers === 0
            ? "Mijozlar bazasi bo'sh"
            : `${kpis.newCustomersThisMonth ?? 0} ta bu oyda qo'shildi`
          : "Ruxsat etilmagan",
      badge: kpis.totalCustomers !== null ? "CRM" : null,
      badgeVariant: "default" as const,
      icon: (
        <svg
          width="20"
          height="20"
          className="h-5 w-5 text-blue-600 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.75}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
          />
        </svg>
      ),
      iconBg: "bg-blue-50/80",
    },
    {
      title: "Jami xodimlar",
      value: formatCount(kpis.totalEmployees),
      isAvailable: kpis.totalEmployees !== null,
      subtext:
        kpis.totalEmployees !== null
          ? `${kpis.activeEmployees ?? 0} ta faol xodim`
          : "Ruxsat etilmagan",
      badge: kpis.totalEmployees !== null ? "Jamoa" : null,
      badgeVariant: "secondary" as const,
      icon: (
        <svg
          width="20"
          height="20"
          className="h-5 w-5 text-indigo-600 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.75}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
          />
        </svg>
      ),
      iconBg: "bg-indigo-50/80",
    },
    {
      title: "Jami buyurtmalar",
      value: formatCount(kpis.totalOrders),
      isAvailable: kpis.totalOrders !== null,
      subtext:
        kpis.totalOrders !== null
          ? kpis.totalOrders === 0
            ? "Buyurtmalar hozircha yo'q"
            : "Barcha rasmiylashtirilgan"
          : "Ruxsat etilmagan",
      badge: kpis.totalOrders !== null ? "Savdo" : null,
      badgeVariant: "default" as const,
      icon: (
        <svg
          width="20"
          height="20"
          className="h-5 w-5 text-violet-600 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.75}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
          />
        </svg>
      ),
      iconBg: "bg-violet-50/80",
    },
    {
      title: "Kutilayotgan buyurtmalar",
      value: formatCount(kpis.pendingOrders),
      isAvailable: kpis.pendingOrders !== null,
      subtext:
        kpis.pendingOrders !== null
          ? kpis.pendingOrders === 0
            ? "Kutilayotganlar yo'q"
            : "Ko'rib chiqish kutilmoqda"
          : "Ruxsat etilmagan",
      badge: kpis.pendingOrders !== null && kpis.pendingOrders > 0 ? "Kutilmoqda" : null,
      badgeVariant: "warning" as const,
      icon: (
        <svg
          width="20"
          height="20"
          className="h-5 w-5 text-amber-600 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.75}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      iconBg: "bg-amber-50/80",
    },
    {
      title: "Bajarilgan buyurtmalar",
      value: formatCount(kpis.completedOrders),
      isAvailable: kpis.completedOrders !== null,
      subtext:
        kpis.completedOrders !== null
          ? kpis.completedOrders === 0
            ? "Bajarilganlar yo'q"
            : "Muvaffaqiyatli yakunlangan"
          : "Ruxsat etilmagan",
      badge: kpis.completedOrders !== null && kpis.completedOrders > 0 ? "Yakunlangan" : null,
      badgeVariant: "success" as const,
      icon: (
        <svg
          width="20"
          height="20"
          className="h-5 w-5 text-emerald-600 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.75}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      iconBg: "bg-emerald-50/80",
    },
    {
      title: "Umumiy tushum",
      value: formatCurrency(kpis.totalRevenue),
      isAvailable: kpis.totalRevenue !== null,
      subtext:
        kpis.totalRevenue !== null
          ? kpis.totalRevenue === 0
            ? "Mablag' tushumi yo'q"
            : "Bajarilgan buyurtmalardan"
          : "Moliyaviy ruxsat cheklangan",
      badge: kpis.totalRevenue !== null ? "Daromad" : null,
      badgeVariant: "success" as const,
      icon: (
        <svg
          width="20"
          height="20"
          className="h-5 w-5 text-emerald-600 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.75}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      iconBg: "bg-emerald-50/80",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <Card
          key={card.title}
          className="p-5 flex flex-col justify-between transition-all duration-150 hover:border-slate-300 hover:shadow-sm"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500 leading-tight">
              {card.title}
            </span>
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${card.iconBg}`}>
              {card.icon}
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-baseline justify-between gap-2">
              <span
                className={`text-2xl font-bold tracking-tight ${
                  card.isAvailable ? "text-slate-900" : "text-slate-400"
                }`}
              >
                {card.value}
              </span>
              {card.badge && (
                <Badge variant={card.badgeVariant} className="text-[10px] shrink-0 font-medium">
                  {card.badge}
                </Badge>
              )}
            </div>
            <p className="mt-1 text-[11px] text-slate-500 truncate">
              {card.subtext}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}
