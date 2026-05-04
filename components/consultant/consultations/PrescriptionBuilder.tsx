"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type ConsultationWorkspaceValues } from "@/lib/validation/consultation-workspace";

export function PrescriptionBuilder() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<ConsultationWorkspaceValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "medications",
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-text">Prescription Builder</h3>
          <p className="text-sm text-muted">Add medications for this encounter.</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() =>
            append({
              medicationName: "",
              dosage: "",
              frequency: "",
              instructions: "",
            })
          }
        >
          Add Medication
        </Button>
      </div>

      {fields.length > 0 ? (
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="rounded-xl border border-border bg-background p-4"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-text">
                  Medication {index + 1}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                >
                  Remove
                </Button>
              </div>
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`medications.${index}.medicationName`}>
                    Medication Name
                  </Label>
                  <Input
                    id={`medications.${index}.medicationName`}
                    {...register(`medications.${index}.medicationName`)}
                  />
                  <p className="text-sm text-danger">
                    {errors.medications?.[index]?.medicationName?.message}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`medications.${index}.dosage`}>Dosage</Label>
                  <Input
                    id={`medications.${index}.dosage`}
                    {...register(`medications.${index}.dosage`)}
                  />
                  <p className="text-sm text-danger">
                    {errors.medications?.[index]?.dosage?.message}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`medications.${index}.frequency`}>
                    Frequency
                  </Label>
                  <Input
                    id={`medications.${index}.frequency`}
                    {...register(`medications.${index}.frequency`)}
                  />
                  <p className="text-sm text-danger">
                    {errors.medications?.[index]?.frequency?.message}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`medications.${index}.instructions`}>
                    Instructions
                  </Label>
                  <Input
                    id={`medications.${index}.instructions`}
                    {...register(`medications.${index}.instructions`)}
                  />
                  <p className="text-sm text-danger">
                    {errors.medications?.[index]?.instructions?.message}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-background px-4 py-5 text-sm text-muted">
          No medications added yet.
        </div>
      )}
    </div>
  );
}
