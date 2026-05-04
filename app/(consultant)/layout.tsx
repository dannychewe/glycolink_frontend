import { ConsultantShell } from "@/components/layout/ConsultantShell";
import { AuthGuard } from "@/features/auth/components/auth-guard";

type ConsultantLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function ConsultantLayout({ children }: ConsultantLayoutProps) {
  return (
    <AuthGuard allowedRoles={["CONSULTANT"]}>
      <ConsultantShell>{children}</ConsultantShell>
    </AuthGuard>
  );
}
