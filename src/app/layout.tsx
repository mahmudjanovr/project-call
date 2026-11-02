import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { AuthProvider } from "@/components/auth/auth-provider";
import { getCurrentAuth } from "@/lib/auth/rbac";

export const metadata: Metadata = {
  title: "ProjectCall — CRM va Savdo Tizimi",
  description: "Kompaniya ichki CRM va savdo boshqaruvi tizimi",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const auth = await getCurrentAuth();
  const initialAuth = auth
    ? {
        user: auth.user,
        employee: auth.employee,
        role: auth.role,
        permissions: auth.permissions,
      }
    : null;

  return (
    <html lang="uz">
      <body className="antialiased">
        <AuthProvider initialAuth={initialAuth}>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
