import type { Metadata } from "next";
import { GraphqlProviderDetail } from "@/components/public/GraphqlProviderDetail";
import { Container } from "@/components/ui/container";

type ProviderDetailPageProps = Readonly<{
  params: Promise<{
    id: string;
  }>;
}>;

type ProviderSeoData = {
  provider: {
    id: string;
    displayName: string;
    bio: string | null;
    specialties: string[];
    subSpecialties: string[];
    languages: string[];
  } | null;
};

const PROVIDER_SEO_QUERY = `
  query ProviderSeo($id: UUID!) {
    provider(id: $id) {
      id
      displayName
      bio
      specialties
      subSpecialties
      languages
    }
  }
`;

function getGraphqlEndpoint() {
  return process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ?? "http://localhost:8000/graphql/";
}

function cleanText(value: string | null | undefined) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function truncateDescription(value: string) {
  if (value.length <= 160) return value;
  return `${value.slice(0, 157).trimEnd()}...`;
}

async function fetchProviderSeo(id: string) {
  try {
    const response = await fetch(getGraphqlEndpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: PROVIDER_SEO_QUERY,
        variables: { id },
      }),
      cache: "no-store",
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as {
      data?: ProviderSeoData;
      errors?: unknown[];
    };

    if (payload.errors?.length) return null;
    return payload.data?.provider ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: ProviderDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const provider = await fetchProviderSeo(id);

  if (!provider) {
    return {
      title: "Provider Profile | Naje Health",
      description: "View provider profile and consultation details from the provider directory.",
    };
  }

  const primarySpecialty = provider.specialties[0];
  const title = primarySpecialty
    ? `${provider.displayName} - ${primarySpecialty} | Naje Health`
    : `${provider.displayName} | Naje Health`;
  const fallbackDescription = [
    provider.displayName,
    primarySpecialty,
    provider.subSpecialties.length > 0 ? provider.subSpecialties.join(", ") : null,
    provider.languages.length > 0 ? `Languages: ${provider.languages.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join(" | ");
  const description = truncateDescription(cleanText(provider.bio) || fallbackDescription);

  return {
    title,
    description,
    keywords: [
      provider.displayName,
      ...provider.specialties,
      ...provider.subSpecialties,
      ...provider.languages,
      "diabetes care",
      "healthcare provider",
      "online consultation",
      "Naje Health",
    ],
    alternates: {
      canonical: `/providers/${provider.id}`,
    },
    openGraph: {
      title,
      description,
      type: "profile",
      url: `/providers/${provider.id}`,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function ProviderDetailPage({ params }: ProviderDetailPageProps) {
  const { id } = await params;

  return (
    <Container className="space-y-10 py-10 sm:py-14">
      <GraphqlProviderDetail providerId={id} />
    </Container>
  );
}
