"use client";

import { useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useMobileMenu } from "@/hooks/use-mobile-menu";
import { useAuth } from "@/features/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/", label: "Home", exact: true },
  { href: "/providers", label: "Providers", exact: false },
  { href: "/how-it-works", label: "How it works", exact: false },
];

export function Navbar() {
  const { isOpen, toggleMenu, closeMenu } = useMobileMenu();
  const [isPending, startTransition] = useTransition();
  const { isAuthenticated, user, logout, getDefaultAuthenticatedRoute } = useAuth();
  const pathname = usePathname();

  function handleLogout() {
    startTransition(() => {
      void logout();
      closeMenu();
    });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="font-display text-xl font-bold tracking-tight text-ink">Naje Health</span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden items-center gap-0.5 md:flex">
          {navItems.map(({ href, label, exact }) => {
            const isActive = exact ? pathname === href : (pathname ?? "").startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/8 text-primary"
                    : "text-muted hover:bg-surface hover:text-text",
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop auth actions */}
        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated && user ? (
            <>
              <Button href={getDefaultAuthenticatedRoute()} variant="secondary" size="sm">
                Dashboard
              </Button>
              <Button type="button" size="sm" onClick={handleLogout} disabled={isPending}>
                {isPending ? "Signing out…" : "Sign out"}
              </Button>
            </>
          ) : (
            <>
              <Button href="/login" variant="secondary" size="sm">
                Log in
              </Button>
              <Button href="/register" size="sm">
                Get started
              </Button>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-surface text-text md:hidden"
          onClick={toggleMenu}
          aria-label="Toggle navigation menu"
          aria-expanded={isOpen}
        >
          {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </Container>

      {/* Mobile menu */}
      <div
        className={cn(
          "overflow-hidden border-t border-border bg-background transition-[max-height] duration-300 md:hidden",
          isOpen ? "max-h-96" : "max-h-0",
        )}
      >
        <Container className="flex flex-col gap-0.5 py-3">
          {navItems.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-xl px-3 py-2.5 text-sm font-medium text-text transition hover:bg-surface"
              onClick={closeMenu}
            >
              {label}
            </Link>
          ))}

          <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
            {isAuthenticated && user ? (
              <>
                <Button href={getDefaultAuthenticatedRoute()} variant="secondary" fullWidth>
                  Dashboard
                </Button>
                <Button type="button" onClick={handleLogout} disabled={isPending} fullWidth>
                  {isPending ? "Signing out…" : "Sign out"}
                </Button>
              </>
            ) : (
              <>
                <Button href="/login" variant="secondary" fullWidth>
                  Log in
                </Button>
                <Button href="/register" fullWidth>
                  Get started
                </Button>
              </>
            )}
          </div>
        </Container>
      </div>
    </header>
  );
}
