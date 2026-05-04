"use client";

import { Input } from "@/components/ui/input";
import type { ProviderPriceRange } from "@/types";

type ProviderFiltersProps = Readonly<{
  searchValue: string;
  specialtyValue: string;
  priceRangeValue: ProviderPriceRange;
  specialties: string[];
  onSearchChange: (value: string) => void;
  onSpecialtyChange: (value: string) => void;
  onPriceRangeChange: (value: ProviderPriceRange) => void;
}>;

const priceRangeOptions: { label: string; value: ProviderPriceRange }[] = [
  { label: "All fees", value: "all" },
  { label: "Under $40", value: "under-40" },
  { label: "$40 to $50", value: "40-50" },
  { label: "Above $50", value: "above-50" },
];

export function ProviderFilters({
  searchValue,
  specialtyValue,
  priceRangeValue,
  specialties,
  onSearchChange,
  onSpecialtyChange,
  onPriceRangeChange,
}: ProviderFiltersProps) {
  return (
    <div className="grid gap-3 rounded-2xl border border-border bg-surface p-4 shadow-soft lg:grid-cols-[minmax(0,1.5fr)_minmax(220px,0.8fr)_minmax(180px,0.7fr)]">
      <Input
        value={searchValue}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search by provider name"
        aria-label="Search providers by name"
      />

      <select
        value={specialtyValue}
        onChange={(event) => onSpecialtyChange(event.target.value)}
        className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-text shadow-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        aria-label="Filter providers by specialty"
      >
        {specialties.map((specialty) => (
          <option key={specialty} value={specialty}>
            {specialty}
          </option>
        ))}
      </select>

      <select
        value={priceRangeValue}
        onChange={(event) => onPriceRangeChange(event.target.value as ProviderPriceRange)}
        className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-text shadow-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        aria-label="Filter providers by consultation fee"
      >
        {priceRangeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
