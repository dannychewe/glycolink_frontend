"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import Image from "next/image";
import { BadgeCheck, Globe2, MapPin } from "lucide-react";
import { getGraphQLErrorCode } from "@/features/auth/auth-context";
import { CONSULTANTS_QUERY } from "@/lib/healthcare/graphql";
import { getProviderFallbackImage } from "@/lib/providers/provider-images";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils/cn";

type ProviderDirectoryData = {
  consultants: ProviderDirectoryItem[];
};

type ProviderDirectoryItem = {
  id: string;
  displayName: string;
  firstName: string;
  lastName: string;
  specialty: string;
  biography: string | null;
  languages: string[];
  status: string;
  acceptingPatients: boolean;
  clinic: {
    id: string;
    name: string;
  } | null;
};

export function ProviderDirectoryDiscovery() {
  const [filters, setFilters] = useState({
    search: "",
    specialty: "",
    page: 1,
    limit: 20,
  });

  const { data, loading, error, refetch } = useQuery<ProviderDirectoryData>(CONSULTANTS_QUERY, {
    variables: {
      specialty: filters.specialty || undefined,
    },
    fetchPolicy: "network-only",
  });

  const code = getGraphQLErrorCode(error);
  const allProviders = useMemo(() => data?.consultants ?? [], [data?.consultants]);
  const providers = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    if (!search) return allProviders;
    return allProviders.filter((provider) => {
      return [
        provider.displayName,
        provider.specialty,
        provider.biography ?? "",
        provider.clinic?.name ?? "",
        provider.languages.join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });
  }, [allProviders, filters.search]);
  const pagedProviders = providers.slice(
    (filters.page - 1) * filters.limit,
    filters.page * filters.limit,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Provider Directory"
        title="Find your care team"
        description="Discover specialists available to your patient account and request a consultation."
        actions={
          <>
            <Badge variant="secondary">Clinic policy applied</Badge>
            <Badge variant="secondary">Public consultants only</Badge>
          </>
        }
      />

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Filter providers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
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
              <Input
                id="specialty"
                placeholder="Cardiology, diabetes care..."
                value={filters.specialty}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    specialty: event.target.value,
                    page: 1,
                  }))
                }
              />
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
                setFilters({ search: "", specialty: "", page: 1, limit: 20 })
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
            ? "Loading consultants..."
            : `Showing ${pagedProviders.length} of ${providers.length} consultant${providers.length === 1 ? "" : "s"}`}
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
            disabled={loading || filters.page * filters.limit >= providers.length}
            onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
          >
            Next
          </Button>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
        {pagedProviders.map((provider) => (
          <Card
            key={provider.id}
            className={cn(
              "group flex h-full flex-col overflow-hidden border-border/80 transition-all duration-200",
              provider.acceptingPatients && "hover:-translate-y-1",
            )}
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-primary/10 via-white to-primary/5">
              <Image
                src={getProviderFallbackImage(provider.id)}
                alt={provider.displayName}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1536px) 50vw, 33vw"
                className={cn(
                  "object-cover transition-transform duration-300",
                  provider.acceptingPatients && "group-hover:scale-[1.03]",
                )}
              />
              <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 p-4">
                <Badge variant="secondary" className="bg-white/90 text-text backdrop-blur">
                  {provider.specialty || "Specialist"}
                </Badge>
                {provider.acceptingPatients ? (
                  <Badge variant="success" className="bg-white/90 backdrop-blur">
                    <BadgeCheck className="mr-1 size-3" />
                    Available
                  </Badge>
                ) : null}
              </div>
            </div>
            <CardContent className="flex flex-1 flex-col gap-4 pt-5">
              <div className="space-y-1">
                <p className="text-lg font-semibold text-text">{provider.displayName}</p>
                <p className="text-sm font-medium text-primary">{provider.specialty}</p>
              </div>

              {provider.biography ? (
                <p className="overflow-hidden text-ellipsis text-sm text-muted [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                  {provider.biography}
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
                  {provider.clinic?.name ?? "Independent practice"}
                </div>
              </div>

              <div className="mt-auto flex flex-col gap-4 border-t border-border/80 pt-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs text-muted">Availability</p>
                  <p className="text-lg font-semibold text-text">{provider.acceptingPatients ? "Accepting patients" : "Unavailable"}</p>
                </div>
                {provider.acceptingPatients ? (
                  <Button href={`/patient/providers/${provider.id}/book`} fullWidth className="sm:w-auto">
                    Request
                  </Button>
                ) : (
                  <Button type="button" fullWidth disabled className="sm:w-auto">
                    Unavailable
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {!loading && pagedProviders.length === 0 ? (
          <Card className="md:col-span-2 2xl:col-span-3">
            <CardContent className="py-10 text-center text-sm text-muted">
              No consultants match your current filters.
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
