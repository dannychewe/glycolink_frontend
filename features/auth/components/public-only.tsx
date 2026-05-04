"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-context";

export function PublicOnly({ children }: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const { status, user, getDefaultAuthenticatedRoute } = useAuth();

  useEffect(() => {
    if (status !== "authenticated" || !user) {
      return;
    }

    router.replace(getDefaultAuthenticatedRoute());
  }, [getDefaultAuthenticatedRoute, router, status, user]);

  if (status === "loading") {
    return <div className="px-6 py-10 text-sm text-muted">Checking your session...</div>;
  }

  if (status === "authenticated" && user) {
    return null;
  }

  return <>{children}</>;
}
