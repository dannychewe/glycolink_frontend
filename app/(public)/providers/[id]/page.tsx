import { redirect } from "next/navigation";

type ProviderRedirectProps = Readonly<{
  params: Promise<{ id: string }>;
}>;

export default async function ProviderRedirect({ params }: ProviderRedirectProps) {
  const { id } = await params;
  redirect(`/our-team/${id}`);
}
