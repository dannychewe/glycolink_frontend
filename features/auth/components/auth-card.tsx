import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type AuthCardProps = Readonly<{
  title: string;
  description?: string;
  notice?: string;
  children: React.ReactNode;
}>;

export function AuthCard({ title, description, notice, children }: AuthCardProps) {
  return (
    <div className="flex min-h-[calc(100vh-4.5rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link
            href="/"
            className="text-xl font-semibold tracking-tight text-text hover:text-primary transition-colors"
          >
            Naje Health
          </Link>
        </div>

        {notice ? (
          <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{notice}</span>
          </div>
        ) : null}

        <Card>
          <CardHeader>
            <h1 className="text-2xl font-semibold text-text">{title}</h1>
            {description ? (
              <p className="text-sm text-muted">{description}</p>
            ) : null}
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}
