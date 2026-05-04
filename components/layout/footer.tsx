import Link from "next/link";
import { Container } from "@/components/ui/container";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface/80">
      <Container className="flex flex-col gap-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Naje Health. All rights reserved.</p>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/" className="transition hover:text-text">
            Privacy
          </Link>
          <Link href="/" className="transition hover:text-text">
            Terms
          </Link>
          <Link href="/" className="transition hover:text-text">
            Contact
          </Link>
        </div>
      </Container>
    </footer>
  );
}
