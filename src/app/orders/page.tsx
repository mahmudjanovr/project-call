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

export default function OrdersPage() {
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  return (
    <>
      <PageContainer
        title="Buyurtmalar"
        description="Savdo buyurtmalari, statuslar va to'lovlar monitoringi."
        breadcrumbs={[
          { label: "Boshqaruv paneli", href: "/" },
          { label: "Buyurtmalar" },
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
            + Yangi buyurtma
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
                placeholder="Buyurtma ID yoki mijoz..."
                className="pl-9 h-9 text-xs"
                aria-label="Buyurtmalarni qidirish"
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
                Holat bo&apos;yicha
              </Button>
            </div>
          </div>

          {/* Orders Table with Empty State */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <Table className="rounded-none border-0 shadow-none">
              <TableHeader>
                <TableRow>
                  <TableHead>Buyurtma ID</TableHead>
                  <TableHead>Mijoz</TableHead>
                  <TableHead>Summa</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead>Sana</TableHead>
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
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                      }
                      title="Hozircha buyurtmalar mavjud emas"
                      description="Buyurtmalarni qabul qilish va statuslarni boshqarish biznes jarayoni keyingi bosqichda ulanadi."
                      action={
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsAddModalOpen(true)}
                        >
                          + Yangi buyurtma yaratish
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

      {/* Add Order Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent onClose={() => setIsAddModalOpen(false)}>
          <DialogHeader>
            <DialogTitle>Yangi buyurtma rasmiylashtirish</DialogTitle>
            <DialogDescription>
              Buyurtma tafsilotlari va xaridor ma&apos;lumotlari.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="order-cust" required>
                Mijozni tanlang
              </Label>
              <Input id="order-cust" placeholder="Mijoz nomi yoki telefoni..." />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="order-amount" required>
                Buyurtma summasi (UZS)
              </Label>
              <Input id="order-amount" type="number" placeholder="0" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="order-desc">
                Qo&apos;shimcha ma&apos;lumot
              </Label>
              <Input id="order-desc" placeholder="Yetkazib berish yoki to'lov turi..." />
            </div>

            <div className="rounded-lg bg-blue-50/70 border border-blue-100 p-3 text-xs text-blue-900">
              <span className="font-semibold">Eslatma:</span> Ushbu shakl buyurtmalar moduli ma&apos;lumotlar bazasiga ulangandan so&apos;ng avtomatik hisob-kitobni amalga oshiradi.
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
              Yaratish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
