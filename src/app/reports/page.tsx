"use client";

import * as React from "react";
import { PageContainer } from "@/components/layout/page-container";
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

export default function ReportsPage() {
  const [isExportOpen, setIsExportOpen] = React.useState(false);

  return (
    <>
      <PageContainer
        title="Hisobotlar"
        description="Savdo statistikasi, konversiya va moliyaviy tahlil."
        breadcrumbs={[
          { label: "Boshqaruv paneli", href: "/" },
          { label: "Hisobotlar" },
        ]}
        actions={
          <Button
            variant="outline"
            size="md"
            onClick={() => setIsExportOpen(true)}
          >
            <svg
              width="16"
              height="16"
              className="h-4 w-4 shrink-0 mr-1.5 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Eksport (.xlsx)
          </Button>
        }
      >
        <EmptyState
          variant="dashed"
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          }
          title="Hisobotlar moduli tayyorlanmoqda"
          description="Tizim qoidalari asosida hech qanday sun'iy qiymatlar qo'shilmagan. Haqiqiy operatsiyalar ma'lumotlar bazasi integratsiyasidan so'ng hisob-kitob qilinadi."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExportOpen(true)}
            >
              Eksport parametrlarini ko&apos;rish
            </Button>
          }
        />
      </PageContainer>

      {/* Export Modal */}
      <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
        <DialogContent onClose={() => setIsExportOpen(false)}>
          <DialogHeader>
            <DialogTitle>Hisobotlarni eksport qilish</DialogTitle>
            <DialogDescription>
              Kerakli oraliq va formatni tanlang.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 leading-relaxed">
              <p className="font-semibold text-slate-800 mb-1">Eksport shakli:</p>
              Ma&apos;lumotlar bazasi ulangach, Excel (.xlsx) va PDF formatlarida to&apos;liq savdo va mijozlar hisoboti yuklab olinadi.
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsExportOpen(false)}
            >
              Yopish
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsExportOpen(false)}
            >
              Yuklab olish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
