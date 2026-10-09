"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth/auth-context";
import { safeCareDestination, pendingCareDestination, clearCareDestination } from "@/lib/auth/care-destination";

export function AuthRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, user, getDefaultAuthenticatedRoute } = useAuth();

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (!user) {
      const next = safeCareDestination(searchParams?.get("next")) ?? pendingCareDestination();
      router.replace(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
      return;
    }

    const next = safeCareDestination(searchParams?.get("next")) ?? pendingCareDestination();
    if (next) clearCareDestination();
    router.replace(next || getDefaultAuthenticatedRoute());
  }, [getDefaultAuthenticatedRoute, router, searchParams, status, user]);

  return <div className="px-6 py-10 text-sm text-muted">Resolving your destination...</div>;
}
