"use client";

import { useState } from "react";
import { useApolloClient, useMutation } from "@apollo/client";
import { LOGOUT_MUTATION } from "@/lib/auth/graphql";
import { clearStoredTokens, getRefreshToken } from "@/lib/auth/storage";
import { cn } from "@/lib/utils/cn";

type LogoutButtonProps = Readonly<{
  variant?: "sidebar" | "header";
}>;

export function LogoutButton({ variant = "sidebar" }: LogoutButtonProps) {
  const client = useApolloClient();
  const [loading, setLoading] = useState(false);
  const [logout] = useMutation(LOGOUT_MUTATION);

  async function handleLogout() {
    setLoading(true);
    const refreshToken = getRefreshToken();

    // Best-effort server-side revocation; do not block redirect on it
    if (refreshToken) {
      try {
        await logout({ variables: { refreshToken } });
      } catch {
        // ignored — we clear locally regardless
      }
    }

    clearStoredTokens();
    await client.clearStore();
    window.location.replace("/login");
  }

  if (variant === "header") {
    return (
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted transition hover:border-danger/40 hover:text-danger disabled:opacity-50"
      >
        <svg viewBox="0 0 24 24" fill="none" className="size-3.5" aria-hidden="true">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {loading ? "Signing out…" : "Sign out"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition",
        "text-muted hover:bg-background hover:text-danger disabled:opacity-50",
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-5 shrink-0" aria-hidden="true">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
