"use client";

import { useMemo, useState } from "react";
import { ProviderCard } from "@/components/public/ProviderCard";
import { ProviderFilters } from "@/components/public/ProviderFilters";
import type { Provider, ProviderPriceRange } from "@/types";

type ProviderDirectoryProps = Readonly<{
  providers: Provider[];
  specialties: string[];
}>;

function matchesPriceRange(fee: number, priceRange: ProviderPriceRange) {
  if (priceRange === "under-40") {
    return fee < 40;
  }

  if (priceRange === "40-50") {
    return fee >= 40 && fee <= 50;
  }

  if (priceRange === "above-50") {
    return fee > 50;
  }

  return true;
}

export function ProviderDirectory({ providers, specialties }: ProviderDirectoryProps) {
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("All specialties");
  const [priceRange, setPriceRange] = useState<ProviderPriceRange>("all");

  const filteredProviders = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return providers.filter((provider) => {
      const matchesSearch = normalizedSearch
        ? provider.name.toLowerCase().includes(normalizedSearch)
        : true;
      const matchesSpecialty =
        specialty === "All specialties" ? true : provider.specialty === specialty;
      const matchesPrice = matchesPriceRange(provider.consultationFee, priceRange);

      return matchesSearch && matchesSpecialty && matchesPrice;
    });
  }, [priceRange, providers, search, specialty]);

  return (
    <div className="space-y-6">
      <ProviderFilters
        searchValue={search}
        specialtyValue={specialty}
        priceRangeValue={priceRange}
        specialties={specialties}
        onSearchChange={setSearch}
        onSpecialtyChange={setSpecialty}
        onPriceRangeChange={setPriceRange}
      />

      {filteredProviders.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredProviders.map((provider) => (
            <ProviderCard key={provider.slug} provider={provider} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center shadow-soft">
          <h3 className="text-lg font-semibold text-text">No providers match those filters</h3>
          <p className="mt-2">
            Adjust your search or try a different specialty to see more provider options.
          </p>
        </div>
      )}
    </div>
  );
}
