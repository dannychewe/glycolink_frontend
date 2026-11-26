import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";

export function LegalPage({
  eyebrow,
  title,
  updated = "26 November 2026",
  children,
}: Readonly<{
  eyebrow: string;
  title: string;
  updated?: string;
  children: ReactNode;
}>) {
  return (
    <Container className="max-w-4xl py-10 sm:py-16">
      <div className="mb-10 max-w-3xl space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
          {eyebrow}
        </p>
        <h1 className="text-3xl sm:text-4xl">{title}</h1>
        <p className="text-sm">Effective date: {updated}</p>
      </div>
      <article className="legal-copy space-y-8">{children}</article>
    </Container>
  );
}

export function LegalSection({
  title,
  children,
}: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl sm:text-2xl">{title}</h2>
      <div className="space-y-3 text-base leading-7 text-muted">{children}</div>
    </section>
  );
}
