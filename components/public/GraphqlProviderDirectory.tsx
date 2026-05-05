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
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";

type ProviderDirectoryData = {
  providers: {
    total: number;
    page: number;
    limit: number;
    results: ProviderItem[];
    items: ProviderItem[];
  };
};

type ProviderItem = {
  id: string;
  displayName: string;
  status: string;
  verificationStatus: string;
  eligible: boolean;
  averageRating: number | null;
  reviewCount: number;
  specialties: string[];
  subSpecialties: string[];
  languages: string[];
  consultationFeeInitial: string | null;
  consultationFeeFollowup: string | null;
  bio: string | null;
  organization: {
    id: string;
    name: string;
    type: string;
  } | null;
};

const feeRanges = [
  { value: "all", label: "All" },
  { value: "under-300", label: "Under ZMW 300" },
  { value: "300-500", label: "ZMW 300–500" },
  { value: "above-500", label: "Above ZMW 500" },
];

type SpecialtyItem = { id: string; name: string };
type SubSpecialtyItem = { id: string; name: string; specialtyId: string; specialtyName: string };

export function GraphqlProviderDirectory() {
  const [filters, setFilters] = useState({
    search: "",
    specialtyId: "",
    subSpecialtyName: "",
    feeRange: "all",
    page: 1,
    limit: 20,
  });

  const feeRangeBounds = useMemo(() => {
    if (filters.feeRange === "under-300") return { minFee: undefined, maxFee: 299 };
    if (filters.feeRange === "300-500") return { minFee: 300, maxFee: 500 };
    if (filters.feeRange === "above-500") return { minFee: 501, maxFee: undefined };
    return { minFee: undefined, maxFee: undefined };
  }, [filters.feeRange]);

  const { data, loading, error } = useQuery<ProviderDirectoryData>(PROVIDERS_QUERY, {
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
  const allProviders = useMemo(
    () => data?.providers?.results ?? data?.providers?.items ?? [],
    [data?.providers?.items, data?.providers?.results],
  );
  const providers = useMemo(() => {
    let results = allProviders;
    if (filters.subSpecialtyName) {
      results = results.filter((p) => p.subSpecialties.includes(filters.subSpecialtyName));
    }
    const { minFee, maxFee } = feeRangeBounds;
    if (minFee !== undefined || maxFee !== undefined) {
      results = results.filter((p) => {
        const fee = p.consultationFeeInitial ? Number(p.consultationFeeInitial) : NaN;
        if (Number.isNaN(fee)) return false;
        if (minFee !== undefined && fee < minFee) return false;
        if (maxFee !== undefined && fee > maxFee) return false;
        return true;
      });
    }
    return results;
  }, [allProviders, filters.subSpecialtyName, feeRangeBounds]);
  const total = data?.providers?.total ?? 0;

  const specialtyOptions = specialtiesData?.specialties ?? [];
  const subSpecialtyOptions = useMemo(() => {
    const all = subSpecialtiesData?.subSpecialties ?? [];
    if (!filters.specialtyId) return all;
    const spec = specialtyOptions.find((s) => s.id === filters.specialtyId);
    if (!spec) return all;
    return all.filter((ss) => ss.specialtyName === spec.name);
  }, [subSpecialtiesData, filters.specialtyId, specialtyOptions]);

  const accessDenied =
    code === "TENANT_ACCESS_DENIED" ||
    code === "PROVIDER_ACCESS_DENIED" ||
    code === "AUTH_TOKEN_INVALID" ||
    code === "AUTH_TOKEN_EXPIRED" ||
    code === "UNAUTHENTICATED";

  function resetFilters() {
    setFilters({ search: "", specialtyId: "", subSpecialtyName: "", feeRange: "all", page: 1, limit: 20 });
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="space-y-4 rounded-2xl border border-border/80 bg-surface p-4 shadow-soft sm:p-5">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(210px,0.8fr)_minmax(230px,0.9fr)]">
          <div className="space-y-2">
            <Label htmlFor="search">Search providers</Label>
            <Input
              id="search"
              placeholder="Name, specialty, or keyword"
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="specialty">Specialty</Label>
            <select
              id="specialty"
              value={filters.specialtyId}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  specialtyId: e.target.value,
                  subSpecialtyName: "",
                  page: 1,
                }))
              }
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-text shadow-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">All specialties</option>
              {specialtyOptions.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="subSpecialty">Sub-specialty</Label>
            <select
              id="subSpecialty"
              value={filters.subSpecialtyName}
              disabled={subSpecialtyOptions.length === 0}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, subSpecialtyName: e.target.value, page: 1 }))
              }
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-text shadow-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            >
              <option value="">All sub-specialties</option>
              {subSpecialtyOptions.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              Consultation fee:
            </span>
            {feeRanges.map(({ value, label }) => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={filters.feeRange === value ? "primary" : "secondary"}
                onClick={() => setFilters((prev) => ({ ...prev, feeRange: value, page: 1 }))}
              >
                {label}
              </Button>
            ))}
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={resetFilters}>
            Clear filters
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
          {accessDenied
            ? "Sign in to browse our full provider directory."
            : "Unable to load providers right now. Please try again."}
        </div>
      ) : null}

      {/* Results bar */}
      <div className="flex items-center justify-between text-sm text-muted">
        <p>
          {loading
            ? "Finding providers..."
            : `${providers.length} of ${total} provider${total !== 1 ? "s" : ""}`}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={filters.page <= 1 || loading}
            onClick={() => setFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
          >
            Prev
          </Button>
          <span className="px-1">Page {filters.page}</span>
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

      {/* Provider grid */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {providers.map((provider) => (
          <Card
            key={provider.id}
            className={cn(
              "group flex h-full flex-col overflow-hidden border-border/80 transition-all duration-200",
              provider.eligible && "hover:-translate-y-1 hover:shadow-subtle",
            )}
          >
            {/* Photo */}
            <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-primary/10 via-white to-primary/5">
              <Image
                src={getProviderFallbackImage(provider.id)}
                alt={provider.displayName}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                className={cn(
                  "object-cover transition-transform duration-300",
                  provider.eligible && "group-hover:scale-[1.03]",
                )}
              />
              <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 p-4">
                {provider.specialties[0] ? (
                  <Badge variant="secondary" className="bg-white/90 text-text shadow-soft backdrop-blur">
                    {provider.specialties[0]}
                  </Badge>
                ) : <span />}

                {provider.eligible ? (
                  <Badge variant="success" className="bg-white/90 shadow-soft backdrop-blur">
                    <BadgeCheck className="mr-1 size-3" />
                    Accepting patients
                  </Badge>
                ) : null}
              </div>
            </div>

            <CardContent className="flex flex-1 flex-col gap-4 pt-5">
              {/* Name + rating */}
              <div className="space-y-1">
                <p className="text-xl font-semibold text-text">{provider.displayName}</p>
                <p className="flex items-center gap-1 text-sm text-muted">
                  <Star className="size-3.5 text-warning" />
                  {provider.reviewCount > 0 && provider.averageRating != null
                    ? `${provider.averageRating.toFixed(1)} (${provider.reviewCount} review${
                        provider.reviewCount === 1 ? "" : "s"
                      })`
                    : "No reviews yet"}
                </p>
              </div>

              {/* Bio */}
              {provider.bio ? (
                <p className="overflow-hidden text-ellipsis text-sm text-muted [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                  {provider.bio}
                </p>
              ) : null}

              {/* Meta */}
              <div className="space-y-1.5 text-sm text-muted">
                {provider.languages.length > 0 ? (
                  <div className="flex items-center gap-1.5">
                    <Globe2 className="size-3.5 shrink-0" />
                    {provider.languages.join(", ")}
                  </div>
                ) : null}
                {provider.organization ? (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="size-3.5 shrink-0" />
                    {provider.organization.name}
                  </div>
                ) : null}
              </div>

              {/* Footer */}
              <div className="mt-auto flex flex-col gap-4 border-t border-border/80 pt-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs text-muted">Consultation fee</p>
                  <p className="text-lg font-semibold text-text">
                    {provider.consultationFeeInitial != null
                      ? `ZMW ${provider.consultationFeeInitial}`
                      : "On request"}
                  </p>
                </div>
                <Button
                  href={`/providers/${provider.id}`}
                  variant="secondary"
                  fullWidth
                  className="sm:w-auto"
                >
                  View Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {!loading && providers.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-border/80 bg-surface px-6 py-12 text-center">
            <p className="text-base font-medium text-text">No providers found</p>
            <p className="mt-1 text-sm text-muted">Try adjusting your filters or search term.</p>
          </div>
        ) : null}

        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="h-64 animate-pulse bg-border/40" />
            ))
          : null}
      </div>
    </div>
  );
}
