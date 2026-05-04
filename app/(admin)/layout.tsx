import { AdminShell } from "@/components/layout/AdminShell";
import { AuthGuard } from "@/features/auth/components/auth-guard";

type AdminLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AuthGuard requireSystemAdmin>
      <AdminShell>{children}</AdminShell>
    </AuthGuard>
  );
}
