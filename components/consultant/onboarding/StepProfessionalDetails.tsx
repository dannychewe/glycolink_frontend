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

function parseCsv(csv: string | undefined): string[] {
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
  onToggle: (item: { id: string; name: string }) => void;
  emptyText: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted">{emptyText}</p>;
  }
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {items.map((item) => {
        const checked = selected.has(item.id);
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
              onChange={() => onToggle(item)}
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
  const specialtyIdsValue = watch("specialtyIds") ?? "";
  const subSpecialtyIdsValue = watch("subSpecialtyIds") ?? "";

  const selectedSpecialtyNames = useMemo(
    () => new Set(parseCsv(specialtiesValue)),
    [specialtiesValue],
  );
  const selectedSubSpecialtyNames = useMemo(
    () => new Set(parseCsv(subSpecialtiesValue)),
    [subSpecialtiesValue],
  );
  const selectedSpecialtyIds = useMemo(
    () => new Set(parseCsv(specialtyIdsValue)),
    [specialtyIdsValue],
  );
  const selectedSubSpecialtyIds = useMemo(
    () => new Set(parseCsv(subSpecialtyIdsValue)),
    [subSpecialtyIdsValue],
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

  const visibleSubSpecialties = useMemo(() => {
    if (selectedSpecialtyIds.size === 0) return [];
    return allSubSpecialties.filter((ss) => selectedSpecialtyIds.has(ss.specialtyId));
  }, [allSubSpecialties, selectedSpecialtyIds]);

  useEffect(() => {
    if (selectedSpecialtyIds.size > 0 || selectedSpecialtyNames.size === 0 || allSpecialties.length === 0) {
      return;
    }
    const matched = allSpecialties.filter((specialty) => selectedSpecialtyNames.has(specialty.name));
    if (matched.length > 0) {
      setValue("specialtyIds", matched.map((specialty) => specialty.id).join(", "), { shouldDirty: false });
    }
  }, [allSpecialties, selectedSpecialtyIds.size, selectedSpecialtyNames, setValue]);

  useEffect(() => {
    if (selectedSubSpecialtyIds.size > 0 || selectedSubSpecialtyNames.size === 0 || allSubSpecialties.length === 0) {
      return;
    }
    const matched = allSubSpecialties.filter((subSpecialty) =>
      selectedSubSpecialtyNames.has(subSpecialty.name),
    );
    if (matched.length > 0) {
      setValue("subSpecialtyIds", matched.map((subSpecialty) => subSpecialty.id).join(", "), {
        shouldDirty: false,
      });
    }
  }, [allSubSpecialties, selectedSubSpecialtyIds.size, selectedSubSpecialtyNames, setValue]);

  // Clear sub-specialty selections that no longer belong to a selected specialty
  useEffect(() => {
    if (visibleSubSpecialties.length === 0 && selectedSubSpecialtyIds.size > 0) {
      setValue("subSpecialties", "");
      setValue("subSpecialtyIds", "");
    } else {
      const validIds = new Set(visibleSubSpecialties.map((ss) => ss.id));
      const prunedIds = [...selectedSubSpecialtyIds].filter((id) => validIds.has(id));
      if (prunedIds.length !== selectedSubSpecialtyIds.size) {
        const validNames = new Set(visibleSubSpecialties.map((ss) => ss.name));
        const prunedNames = [...selectedSubSpecialtyNames].filter((name) => validNames.has(name));
        setValue("subSpecialtyIds", prunedIds.join(", "));
        setValue("subSpecialties", prunedNames.join(", "));
      }
    }
  }, [visibleSubSpecialties, selectedSubSpecialtyIds, selectedSubSpecialtyNames, setValue]);

  function toggleSpecialty(item: { id: string; name: string }) {
    const nextIds = new Set(selectedSpecialtyIds);
    const nextNames = new Set(selectedSpecialtyNames);
    if (nextIds.has(item.id)) {
      nextIds.delete(item.id);
      nextNames.delete(item.name);
    } else {
      nextIds.add(item.id);
      nextNames.add(item.name);
    }
    setValue("specialtyIds", [...nextIds].join(", "), { shouldDirty: true });
    setValue("specialties", [...nextNames].join(", "), { shouldDirty: true });
  }

  function toggleSubSpecialty(item: { id: string; name: string }) {
    const nextIds = new Set(selectedSubSpecialtyIds);
    const nextNames = new Set(selectedSubSpecialtyNames);
    if (nextIds.has(item.id)) {
      nextIds.delete(item.id);
      nextNames.delete(item.name);
    } else {
      nextIds.add(item.id);
      nextNames.add(item.name);
    }
    setValue("subSpecialtyIds", [...nextIds].join(", "), { shouldDirty: true });
    setValue("subSpecialties", [...nextNames].join(", "), { shouldDirty: true });
  }

  const selectedSpecialtyList = allSpecialties
    .filter((specialty) => selectedSpecialtyIds.has(specialty.id))
    .map((specialty) => specialty.name);
  const selectedSubSpecialtyList = allSubSpecialties
    .filter((subSpecialty) => selectedSubSpecialtyIds.has(subSpecialty.id))
    .map((subSpecialty) => subSpecialty.name);

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
        <SelectedPills
          names={selectedSpecialtyList}
          onRemove={(name) => {
            const specialty = allSpecialties.find((item) => item.name === name);
            if (specialty) toggleSpecialty(specialty);
          }}
        />
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
          <SelectedPills
            names={selectedSubSpecialtyList}
            onRemove={(name) => {
              const subSpecialty = allSubSpecialties.find((item) => item.name === name);
              if (subSpecialty) toggleSubSpecialty(subSpecialty);
            }}
          />
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
