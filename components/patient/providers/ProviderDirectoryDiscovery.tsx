"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import Image from "next/image";
import { BadgeCheck, Globe2, MapPin, Star } from "lucide-react";
import { getGraphQLErrorCode } from "@/features/auth/auth-context";
import { PROVIDERS_QUERY } from "@/lib/providers/directory-graphql";
import {
  CONSULTANT_SPECIALTIES_QUERY,
  CONSULTANT_SUB_SPECIALTIES_QUERY,
} from "@/lib/consultant/provider-lifecycle-graphql";
import { getProviderFallbackImage } from "@/lib/providers/provider-images";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";

type ProviderDirectoryData = {
  providers: {
    total: number;
    page: number;
    limit: number;
    items: ProviderDirectoryItem[];
  };
};

type ProviderDirectoryItem = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  profilePictureUrl: string | null;
  bio: string | null;
  consultationFeeInitial: string | null;
  consultationFeeFollowup: string | null;
  specialties: string[];
  subSpecialties: string[];
  languages: string[];
  status: string;
  verificationStatus: string;
  eligible: boolean;
  averageRating: number | null;
  reviewCount: number;
  organization: {
    id: string;
    name: string;
    type: string;
  } | null;
};

type SpecialtyItem = { id: string; name: string };
type SubSpecialtyItem = { id: string; name: string; specialtyId: string; specialtyName: string };

export function ProviderDirectoryDiscovery() {
  const [filters, setFilters] = useState({
    search: "",
    specialtyId: "",
    subSpecialtyName: "",
    page: 1,
    limit: 20,
  });

  const { data, loading, error, refetch } = useQuery<ProviderDirectoryData>(PROVIDERS_QUERY, {
    variables: {
      search: filters.search || undefined,
      specialtyId: filters.specialtyId || undefined,
      page: filters.page,
      limit: filters.limit,
    },
    fetchPolicy: "network-only",
  });

  const { data: specialtiesData } = useQuery<{ specialties: SpecialtyItem[] }>(
    CONSULTANT_SPECIALTIES_QUERY,
  );
  const { data: subSpecialtiesData } = useQuery<{ subSpecialties: SubSpecialtyItem[] }>(
    CONSULTANT_SUB_SPECIALTIES_QUERY,
    { variables: { specialtyId: null } },
  );

  const code = getGraphQLErrorCode(error);
  const allProviders = useMemo(() => data?.providers?.items ?? [], [data?.providers?.items]);
  const providers = useMemo(() => {
    if (!filters.subSpecialtyName) return allProviders;
    return allProviders.filter((p) => p.subSpecialties.includes(filters.subSpecialtyName));
  }, [allProviders, filters.subSpecialtyName]);
  const total = data?.providers?.total ?? 0;

  const specialtyOptions = specialtiesData?.specialties ?? [];
  const subSpecialtyOptions = useMemo(() => {
    const all = subSpecialtiesData?.subSpecialties ?? [];
    if (!filters.specialtyId) return all;
    const spec = specialtyOptions.find((s) => s.id === filters.specialtyId);
    if (!spec) return all;
    return all.filter((ss) => ss.specialtyName === spec.name);
  }, [subSpecialtiesData, filters.specialtyId, specialtyOptions]);

  return (
    <div className="space-y-7">
      <header className="relative overflow-hidden rounded-[1.75rem] border border-border/80 bg-gradient-to-br from-primary/10 via-surface to-surface px-6 py-8 shadow-soft sm:px-8">
        <div className="absolute -right-12 -top-16 size-48 rounded-full bg-primary/10 blur-2xl" />
        <div className="relative space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
            Provider Directory
          </p>
          <h1 className="text-3xl font-semibold text-text sm:text-4xl">Find your care team</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted sm:text-base">
            Discover verified specialists, compare consultation options, and book directly from
            the provider profile.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant="secondary" className="bg-white/80">
              Secure tenant-scoped results
            </Badge>
            <Badge variant="secondary" className="bg-white/80">
              Verified providers only
            </Badge>
          </div>
        </div>
      </header>

      <Card className="border-border/80 shadow-soft">
        <CardHeader className="pb-4">
          <CardTitle>Filter providers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Name, specialty, keyword..."
                value={filters.search}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, search: event.target.value, page: 1 }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialty">Specialty</Label>
              <select
                id="specialty"
                value={filters.specialtyId}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    specialtyId: event.target.value,
                    subSpecialtyName: "",
                    page: 1,
                  }))
                }
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-text shadow-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">All specialties</option>
                {specialtyOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subSpecialty">Sub-specialty</Label>
              <select
                id="subSpecialty"
                value={filters.subSpecialtyName}
                disabled={subSpecialtyOptions.length === 0}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, subSpecialtyName: event.target.value, page: 1 }))
                }
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-text shadow-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              >
                <option value="">All sub-specialties</option>
                {subSpecialtyOptions.map((item) => (
                  <option key={item.id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            <Button type="button" onClick={() => void refetch()}>
              Apply Filters
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                setFilters({ search: "", specialtyId: "", subSpecialtyName: "", page: 1, limit: 20 })
              }
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {code === "TENANT_ACCESS_DENIED" || code === "PROVIDER_ACCESS_DENIED"
            ? "Access denied for provider directory in this tenant."
            : "Failed to load provider directory."}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-surface px-4 py-3 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          {loading
            ? "Loading providers..."
            : `Showing ${providers.length} of ${total} provider${total === 1 ? "" : "s"}`}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={filters.page <= 1 || loading}
            onClick={() =>
              setFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))
            }
          >
            Prev
          </Button>
          <span>Page {filters.page}</span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={loading || providers.length < filters.limit}
            onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
          >
            Next
          </Button>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
        {providers.map((provider) => (
          <Card
            key={provider.id}
            className={cn(
              "group flex h-full flex-col overflow-hidden border-border/80 transition-all duration-200",
              provider.eligible && "hover:-translate-y-1 hover:shadow-subtle",
            )}
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-primary/10 via-white to-primary/5">
              {(provider.profilePictureUrl ?? provider.avatarUrl) ? (
                <img
                  src={provider.profilePictureUrl ?? provider.avatarUrl!}
                  alt={provider.displayName}
                  className={cn(
                    "size-full object-cover transition-transform duration-300",
                    provider.eligible && "group-hover:scale-[1.03]",
                  )}
                />
              ) : (
                <Image
                  src={getProviderFallbackImage(provider.id)}
                  alt={provider.displayName}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1536px) 50vw, 33vw"
                  className={cn(
                    "object-cover transition-transform duration-300",
                    provider.eligible && "group-hover:scale-[1.03]",
                  )}
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
                    Available
                  </Badge>
                ) : null}
              </div>
            </div>
            <CardContent className="flex flex-1 flex-col gap-4 pt-5">
              <div className="space-y-1">
                <p className="text-lg font-semibold text-text">{provider.displayName}</p>
                {provider.subSpecialties.length > 0 ? (
                  <p className="text-sm font-medium text-primary">
                    {provider.subSpecialties.join(" · ")}
                  </p>
                ) : null}
              </div>

              {provider.bio ? (
                <p className="overflow-hidden text-ellipsis text-sm text-muted [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                  {provider.bio}
                </p>
              ) : null}

              <div className="space-y-1.5 text-sm text-muted">
                {provider.languages.length > 0 ? (
                  <div className="flex items-center gap-1.5">
                    <Globe2 className="size-3.5 shrink-0" />
                    {provider.languages.join(", ")}
                  </div>
                ) : null}
                <div className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 shrink-0" />
                  {provider.organization?.name ?? "Independent practice"}
                </div>
              </div>

              <div className="mt-auto flex flex-col gap-4 border-t border-border/80 pt-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs text-muted">Consultation fee</p>
                  <p className="text-lg font-semibold text-text">
                    {provider.consultationFeeInitial != null ? `ZMW ${provider.consultationFeeInitial}` : "On request"}
                  </p>
                </div>
                <Button href={`/patient/providers/${provider.id}/book`} fullWidth className="sm:w-auto">
                  View & Book
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!loading && providers.length === 0 ? (
          <Card className="md:col-span-2 2xl:col-span-3">
            <CardContent className="py-10 text-center text-sm text-muted">
              No providers match your current filters.
            </CardContent>
          </Card>
        ) : null}
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="h-64 animate-pulse bg-border/40" />
            ))
          : null}
      </div>
    </div>
  );
}
