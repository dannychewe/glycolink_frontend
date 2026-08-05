import { Suspense } from "react";
import { AuthCard } from "@/features/auth/components/auth-card";
import { AcceptProviderOrganizationInvitePanel } from "@/features/auth/components/accept-provider-organization-invite-panel";

export default function AcceptProviderOrganizationInvitePage() {
  return (
    <AuthCard
      title="Join an organization"
      description="Accept your provider invitation so the organization admin can approve your membership."
    >
      <Suspense>
        <AcceptProviderOrganizationInvitePanel />
      </Suspense>
    </AuthCard>
  );
}
