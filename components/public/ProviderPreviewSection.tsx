"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import { BadgeCheck, Star } from "lucide-react";
import { getGraphQLErrorCode } from "@/features/auth/auth-context";
import { PROVIDERS_QUERY } from "@/lib/providers/directory-graphql";
import { getProviderFallbackImage } from "@/lib/providers/provider-images";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ProviderDirectoryData = {
  providers: {
    results: ProviderItem[];
    items: ProviderItem[];
  };
};

type ProviderItem = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  profilePictureUrl: string | null;
  eligible: boolean;
  averageRating: number | null;
  reviewCount: number;
  specialties: string[];
  subSpecialties: string[];
  consultationFeeInitial: string | null;
  consultationFeeFollowup: string | null;
  bio: string | null;
};

export function ProviderPreviewSection() {
  const { data, loading, error } = useQuery<ProviderDirectoryData>(PROVIDERS_QUERY, {
    variables: { page: 1, limit: 3 },
    fetchPolicy: "network-only",
  });

  const providers = useMemo(
    () => data?.providers?.results ?? data?.providers?.items ?? [],
    [data?.providers?.items, data?.providers?.results],
  );

  const code = getGraphQLErrorCode(error);
  const accessDenied =
    code === "TENANT_ACCESS_DENIED" ||
    code === "PROVIDER_ACCESS_DENIED" ||
    code === "AUTH_TOKEN_INVALID" ||
    code === "AUTH_TOKEN_EXPIRED" ||
    code === "UNAUTHENTICATED";

  return (
    <section className="py-10 sm:py-14 lg:py-16">
      <Container className="space-y-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
              Provider directory
            </p>
            <h2 className="text-3xl sm:text-4xl">Find Verified Healthcare Providers</h2>
            <p>
              Browse specialists prepared to support diabetes care with clear communication and a
              structured digital experience.
            </p>
          </div>
          <Link
            href="/providers"
            className="shrink-0 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Browse all providers →
          </Link>
        </div>

        {error ? (
          <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
            {accessDenied
              ? "Sign in to browse our full provider directory."
              : "Unable to load providers right now. Please try again."}
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="h-64 animate-pulse bg-border/40" />
              ))
            : null}

          {providers.map((provider) => (
            <Card
              key={provider.id}
              className="flex h-full flex-col overflow-hidden border-border/80 transition-all duration-200 hover:-translate-y-1 hover:shadow-subtle"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-primary/10 via-white to-primary/5">
                {(provider.profilePictureUrl ?? provider.avatarUrl) ? (
                  <img
                    src={provider.profilePictureUrl ?? provider.avatarUrl!}
                    alt={provider.displayName}
                    className="size-full object-cover"
                  />
                ) : (
                  <Image
                    src={getProviderFallbackImage(provider.id)}
                    alt={provider.displayName}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    className="object-cover"
                  />
                )}
                <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 p-4">
                  <Badge variant="secondary" className="bg-white/90 text-text shadow-soft backdrop-blur">
                    {provider.specialties[0] ?? "Specialist"}
                  </Badge>
                  {provider.reviewCount > 0 && provider.averageRating != null ? (
                    <div className="flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-warning shadow-soft backdrop-blur">
                      <Star className="size-3.5 fill-current" />
                      {provider.averageRating.toFixed(1)} ({provider.reviewCount})
                    </div>
                  ) : provider.eligible ? (
                    <Badge variant="success" className="bg-white/90 shadow-soft backdrop-blur">
                      <BadgeCheck className="mr-1 size-3" />
                      Accepting patients
                    </Badge>
                  ) : null}
                </div>
              </div>
              <CardHeader className="space-y-3 pb-4">
                <div className="space-y-2">
                  <CardTitle className="text-xl">{provider.displayName}</CardTitle>
                  {provider.subSpecialties.length > 0 ? (
                    <p className="text-sm font-medium text-muted">
                      {provider.subSpecialties.slice(0, 2).join(" · ")}
                    </p>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-5">
                {provider.bio ? (
                  <p className="overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                    {provider.bio}
                  </p>
                ) : null}
                <div className="mt-auto flex flex-col gap-4 border-t border-border/80 pt-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm text-muted">Consultation fee</p>
                    <p className="text-base font-semibold text-text">
                      {provider.consultationFeeInitial != null
                        ? `ZMW ${provider.consultationFeeInitial}`
                        : "On request"}
                    </p>
                  </div>
                  <Button href={`/providers/${provider.id}`} variant="secondary" fullWidth className="sm:w-auto">
                    View Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {!loading && !error && providers.length === 0 ? (
            <Card className="lg:col-span-3">
              <CardContent className="py-10 text-center text-sm text-muted">
                No providers are available right now.
              </CardContent>
            </Card>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
