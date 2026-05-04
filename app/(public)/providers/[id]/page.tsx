import type { Metadata } from "next";
import { GraphqlProviderDetail } from "@/components/public/GraphqlProviderDetail";
import { Container } from "@/components/ui/container";

type ProviderDetailPageProps = Readonly<{
  params: Promise<{
    id: string;
  }>;
}>;

export const metadata: Metadata = {
  title: "Provider Profile | Naje Health",
  description: "View provider profile and consultation details from the GraphQL directory.",
};

export default async function ProviderDetailPage({ params }: ProviderDetailPageProps) {
  const { id } = await params;

  return (
    <Container className="space-y-10 py-10 sm:py-14">
      <GraphqlProviderDetail providerId={id} />
    </Container>
  );
}
