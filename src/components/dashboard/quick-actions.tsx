"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  createCustomerAction,
  createOrderAction,
  getCustomerOptionsAction,
} from "@/lib/dashboard/actions";
import type { DashboardPermissions } from "@/lib/dashboard/types";

interface QuickActionsProps {
  permissions: DashboardPermissions;
}

export function QuickActions({ permissions }: QuickActionsProps) {
  const router = useRouter();

  // Modals state
  const [isCustomerModalOpen, setIsCustomerModalOpen] = React.useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = React.useState(false);

  // Customer form state
  const [custName, setCustName] = React.useState("");
  const [custPhone, setCustPhone] = React.useState("");
  const [custEmail, setCustEmail] = React.useState("");
  const [custCompany, setCustCompany] = React.useState("");
  const [custNotes, setCustNotes] = React.useState("");
  const [custLoading, setCustLoading] = React.useState(false);
  const [custError, setCustError] = React.useState<string | null>(null);

  // Order form state
  const [customerOptions, setCustomerOptions] = React.useState<
    Array<{ id: string; name: string; phone: string }>
  >([]);
  const [orderCustomerId, setOrderCustomerId] = React.useState("");
  const [orderAmount, setOrderAmount] = React.useState("");
  const [orderStatus, setOrderStatus] = React.useState<"pending" | "processing" | "completed">("pending");
  const [orderNotes, setOrderNotes] = React.useState("");
  const [orderLoading, setOrderLoading] = React.useState(false);
  const [orderError, setOrderError] = React.useState<string | null>(null);

  // Load customer options when order modal opens
  React.useEffect(() => {
    if (isOrderModalOpen) {
      getCustomerOptionsAction().then((res) => {
        if (res.success && res.data) {
          setCustomerOptions(res.data);
          if (res.data.length > 0 && res.data[0] && !orderCustomerId) {
            setOrderCustomerId(res.data[0].id);
          }
        }
      });
    }
  }, [isOrderModalOpen, orderCustomerId]);

  async function handleCreateCustomer(e: React.FormEvent) {
    e.preventDefault();
    if (!custName || !custPhone) {
      setCustError("Ism va telefon raqami kiritilishi shart.");
      return;
    }

    setCustLoading(true);
    setCustError(null);

    const res = await createCustomerAction({
      name: custName,
      phone: custPhone,
      email: custEmail || undefined,
      company: custCompany || undefined,
      notes: custNotes || undefined,
    });

    setCustLoading(false);

    if (res.success) {
      setIsCustomerModalOpen(false);
      setCustName("");
      setCustPhone("");
      setCustEmail("");
      setCustCompany("");
      setCustNotes("");
      router.refresh();
    } else {
      setCustError(res.error || "Xatolik yuz berdi.");
    }
  }

  async function handleCreateOrder(e: React.FormEvent) {
    e.preventDefault();
    const amountNum = Number(orderAmount);
    if (!orderCustomerId) {
      setOrderError("Iltimos, mijozni tanlang yoki avval yangi mijoz qo'shing.");
      return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      setOrderError("Summani to'g'ri kiriting (0 dan katta).");
      return;
    }

    setOrderLoading(true);
    setOrderError(null);

    const res = await createOrderAction({
      customerId: orderCustomerId,
      amount: amountNum,
      status: orderStatus,
      notes: orderNotes || undefined,
    });

    setOrderLoading(false);

    if (res.success) {
      setIsOrderModalOpen(false);
      setOrderAmount("");
      setOrderNotes("");
      setOrderStatus("pending");
      router.refresh();
    } else {
      setOrderError(res.error || "Xatolik yuz berdi.");
    }
  }

  const hasAnyAction =
    permissions.canCreateCustomer ||
    permissions.canCreateEmployee ||
    permissions.canCreateOrder ||
    permissions.canReadReports;

  if (!hasAnyAction) return null;

  return (
    <>
      {/* Quick Action Buttons Group */}
      <div className="flex flex-wrap items-center gap-2">
        {/* 1. Add Customer */}
        {permissions.canCreateCustomer && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCustomerModalOpen(true)}
            className="bg-white hover:bg-slate-50 text-slate-700"
          >
            <svg
              width="14"
              height="14"
              className="h-3.5 w-3.5 text-blue-600 shrink-0 mr-1.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            + Mijoz qo&apos;shish
          </Button>
        )}

        {/* 2. Create Order */}
        {permissions.canCreateOrder && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsOrderModalOpen(true)}
          >
            <svg
              width="14"
              height="14"
              className="h-3.5 w-3.5 shrink-0 mr-1.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            + Buyurtma yaratish
          </Button>
        )}

        {/* 3. Add Employee */}
        {permissions.canCreateEmployee && (
          <Link href="/employees">
            <Button
              variant="outline"
              size="sm"
              className="bg-white hover:bg-slate-50 text-slate-700"
            >
              <svg
                width="14"
                height="14"
                className="h-3.5 w-3.5 text-indigo-600 shrink-0 mr-1.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
              </svg>
              + Xodim qo&apos;shish
            </Button>
          </Link>
        )}

        {/* 4. View Reports */}
        {permissions.canReadReports && (
          <Link href="/reports">
            <Button
              variant="outline"
              size="sm"
              className="bg-white hover:bg-slate-50 text-slate-700"
            >
              <svg
                width="14"
                height="14"
                className="h-3.5 w-3.5 text-emerald-600 shrink-0 mr-1.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                />
              </svg>
              Hisobotlar
            </Button>
          </Link>
        )}
      </div>

      {/* Modal 1: Add Customer */}
      <Dialog open={isCustomerModalOpen} onOpenChange={setIsCustomerModalOpen}>
        <DialogContent onClose={() => setIsCustomerModalOpen(false)}>
          <DialogHeader>
            <DialogTitle>Yangi mijoz qo&apos;shish</DialogTitle>
            <DialogDescription>
              Mijozning asosiy aloqa ma&apos;lumotlarini to&apos;ldiring. Ma&apos;lumotlar bazasiga to&apos;g&apos;ridan-to&apos;g&apos;ri yoziladi.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCustomer}>
            <div className="py-4 space-y-3.5">
              {custError && (
                <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700">
                  {custError}
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="cust-name-input" required>
                  F.I.SH. yoki Kompaniya nomi
                </Label>
                <Input
                  id="cust-name-input"
                  placeholder="Masalan: Aziz Rahimov"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="cust-phone-input" required>
                  Telefon raqam
                </Label>
                <Input
                  id="cust-phone-input"
                  placeholder="+998 90 123 45 67"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="cust-email-input">Email (ixtiyoriy)</Label>
                  <Input
                    id="cust-email-input"
                    type="email"
                    placeholder="mijoz@kompaniya.uz"
                    value={custEmail}
                    onChange={(e) => setCustEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cust-company-input">Tashkilot nomi</Label>
                  <Input
                    id="cust-company-input"
                    placeholder="MCHJ yoki korxona"
                    value={custCompany}
                    onChange={(e) => setCustCompany(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="cust-notes-input">Qo&apos;shimcha izoh</Label>
                <Input
                  id="cust-notes-input"
                  placeholder="Manzil yoki maxsus eslatma..."
                  value={custNotes}
                  onChange={(e) => setCustNotes(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                size="md"
                type="button"
                onClick={() => setIsCustomerModalOpen(false)}
                disabled={custLoading}
              >
                Bekor qilish
              </Button>
              <Button variant="primary" size="md" type="submit" disabled={custLoading}>
                {custLoading ? "Saqlanmoqda..." : "Mijozni saqlash"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Create Order */}
      <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
        <DialogContent onClose={() => setIsOrderModalOpen(false)}>
          <DialogHeader>
            <DialogTitle>Yangi buyurtma rasmiylashtirish</DialogTitle>
            <DialogDescription>
              Mijozni tanlang va buyurtma summasini kiriting.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateOrder}>
            <div className="py-4 space-y-3.5">
              {orderError && (
                <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700">
                  {orderError}
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="order-customer-select" required>
                  Mijozni tanlang
                </Label>
                {customerOptions.length === 0 ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-800">
                    <p className="font-semibold">Mijozlar bazasi bo&apos;sh!</p>
                    <p className="mt-1">
                      Buyurtma yaratish uchun avval &ldquo;+ Mijoz qo&apos;shish&rdquo; tugmasi orqali mijoz ro&apos;yxatdan o&apos;tkazing.
                    </p>
                  </div>
                ) : (
                  <select
                    id="order-customer-select"
                    value={orderCustomerId}
                    onChange={(e) => setOrderCustomerId(e.target.value)}
                    className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  >
                    {customerOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="order-amount-input" required>
                  Buyurtma summasi (UZS)
                </Label>
                <Input
                  id="order-amount-input"
                  type="number"
                  min="1"
                  step="1000"
                  placeholder="Masalan: 1500000"
                  value={orderAmount}
                  onChange={(e) => setOrderAmount(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="order-status-select">Buyurtma holati</Label>
                <select
                  id="order-status-select"
                  value={orderStatus}
                  onChange={(e) =>
                    setOrderStatus(e.target.value as "pending" | "processing" | "completed")
                  }
                  className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="pending">Kutilmoqda (Pending)</option>
                  <option value="processing">Jarayonda (Processing)</option>
                  <option value="completed">Bajarildi (Completed / Daromad hisoblanadi)</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="order-notes-input">Qo&apos;shimcha ma&apos;lumot</Label>
                <Input
                  id="order-notes-input"
                  placeholder="Yetkazib berish yoki mahsulot nomi..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                size="md"
                type="button"
                onClick={() => setIsOrderModalOpen(false)}
                disabled={orderLoading}
              >
                Bekor qilish
              </Button>
              <Button
                variant="primary"
                size="md"
                type="submit"
                disabled={orderLoading || customerOptions.length === 0}
              >
                {orderLoading ? "Yaratilmoqda..." : "Buyurtmani yaratish"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
