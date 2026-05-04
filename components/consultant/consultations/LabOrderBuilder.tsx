"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type ConsultationWorkspaceValues } from "@/lib/validation/consultation-workspace";

export function LabOrderBuilder() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<ConsultationWorkspaceValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "labOrders",
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-text">Lab Order Builder</h3>
          <p className="text-sm text-muted">Add tests to request after the consultation.</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() =>
            append({
              testName: "",
              notes: "",
            })
          }
        >
          Add Test
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
                <p className="text-sm font-semibold text-text">Lab Order {index + 1}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                >
                  Remove
                </Button>
              </div>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`labOrders.${index}.testName`}>Test Name</Label>
                  <Input
                    id={`labOrders.${index}.testName`}
                    {...register(`labOrders.${index}.testName`)}
                  />
                  <p className="text-sm text-danger">
                    {errors.labOrders?.[index]?.testName?.message}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`labOrders.${index}.notes`}>Notes</Label>
                  <Input
                    id={`labOrders.${index}.notes`}
                    {...register(`labOrders.${index}.notes`)}
                  />
                  <p className="text-sm text-danger">
                    {errors.labOrders?.[index]?.notes?.message}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-background px-4 py-5 text-sm text-muted">
          No lab orders added yet.
        </div>
      )}
    </div>
  );
}
