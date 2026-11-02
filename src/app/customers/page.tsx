"use client";

import * as React from "react";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function CustomersPage() {
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  return (
    <>
      <PageContainer
        title="Mijozlar"
        description="Kompaniya mijozlar bazasi, aloqalar va muzokaralar tarixi."
        breadcrumbs={[
          { label: "Boshqaruv paneli", href: "/" },
          { label: "Mijozlar" },
        ]}
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsAddModalOpen(true)}
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
            + Yangi mijoz
          </Button>
        }
      >
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
            <div className="relative flex-1 sm:max-w-xs">
              <svg
                width="16"
                height="16"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 shrink-0 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
              <Input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ism yoki telefon bo'yicha qidirish..."
                className="pl-9 h-9 text-xs"
                aria-label="Mijozlarni qidirish"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <svg
                  width="14"
                  height="14"
                  className="h-3.5 w-3.5 shrink-0 mr-1.5 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                </svg>
                Filtrlar
              </Button>
            </div>
          </div>

          {/* Customers Table with Empty State */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <Table className="rounded-none border-0 shadow-none">
              <TableHeader>
                <TableRow>
                  <TableHead>Mijoz ID</TableHead>
                  <TableHead>F.I.SH.</TableHead>
                  <TableHead>Telefon raqam</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead>Qo&apos;shilgan sana</TableHead>
                  <TableHead className="text-right">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center">
                    <EmptyState
                      variant="card"
                      className="border-0 bg-transparent shadow-none p-0"
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
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                        </svg>
                      }
                      title="Mijozlar ro'yxati hozircha bo'sh"
                      description="Ushbu modul keyingi bosqichda PostgreSQL ma'lumotlar bazasi va Drizzle ORM bilan ulanadi."
                      action={
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsAddModalOpen(true)}
                        >
                          + Yangi mijoz qo&apos;shish
                        </Button>
                      }
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <Pagination totalItems={0} currentPage={1} totalPages={1} />
          </div>
        </div>
      </PageContainer>

      {/* Add Customer Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent onClose={() => setIsAddModalOpen(false)}>
          <DialogHeader>
            <DialogTitle>Yangi mijoz qo&apos;shish</DialogTitle>
            <DialogDescription>
              Mijoz to&apos;g&apos;risidagi asosiy aloqa ma&apos;lumotlarini kiriting.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cust-name" required>
                F.I.SH. (Mijoz nomi)
              </Label>
              <Input id="cust-name" placeholder="Masalan: Sardor Aliyev" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cust-phone" required>
                Telefon raqam
              </Label>
              <Input id="cust-phone" placeholder="+998 90 123 45 67" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cust-notes">
                Izoh yoki manzil
              </Label>
              <Input id="cust-notes" placeholder="Qo'shimcha eslatma..." />
            </div>

            <div className="rounded-lg bg-blue-50/70 border border-blue-100 p-3 text-xs text-blue-900">
              <span className="font-semibold">Eslatma:</span> Ushbu modal forma poydevor sifatida to&apos;liq tayyorlandi. Ma&apos;lumotlar bazasi ulangach yozuvlar saqlanadi.
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsAddModalOpen(false)}
            >
              Bekor qilish
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsAddModalOpen(false)}
            >
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
