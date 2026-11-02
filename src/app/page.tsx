"use client";

import * as React from "react";
import { PageContainer } from "@/components/layout/page-container";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function HomePage() {
  const [isQuickActionOpen, setIsQuickActionOpen] = React.useState(false);

  const statCards = [
    {
      title: "Faol mijozlar",
      subtitle: "Mijozlar bazasi ulanishi kutilmoqda",
      icon: (
        <svg
          width="20"
          height="20"
          className="h-5 w-5 shrink-0 text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.75}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
    },
    {
      title: "Yangi buyurtmalar",
      subtitle: "Savdo moduli ulanishi kutilmoqda",
      icon: (
        <svg
          width="20"
          height="20"
          className="h-5 w-5 shrink-0 text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.75}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      ),
    },
    {
      title: "Oylik savdo tushumi",
      subtitle: "Moliyaviy hisobotlar kutilmoqda",
      icon: (
        <svg
          width="20"
          height="20"
          className="h-5 w-5 shrink-0 text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.75}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: "Faol xodimlar",
      subtitle: "Xodimlar roʻyxati kutilmoqda",
      icon: (
        <svg
          width="20"
          height="20"
          className="h-5 w-5 shrink-0 text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.75}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      ),
    },
  ];

  const modules = [
    { name: "Mijozlar boshqaruvi (CRM)", status: "Rejalashtirilgan", phase: "2.x bosqich" },
    { name: "Buyurtmalar va savdo jarayoni", status: "Rejalashtirilgan", phase: "2.x bosqich" },
    { name: "Mahsulotlar katalogi", status: "Rejalashtirilgan", phase: "2.x bosqich" },
    { name: "Xodimlar va rollar tizimi", status: "Rejalashtirilgan", phase: "3.x bosqich" },
    { name: "Tahliliy hisobotlar va eksport", status: "Rejalashtirilgan", phase: "3.x bosqich" },
  ];

  return (
    <>
      <PageContainer
        title="Boshqaruv paneli"
        description="ProjectCall kompaniya ichki CRM va savdo boshqaruvi tizimi."
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsQuickActionOpen(true)}
          >
            <svg
              width="16"
              height="16"
              className="h-4 w-4 shrink-0 mr-1.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Tezkor amal
          </Button>
        }
      >
        <div className="space-y-6">
          {/* Welcome Section */}
          <Card className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                  Xush kelibsiz, Aziz Rahimov!
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
                  ProjectCall tizimining barcha asosiy korporativ UI komponentlari,
                  navigatsiya va boshqaruv paneli poydevori to&apos;liq tayyor holatda.
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                <Badge variant="outline" className="px-3 py-1.5 text-xs text-slate-700 bg-slate-50">
                  <span className="font-semibold text-slate-900 mr-1.5">Holat:</span> Interfeys tayyor
                </Badge>
              </div>
            </div>
          </Card>

          {/* Empty Statistic Card Placeholders */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((card) => (
              <Card
                key={card.title}
                className="p-5 flex flex-col justify-between transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold tracking-wide text-slate-500">
                    {card.title}
                  </span>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50/80">
                    {card.icon}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-2xl font-bold tracking-tight text-slate-400">
                    —
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {card.subtitle}
                  </p>
                </div>
              </Card>
            ))}
          </div>

          {/* Main Dashboard Grid: Activity & Modular Architecture */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Recent Activity Empty State (2 Columns on large screens) */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <CardTitle className="text-sm font-semibold">
                    Oxirgi amallar va harakatlar
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Tizimda amalga oshirilgan so&apos;nggi amallar jurnali
                  </CardDescription>
                </div>
                <Badge variant="secondary">
                  Jurnal bo&apos;sh
                </Badge>
              </CardHeader>

              <CardContent className="pt-6">
                <EmptyState
                  variant="card"
                  className="border-0 bg-transparent p-6 sm:p-8"
                  icon={
                    <svg
                      width="24"
                      height="24"
                      className="h-6 w-6 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  title="Hozircha hech qanday harakat qayd etilmagan"
                  description="Ma'lumotlar bazasi va biznes modullari ulangandan so'ng, barcha mijoz qo'shilishi, buyurtmalar va to'lov amallari ushbu maydonda avtomatik aks ettiriladi."
                />
              </CardContent>
            </Card>

            {/* Module Readiness / Architectural Status (1 Column on large screens) */}
            <Card>
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-sm font-semibold">
                  Modulli arxitektura rejasi
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Biznes modullarining bosqichma-bosqich kiritilishi
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-4 space-y-3 divide-y divide-slate-100">
                {modules.map((m) => (
                  <div key={m.name} className="pt-3 first:pt-0 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-800">{m.name}</p>
                      <p className="text-[11px] text-slate-400">{m.phase}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {m.status}
                    </Badge>
                  </div>
                ))}

                <div className="pt-4">
                  <div className="rounded-lg bg-blue-50/60 border border-blue-100 p-3">
                    <p className="text-[11px] text-blue-900 leading-relaxed">
                      <strong>Eslatma:</strong> Loyiha talablariga muvofiq, soxta ma&apos;lumotlar kiritilmagan.
                      Haqiqiy ma&apos;lumotlar PostgreSQL integratsiyasidan so&apos;ng taqdim etiladi.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>

      {/* Quick Action Modal Dialog */}
      <Dialog open={isQuickActionOpen} onOpenChange={setIsQuickActionOpen}>
        <DialogContent onClose={() => setIsQuickActionOpen(false)}>
          <DialogHeader>
            <DialogTitle>Tezkor amal</DialogTitle>
            <DialogDescription>
              Yangi mijoz yoki buyurtma yaratish uchun qulay modal darcha.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <p className="text-xs text-slate-600 leading-relaxed">
              Biznes modullari (Mijozlar va Buyurtmalar) keyingi bosqichda ma&apos;lumotlar bazasi jadvallari bilan ulangach, ushbu shakl orqali to&apos;g&apos;ridan-to&apos;g&apos;ri ma&apos;lumot kiritiladi.
            </p>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              <span className="font-semibold text-slate-900">Holat: </span>
              Modal oynasi va forma primitivlari to&apos;liq ishchi holatda.
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsQuickActionOpen(false)}
            >
              Yopish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
