"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { SearchDialog } from "./search-dialog";
import { NotificationsPopover } from "./notifications-popover";
import { UserMenu } from "./user-menu";

interface HeaderProps {
  isMobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
}

const pageTitles: Record<string, string> = {
  "/": "Boshqaruv paneli",
  "/customers": "Mijozlar",
  "/orders": "Buyurtmalar",
  "/products": "Mahsulotlar",
  "/employees": "Xodimlar",
  "/reports": "Hisobotlar",
  "/settings": "Sozlamalar",
};

export function Header({ isMobileMenuOpen, onToggleMobileMenu }: HeaderProps) {
  const pathname = usePathname();
  const currentTitle = pageTitles[pathname] || "ProjectCall";
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  // Keyboard shortcut for Ctrl + K / Cmd + K
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur-xs">
        {/* Left side: Mobile Toggle & Page Title / Breadcrumb */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="inline-flex items-center justify-center rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 lg:hidden shrink-0"
            aria-label={isMobileMenuOpen ? "Menyuni yopish" : "Menyuni ochish"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="sidebar-navigation"
          >
            <svg
              width="20"
              height="20"
              className="h-5 w-5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 truncate">
            <span className="hidden sm:inline-block text-xs font-medium text-slate-400 shrink-0">
              Asosiy
            </span>
            <span className="hidden sm:inline-block text-slate-300 shrink-0">/</span>
            <h2 className="text-sm sm:text-base font-semibold text-slate-900 tracking-tight truncate">
              {currentTitle}
            </h2>
          </div>
        </div>

        {/* Right side: Search, Notifications & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Search Trigger Button */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            aria-label="Tizim bo'yicha qidiruv (Ctrl + K)"
            className="group relative flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-400 transition-colors hover:border-slate-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 sm:w-60 md:w-72"
          >
            <svg
              width="16"
              height="16"
              className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-slate-600 transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <span className="hidden sm:inline text-slate-400">Qidirish...</span>
            <span className="sm:hidden text-slate-400">Qidiruv</span>
            <kbd className="ml-auto hidden sm:inline-block rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 shadow-2xs">
              ⌘K
            </kbd>
          </button>

          {/* Notifications Dropdown */}
          <NotificationsPopover />

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          {/* User Profile Menu */}
          <UserMenu />
        </div>
      </header>

      {/* Global Command / Search Palette */}
      <SearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </>
  );
}
