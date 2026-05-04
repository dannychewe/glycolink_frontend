"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { getAdminPageTitle } from "@/lib/navigation/admin-navigation";
import { cn } from "@/lib/utils/cn";

type AdminShellProps = Readonly<{
  children: React.ReactNode;
}>;

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    setIsDrawerOpen(false);
  }, [pathname]);

  const pageTitle = getAdminPageTitle(pathname);

  return (
    <div className="min-h-screen bg-background text-text">
      <div className="hidden md:fixed md:inset-y-0 md:left-0 md:z-30 md:block md:w-60">
        <AdminSidebar />
      </div>

      <div className="md:pl-60">
        <AdminHeader title={pageTitle} onMenuClick={() => setIsDrawerOpen(true)} />

        <main className="min-h-screen px-4 py-5 sm:px-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>

      <div
        className={cn(
          "fixed inset-0 z-40 md:hidden",
          isDrawerOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!isDrawerOpen}
      >
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setIsDrawerOpen(false)}
          className={cn(
            "absolute inset-0 bg-slate-950/35 transition-opacity",
            isDrawerOpen ? "opacity-100" : "opacity-0",
          )}
        />

        <div
          className={cn(
            "absolute inset-y-0 left-0 w-72 max-w-[85vw] transform transition-transform",
            isDrawerOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <AdminSidebar onNavigate={() => setIsDrawerOpen(false)} className="shadow-subtle" />
        </div>
      </div>
    </div>
  );
}

