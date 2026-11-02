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
import {
  getEmployeesList,
  getRolesList,
  createEmployeeAction,
  toggleEmployeeStatusAction,
  resetEmployeePasswordAction,
  type EmployeeListItem,
} from "@/lib/auth/actions";
import type { Role } from "@/db/schema";
import { useAuth } from "@/components/auth/auth-provider";

export default function EmployeesPage() {
  const { hasPermission } = useAuth();
  const [employees, setEmployees] = React.useState<EmployeeListItem[]>([]);
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);

  // Add Employee Modal State
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [addError, setAddError] = React.useState<string | null>(null);

  // Form inputs
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [employeeCode, setEmployeeCode] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [roleId, setRoleId] = React.useState("");
  const [position, setPosition] = React.useState("");
  const [department, setDepartment] = React.useState("");
  const [password, setPassword] = React.useState("");

  // Reset Password Modal State
  const [resetModalEmployee, setResetModalEmployee] = React.useState<EmployeeListItem | null>(null);
  const [newPassword, setNewPassword] = React.useState("");
  const [resetError, setResetError] = React.useState<string | null>(null);
  const [isResetting, setIsResetting] = React.useState(false);

  // Status toggle state
  const [togglingId, setTogglingId] = React.useState<string | null>(null);

  // Load data
  const loadData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const [empList, roleList] = await Promise.all([
        getEmployeesList(),
        getRolesList(),
      ]);
      setEmployees(empList);
      setRoles(roleList);
      if (roleList.length > 0 && roleList[0] && !roleId) {
        setRoleId(roleList[0].id);
      }
    } catch {
      // Unauthenticated or insufficient permissions
    } finally {
      setIsLoading(false);
    }
  }, [roleId]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Create Employee
  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setIsSubmitting(true);

    try {
      const res = await createEmployeeAction({
        firstName,
        lastName,
        employeeCode,
        email,
        roleId,
        position,
        department,
        password,
      });

      if (!res.success) {
        setAddError(res.error || "Xodim yaratishda xatolik yuz berdi.");
      } else {
        setIsAddModalOpen(false);
        // Reset form
        setFirstName("");
        setLastName("");
        setEmployeeCode("");
        setEmail("");
        setPosition("");
        setDepartment("");
        setPassword("");
        await loadData();
      }
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : "Xatolik yuz berdi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Toggle Active Status
  const handleToggleStatus = async (employee: EmployeeListItem) => {
    setTogglingId(employee.id);
    try {
      const res = await toggleEmployeeStatusAction(employee.id, !employee.isActive);
      if (res.success) {
        await loadData();
      }
    } finally {
      setTogglingId(null);
    }
  };

  // Handle Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalEmployee) return;

    setResetError(null);
    setIsResetting(true);

    try {
      const res = await resetEmployeePasswordAction(resetModalEmployee.id, newPassword);
      if (!res.success) {
        setResetError(res.error || "Parolni o'zgartirishda xatolik yuz berdi.");
      } else {
        setResetModalEmployee(null);
        setNewPassword("");
      }
    } catch (err: unknown) {
      setResetError(err instanceof Error ? err.message : "Xatolik yuz berdi.");
    } finally {
      setIsResetting(false);
    }
  };

  // Filtered employees
  const filteredEmployees = employees.filter((emp) => {
    const term = searchTerm.toLowerCase();
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    return (
      fullName.includes(term) ||
      emp.email.toLowerCase().includes(term) ||
      emp.employeeCode.toLowerCase().includes(term) ||
      (emp.position && emp.position.toLowerCase().includes(term)) ||
      emp.roleDisplayName.toLowerCase().includes(term)
    );
  });

  return (
    <>
      <PageContainer
        title="Xodimlar"
        description="Sotuv menejerlari, operatorlar va xodimlar ro'yxati."
        breadcrumbs={[
          { label: "Boshqaruv paneli", href: "/" },
          { label: "Xodimlar" },
        ]}
        actions={
          hasPermission("employees:manage") && (
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setAddError(null);
                setIsAddModalOpen(true);
              }}
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
              + Yangi xodim
            </Button>
          )
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
                placeholder="Xodim ismi, kodi yoki lavozimi..."
                className="pl-9 h-9 text-xs"
                aria-label="Xodimlarni qidirish"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              Jami xodimlar soni: <span className="font-semibold text-slate-800">{employees.length}</span>
            </div>
          </div>

          {/* Employees Table */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <Table className="rounded-none border-0 shadow-none">
              <TableHeader>
                <TableRow>
                  <TableHead>Xodim ID</TableHead>
                  <TableHead>F.I.SH.</TableHead>
                  <TableHead>Lavozim / Rol</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead className="text-right">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-xs text-slate-400">
                      Ma&apos;lumotlar yuklanmoqda...
                    </TableCell>
                  </TableRow>
                ) : filteredEmployees.length === 0 ? (
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
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                          </svg>
                        }
                        title={searchTerm ? "Qidiruv bo'yicha xodim topilmadi" : "Xodimlar ro'yxati hozircha bo'sh"}
                        description={
                          searchTerm
                            ? "Boshqa qidiruv so'zini kiritib ko'ring."
                            : "Tizimga yangi xodim qo'shish uchun yuqoridagi tugmani bosing."
                        }
                        action={
                          !searchTerm && hasPermission("employees:manage") ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setIsAddModalOpen(true)}
                            >
                              + Yangi xodim qo&apos;shish
                            </Button>
                          ) : undefined
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((emp) => (
                    <TableRow key={emp.id} className="hover:bg-slate-50/70">
                      <TableCell className="font-mono text-xs font-medium text-slate-600">
                        {emp.employeeCode}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-900">
                        {emp.firstName} {emp.lastName}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-slate-800">
                            {emp.position || "Belgilanmagan"}
                          </span>
                          <span className="text-[11px] text-blue-600 font-semibold">
                            {emp.roleDisplayName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {emp.email}
                      </TableCell>
                      <TableCell>
                        {emp.isActive ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200/60">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Faol
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 border border-slate-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                            Nofaol
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {hasPermission("users:manage") && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={togglingId === emp.id}
                                onClick={() => handleToggleStatus(emp)}
                                className={emp.isActive ? "text-slate-600 hover:text-rose-600" : "text-emerald-600"}
                                aria-label={emp.isActive ? "Faolsizlantirish" : "Faollashtirish"}
                              >
                                {emp.isActive ? "O'chirish" : "Faollashtirish"}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setResetError(null);
                                  setNewPassword("");
                                  setResetModalEmployee(emp);
                                }}
                                aria-label="Parolni tiklash"
                              >
                                Parol
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <Pagination
              totalItems={filteredEmployees.length}
              currentPage={1}
              totalPages={1}
            />
          </div>
        </div>
      </PageContainer>

      {/* Add Employee Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent onClose={() => setIsAddModalOpen(false)}>
          <DialogHeader>
            <DialogTitle>Yangi xodim qo&apos;shish</DialogTitle>
            <DialogDescription>
              Tizimga yangi xodim profili va autentifikatsiya hisobini biriktirish.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateEmployee}>
            <div className="py-4 space-y-3.5">
              {addError && (
                <div className="p-3 rounded-lg border border-rose-200 bg-rose-50 text-xs text-rose-700">
                  {addError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="emp-firstname" required>
                    Ism
                  </Label>
                  <Input
                    id="emp-firstname"
                    placeholder="Masalan: Nodira"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="emp-lastname" required>
                    Familiya
                  </Label>
                  <Input
                    id="emp-lastname"
                    placeholder="Masalan: Karimova"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="emp-code" required>
                    Xodim kodi (ID)
                  </Label>
                  <Input
                    id="emp-code"
                    placeholder="Masalan: EMP-002"
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="emp-role-select" required>
                    Tizimdagi rol
                  </Label>
                  <select
                    id="emp-role-select"
                    value={roleId}
                    onChange={(e) => setRoleId(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                    required
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.displayName} ({r.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="emp-email" required>
                  Email
                </Label>
                <Input
                  id="emp-email"
                  type="email"
                  placeholder="nodira.karimova@projectcall.uz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="emp-position">
                    Lavozim
                  </Label>
                  <Input
                    id="emp-position"
                    placeholder="Sotuv menejeri"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="emp-dept">
                    Bo&apos;lim
                  </Label>
                  <Input
                    id="emp-dept"
                    placeholder="Sotuv bo'limi"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="emp-password" required>
                  Boshlang&apos;ich parol (kamida 8 ta belgi)
                </Label>
                <Input
                  id="emp-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setIsAddModalOpen(false)}
                disabled={isSubmitting}
              >
                Bekor qilish
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saqlanmoqda..." : "Qo'shish"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Modal */}
      {resetModalEmployee && (
        <Dialog open={true} onOpenChange={() => setResetModalEmployee(null)}>
          <DialogContent onClose={() => setResetModalEmployee(null)}>
            <DialogHeader>
              <DialogTitle>Parolni yangilash</DialogTitle>
              <DialogDescription>
                {resetModalEmployee.firstName} {resetModalEmployee.lastName} ({resetModalEmployee.email}) uchun yangi parol belgilash.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleResetPassword}>
              <div className="py-4 space-y-3">
                {resetError && (
                  <div className="p-3 rounded-lg border border-rose-200 bg-rose-50 text-xs text-rose-700">
                    {resetError}
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="new-password" required>
                    Yangi parol (kamida 8 ta belgi)
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <p className="text-[11px] text-slate-500">
                    Parol yangilangach, xodimning mavjud barcha sessiyalari avtomatik tugatiladi.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setResetModalEmployee(null)}
                  disabled={isResetting}
                >
                  Bekor qilish
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isResetting}
                >
                  {isResetting ? "Saqlanmoqda..." : "Parolni yangilash"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
