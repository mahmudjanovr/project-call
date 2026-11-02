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

export default function ProductsPage() {
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  return (
    <>
      <PageContainer
        title="Mahsulotlar"
        description="Kompaniya tovar va xizmatlari nomenklaturasi, narxlar."
        breadcrumbs={[
          { label: "Boshqaruv paneli", href: "/" },
          { label: "Mahsulotlar" },
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
            + Yangi mahsulot
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
                placeholder="Mahsulot nomi yoki artikul..."
                className="pl-9 h-9 text-xs"
                aria-label="Mahsulotlarni qidirish"
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
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
                Kategoriyalar
              </Button>
            </div>
          </div>

          {/* Products Table with Empty State */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <Table className="rounded-none border-0 shadow-none">
              <TableHeader>
                <TableRow>
                  <TableHead>Artikul</TableHead>
                  <TableHead>Mahsulot / Xizmat nomi</TableHead>
                  <TableHead>Kategoriya</TableHead>
                  <TableHead>Narx (UZS)</TableHead>
                  <TableHead>Holat</TableHead>
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
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                        </svg>
                      }
                      title="Mahsulotlar katalogi bo'sh"
                      description="Kompaniya tovar va xizmat turlari keyingi bosqichda kiritiladi."
                      action={
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsAddModalOpen(true)}
                        >
                          + Yangi mahsulot qo&apos;shish
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

      {/* Add Product Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent onClose={() => setIsAddModalOpen(false)}>
          <DialogHeader>
            <DialogTitle>Yangi mahsulot yoki xizmat</DialogTitle>
            <DialogDescription>
              Katalogga yangi tovar yoki xizmat turini qo&apos;shish.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="prod-name" required>
                Nomi
              </Label>
              <Input id="prod-name" placeholder="Masalan: Konsalting xizmati" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prod-price" required>
                Narxi (UZS)
              </Label>
              <Input id="prod-price" type="number" placeholder="100000" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prod-cat">
                Kategoriya
              </Label>
              <Input id="prod-cat" placeholder="Xizmatlar yoki Mahsulotlar" />
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
