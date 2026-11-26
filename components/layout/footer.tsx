import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface/80">
      <Container className="flex flex-col gap-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Logo variant="horizontal" className="h-5 w-auto" />
          <p>© {new Date().getFullYear()} Naje Health. All rights reserved.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/privacy" className="transition hover:text-text">
            Privacy
          </Link>
          <Link href="/terms" className="transition hover:text-text">
            Terms
          </Link>
          <Link href="/delete-account" className="transition hover:text-text">
            Delete account
          </Link>
          <Link
            href="/medical-disclaimer"
            className="transition hover:text-text"
          >
            Medical notice
          </Link>
          <a
            href="mailto:support@najehealth.com"
            className="transition hover:text-text"
          >
            Contact
          </a>
        </div>
      </Container>
    </footer>
  );
}
