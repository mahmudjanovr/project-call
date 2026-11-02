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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = React.useState<"general" | "security" | "notifications">("general");
  const [companyName, setCompanyName] = React.useState("ProjectCall CRM");
  const [systemLang, setSystemLang] = React.useState("O'zbekcha (Lotin)");
  const [contactEmail, setContactEmail] = React.useState("admin@projectcall.uz");
  const [savedSuccess, setSavedSuccess] = React.useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <PageContainer
      title="Sozlamalar"
      description="Tizim konfiguratsiyasi, umumiy parametrlar va tashkilot ma'lumotlari."
      breadcrumbs={[
        { label: "Boshqaruv paneli", href: "/" },
        { label: "Sozlamalar" },
      ]}
    >
      <div className="max-w-3xl space-y-6">
        {/* Settings Navigation Tabs */}
        <div className="flex items-center gap-1.5 border-b border-slate-200 pb-px">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 -mb-px ${
              activeTab === "general"
                ? "border-blue-600 text-blue-600 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Umumiy profil
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("security")}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 -mb-px ${
              activeTab === "security"
                ? "border-blue-600 text-blue-600 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Xavfsizlik
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("notifications")}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 -mb-px ${
              activeTab === "notifications"
                ? "border-blue-600 text-blue-600 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Bildirishnomalar
          </button>
        </div>

        {/* Tab 1: General Profile */}
        {activeTab === "general" && (
          <Card>
            <form onSubmit={handleSave}>
              <CardHeader>
                <CardTitle>Tashkilot profili</CardTitle>
                <CardDescription>
                  Kompaniya nomi va tizimning asosiy parametrlari
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {savedSuccess && (
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-center gap-2">
                    <svg
                      width="16"
                      height="16"
                      className="h-4 w-4 shrink-0 text-emerald-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span>O&apos;zgarishlar muvaffaqiyatli saqlandi!</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="company-name" required>
                    Tashkilot nomi
                  </Label>
                  <Input
                    id="company-name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    aria-describedby="company-name-desc"
                  />
                  <p id="company-name-desc" className="text-[11px] text-slate-400">
                    Barcha hisobotlar va interfeysda ko&apos;rinadigan kompaniya nomi.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="contact-email" required>
                    Aloqa pochtasi
                  </Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="system-lang">
                    Birlamchi interfeys tili
                  </Label>
                  <Input
                    id="system-lang"
                    value={systemLang}
                    onChange={(e) => setSystemLang(e.target.value)}
                  />
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <Button type="submit" variant="primary" size="md">
                    O&apos;zgarishlarni saqlash
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={() => {
                      setCompanyName("ProjectCall CRM");
                      setContactEmail("admin@projectcall.uz");
                    }}
                  >
                    Asliga qaytarish
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        )}

        {/* Tab 2: Security */}
        {activeTab === "security" && (
          <Card>
            <CardHeader>
              <CardTitle>Xavfsizlik sozlamalari</CardTitle>
              <CardDescription>
                Parol va xavfsizlik protokollari
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="cur-pass">Joriy parol</Label>
                <Input id="cur-pass" type="password" placeholder="••••••••" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-pass">Yangi parol</Label>
                <Input id="new-pass" type="password" placeholder="••••••••" />
              </div>
              <div className="pt-2">
                <Button variant="primary" size="md" onClick={() => alert("Parolni yangilash keyingi bosqichda autentifikatsiya bilan birga ulanadi.")}>
                  Parolni yangilash
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab 3: Notifications */}
        {activeTab === "notifications" && (
          <Card>
            <CardHeader>
              <CardTitle>Bildirishnoma parametrlari</CardTitle>
              <CardDescription>
                Tizim va pochta bildirishnomalarini sozlash
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <div>
                  <p className="text-xs font-medium text-slate-800">Yangi buyurtma bildirishnomalari</p>
                  <p className="text-[11px] text-slate-500">Yangi buyurtma tushganda brauzerda ogohlantirish</p>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500" />
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <div>
                  <p className="text-xs font-medium text-slate-800">Haftalik savdo sarhisobi</p>
                  <p className="text-[11px] text-slate-500">Elektron pochtaga haftalik hisobot yuborish</p>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
