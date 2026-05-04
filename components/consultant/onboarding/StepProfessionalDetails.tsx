"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useQuery } from "@apollo/client";
import { X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  CONSULTANT_SPECIALTIES_QUERY,
  CONSULTANT_SUB_SPECIALTIES_QUERY,
} from "@/lib/consultant/provider-lifecycle-graphql";
import type { ConsultantOnboardingValues } from "@/lib/validation/consultant-onboarding";
import { cn } from "@/lib/utils/cn";

type SpecialtyItem = { id: string; name: string };
type SubSpecialtyItem = { id: string; name: string; specialtyId: string; specialtyName: string };

function parseNames(csv: string | undefined): string[] {
  return csv ? csv.split(",").map((s) => s.trim()).filter(Boolean) : [];
}

function CheckboxList({
  items,
  selected,
  onToggle,
  emptyText,
}: {
  items: { id: string; name: string }[];
  selected: Set<string>;
  onToggle: (name: string) => void;
  emptyText: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted">{emptyText}</p>;
  }
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {items.map((item) => {
        const checked = selected.has(item.name);
        return (
          <label
            key={item.id}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-2.5 text-sm transition",
              checked
                ? "border-primary bg-primary/8 text-text"
                : "border-border bg-surface text-muted hover:border-primary/40 hover:text-text",
            )}
          >
            <input
              type="checkbox"
              className="size-4 accent-primary"
              checked={checked}
              onChange={() => onToggle(item.name)}
            />
            {item.name}
          </label>
        );
      })}
    </div>
  );
}

function SelectedPills({
  names,
  onRemove,
}: {
  names: string[];
  onRemove: (name: string) => void;
}) {
  if (names.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {names.map((name) => (
        <span
          key={name}
          className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/8 px-3 py-1 text-xs font-medium text-primary"
        >
          {name}
          <button
            type="button"
            onClick={() => onRemove(name)}
            className="rounded-full hover:text-danger transition"
            aria-label={`Remove ${name}`}
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
    </div>
  );
}

export function StepProfessionalDetails() {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<ConsultantOnboardingValues>();

  const specialtiesValue = watch("specialties") ?? "";
  const subSpecialtiesValue = watch("subSpecialties") ?? "";

  const selectedSpecialtyNames = useMemo(
    () => new Set(parseNames(specialtiesValue)),
    [specialtiesValue],
  );
  const selectedSubSpecialtyNames = useMemo(
    () => new Set(parseNames(subSpecialtiesValue)),
    [subSpecialtiesValue],
  );

  const { data: specialtiesData, loading: loadingSpecialties } = useQuery<{
    specialties: SpecialtyItem[];
  }>(CONSULTANT_SPECIALTIES_QUERY);

  const { data: subSpecialtiesData, loading: loadingSubSpecialties } = useQuery<{
    subSpecialties: SubSpecialtyItem[];
  }>(CONSULTANT_SUB_SPECIALTIES_QUERY, {
    variables: { specialtyId: null },
  });

  const allSpecialties = specialtiesData?.specialties ?? [];
  const allSubSpecialties = subSpecialtiesData?.subSpecialties ?? [];

  const selectedSpecialtyIds = useMemo(() => {
    return new Set(
      allSpecialties
        .filter((s) => selectedSpecialtyNames.has(s.name))
        .map((s) => s.id),
    );
  }, [allSpecialties, selectedSpecialtyNames]);

  const visibleSubSpecialties = useMemo(() => {
    if (selectedSpecialtyIds.size === 0) return [];
    return allSubSpecialties.filter((ss) => selectedSpecialtyIds.has(ss.specialtyId));
  }, [allSubSpecialties, selectedSpecialtyIds]);

  // Clear sub-specialty selections that no longer belong to a selected specialty
  useEffect(() => {
    if (visibleSubSpecialties.length === 0 && selectedSubSpecialtyNames.size > 0) {
      setValue("subSpecialties", "");
    } else {
      const validNames = new Set(visibleSubSpecialties.map((ss) => ss.name));
      const pruned = [...selectedSubSpecialtyNames].filter((n) => validNames.has(n));
      if (pruned.length !== selectedSubSpecialtyNames.size) {
        setValue("subSpecialties", pruned.join(", "));
      }
    }
  }, [visibleSubSpecialties, selectedSubSpecialtyNames, setValue]);

  function toggleSpecialty(name: string) {
    const next = new Set(selectedSpecialtyNames);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setValue("specialties", [...next].join(", "), { shouldDirty: true });
  }

  function toggleSubSpecialty(name: string) {
    const next = new Set(selectedSubSpecialtyNames);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setValue("subSpecialties", [...next].join(", "), { shouldDirty: true });
  }

  const selectedSpecialtyList = [...selectedSpecialtyNames];
  const selectedSubSpecialtyList = [...selectedSubSpecialtyNames];

  return (
    <div className="space-y-6">
      {/* Bio */}
      <div className="space-y-2">
        <Label htmlFor="bio">Professional Bio</Label>
        <Textarea
          id="bio"
          rows={5}
          placeholder="Briefly describe your background, expertise, and approach to patient care…"
          {...register("bio")}
        />
        <p className="text-xs text-muted">
          Patients read this before booking. Aim for at least 2–3 sentences.
        </p>
        {errors.bio?.message ? (
          <p className="text-sm text-danger">{errors.bio.message}</p>
        ) : null}
      </div>

      {/* Specialties */}
      <div className="space-y-3">
        <Label>Specialties</Label>
        <SelectedPills names={selectedSpecialtyList} onRemove={toggleSpecialty} />
        {loadingSpecialties ? (
          <p className="text-sm text-muted">Loading specialties…</p>
        ) : (
          <CheckboxList
            items={allSpecialties}
            selected={selectedSpecialtyNames}
            onToggle={toggleSpecialty}
            emptyText="No specialties available."
          />
        )}
      </div>

      {/* Sub-specialties — only shown when a specialty is selected */}
      {selectedSpecialtyIds.size > 0 ? (
        <div className="space-y-3">
          <Label>Sub-Specialties</Label>
          <p className="text-xs text-muted">
            Filtered to match your selected {selectedSpecialtyIds.size === 1 ? "specialty" : "specialties"}.
          </p>
          <SelectedPills names={selectedSubSpecialtyList} onRemove={toggleSubSpecialty} />
          {loadingSubSpecialties ? (
            <p className="text-sm text-muted">Loading sub-specialties…</p>
          ) : (
            <CheckboxList
              items={visibleSubSpecialties}
              selected={selectedSubSpecialtyNames}
              onToggle={toggleSubSpecialty}
              emptyText="No sub-specialties available for the selected specialties."
            />
          )}
        </div>
      ) : null}

      {/* Languages */}
      <div className="space-y-2">
        <Label htmlFor="languages">Languages Spoken</Label>
        <Input
          id="languages"
          placeholder="English, Bemba, Nyanja"
          {...register("languages")}
        />
        <p className="text-xs text-muted">Separate multiple languages with commas.</p>
      </div>
    </div>
  );
}
