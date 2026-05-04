"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { LogoutButton } from "@/components/layout/LogoutButton";

type DashboardShellProps = Readonly<{
  children: React.ReactNode;
  role: "Patient" | "Consultant" | "Admin";
}>;

export function DashboardShell({ children, role }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <Container className="flex items-center justify-between py-5">
          <div className="space-y-1">
            <Link href="/" className="text-lg font-semibold tracking-tight text-text">
              Naje Health
            </Link>
            <p className="text-sm text-muted">{role} workspace</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary">{role}</Badge>
            <LogoutButton variant="header" />
          </div>
        </Container>
      </header>
      <Container className="py-8">{children}</Container>
    </div>
  );
}
