import { ProviderWorkspaceView } from "@/components/patient/consultants/ProviderWorkspaceView";

type WorkspacePageProps = Readonly<{
  params: Promise<{
    inviteId: string;
  }>;
}>;

export default async function ConsultantWorkspacePage({ params }: WorkspacePageProps) {
  const { inviteId } = await params;

  return <ProviderWorkspaceView inviteId={inviteId} />;
}
