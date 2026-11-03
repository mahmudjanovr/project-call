"use client";

import * as React from "react";
import type { SafeUser, Employee, Role } from "@/db/schema";
import { logoutAction } from "@/lib/auth/actions";

export interface AuthContextType {
  user: SafeUser | null;
  employee: Employee | null;
  role: Role | null;
  permissions: string[];
  hasPermission: (permissionCode: string) => boolean;
  hasAnyPermission: (permissionCodes: string[]) => boolean;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType>({
  user: null,
  employee: null,
  role: null,
  permissions: [],
  hasPermission: () => false,
  hasAnyPermission: () => false,
  logout: async () => {},
});

export interface AuthProviderProps {
  children: React.ReactNode;
  initialAuth: {
    user: SafeUser;
    employee: Employee;
    role: Role;
    permissions: string[];
  } | null;
}

const PERMISSION_ALIASES: Record<string, string[]> = {
  "users:manage": ["users.read", "users.create", "users.update", "users.delete"],
  "employees:manage": ["employees.read", "employees.create", "employees.update", "employees.delete"],
  "roles:manage": ["roles.read", "roles.manage"],
  "products:manage": ["settings.manage"],
  "system:settings:manage": ["settings.manage"],
  "system:settings:read": ["settings.read", "settings.manage"],
  "audit:read": ["audit.read"],
  "customers:read": ["customers.read"],
  "customers:create": ["customers.create"],
  "orders:create": ["orders.create"],
  "orders:submit": ["orders.submit"],
  "orders:review": ["orders.review"],
  "orders:approve": ["orders.approve"],
  "orders:reject": ["orders.reject"],
  "operations:read": ["reports.read"],
};

export function AuthProvider({ children, initialAuth }: AuthProviderProps) {
  const user = initialAuth?.user ?? null;
  const employee = initialAuth?.employee ?? null;
  const role = initialAuth?.role ?? null;
  const permissions = React.useMemo(() => initialAuth?.permissions ?? [], [initialAuth?.permissions]);

  const hasPermission = React.useCallback(
    (permissionKey: string) => {
      if (permissions.includes(permissionKey)) return true;
      const aliases = PERMISSION_ALIASES[permissionKey];
      return Boolean(aliases && aliases.some((a) => permissions.includes(a)));
    },
    [permissions]
  );

  const hasAnyPermission = React.useCallback(
    (permissionCodes: string[]) => permissionCodes.some((code) => hasPermission(code)),
    [hasPermission]
  );

  const logout = React.useCallback(async () => {
    await logoutAction();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        employee,
        role,
        permissions,
        hasPermission,
        hasAnyPermission,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
