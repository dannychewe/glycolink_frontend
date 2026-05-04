"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth/auth-context";

export function AuthRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, user, getDefaultAuthenticatedRoute } = useAuth();

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (!user) {
      const next = searchParams?.get("next");
      router.replace(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
      return;
    }

    const next = searchParams?.get("next");
    router.replace(next || getDefaultAuthenticatedRoute());
  }, [getDefaultAuthenticatedRoute, router, searchParams, status, user]);

  return <div className="px-6 py-10 text-sm text-muted">Resolving your destination...</div>;
}
