import { PatientShell } from "@/components/layout/PatientShell";
import { AuthGuard } from "@/features/auth/components/auth-guard";

type PatientLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function PatientLayout({ children }: PatientLayoutProps) {
  return (
    <AuthGuard allowedRoles={["CLIENT", "PATIENT", "STANDARD_USER"]}>
      <PatientShell>{children}</PatientShell>
    </AuthGuard>
  );
}
