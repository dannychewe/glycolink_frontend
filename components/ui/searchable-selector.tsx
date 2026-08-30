"use client";

import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type SearchableSelectorOption = {
  value: string;
  label: string;
  description?: string | null;
  badge?: string | null;
};

export function SearchableSelector({
  id,
  label,
  value,
  options,
  placeholder,
  emptyLabel = "No matching options",
  disabled,
  onChange,
}: Readonly<{
  id: string;
  label: string;
  value: string;
  options: SearchableSelectorOption[];
  placeholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}>) {
  const [search, setSearch] = useState("");
  const selected = options.find((option) => option.value === value) ?? null;
  const filteredOptions = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return options.slice(0, 8);
    return options
      .filter((option) =>
        [option.label, option.description, option.badge, option.value]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(term),
      )
      .slice(0, 8);
  }, [options, search]);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <Input
          id={id}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={selected ? selected.label : placeholder}
          disabled={disabled}
          className="pl-9"
        />
      </div>
      {selected ? (
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-text">
          <span className="font-medium">{selected.label}</span>
          {selected.description ? <span className="ml-1 text-muted">{selected.description}</span> : null}
        </div>
      ) : null}
      <div className="max-h-52 overflow-y-auto rounded-lg border border-border bg-surface">
        {filteredOptions.length === 0 ? (
          <p className="px-3 py-3 text-sm text-muted">{emptyLabel}</p>
        ) : (
          filteredOptions.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                disabled={disabled}
                onClick={() => {
                  onChange(option.value);
                  setSearch("");
                }}
                className={cn(
                  "flex w-full items-start justify-between gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-background disabled:pointer-events-none disabled:opacity-50",
                  isSelected ? "bg-primary/5 text-primary" : "text-text",
                )}
              >
                <span>
                  <span className="block break-words font-medium">{option.label}</span>
                  {option.description ? <span className="block break-words text-xs text-muted">{option.description}</span> : null}
                </span>
                <span className="flex shrink-0 items-center gap-2 text-xs text-muted">
                  {option.badge}
                  {isSelected ? <Check className="size-4 text-primary" /> : null}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
