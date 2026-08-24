import { redirect } from "next/navigation";

type AcceptClinicPatientInvitePageProps = Readonly<{
  searchParams: Promise<{ token?: string }>;
}>;

export default async function AcceptClinicPatientInvitePage({
  searchParams,
}: AcceptClinicPatientInvitePageProps) {
  const { token } = await searchParams;
  const suffix = token ? `?token=${encodeURIComponent(token)}` : "";
  redirect(`/accept-patient-invite${suffix}`);
}
