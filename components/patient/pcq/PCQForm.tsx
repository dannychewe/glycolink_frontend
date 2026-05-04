"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PCQSection } from "@/components/patient/pcq/PCQSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  pcqDefaultValues,
  pcqFormSchema,
  pcqTemplate,
  type PCQFormValues,
} from "@/lib/patient/pcq-template";
import {
  getPCQRecord,
  savePCQDraft,
  submitPCQ,
} from "@/lib/patient/pcq-storage";

type PCQFormProps = Readonly<{
  appointmentId: string;
}>;

export function PCQForm({ appointmentId }: PCQFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"DRAFT" | "SUBMITTED">("DRAFT");
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);

  const methods = useForm<PCQFormValues>({
    resolver: zodResolver(pcqFormSchema),
    defaultValues: pcqDefaultValues,
  });

  useEffect(() => {
    const existingRecord = getPCQRecord(appointmentId);

    if (!existingRecord) {
      return;
    }

    methods.reset(existingRecord.values);
    setStatus(existingRecord.status);
    setDraftSavedAt(existingRecord.updatedAt);
  }, [appointmentId, methods]);

  const isSubmitted = status === "SUBMITTED";

  async function handleSaveDraft() {
    setIsSavingDraft(true);
    const values = methods.getValues();
    savePCQDraft(appointmentId, values);
    const savedAt = new Date().toISOString();
    setDraftSavedAt(savedAt);
    setStatus("DRAFT");
    await new Promise((resolve) => setTimeout(resolve, 300));
    setIsSavingDraft(false);
  }

  const onSubmit = methods.handleSubmit(async (values) => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    submitPCQ(appointmentId, values);
    setStatus("SUBMITTED");
    router.push(`/patient/bookings/${appointmentId}`);
  });

  return (
    <FormProvider {...methods}>
      <form className="space-y-6" onSubmit={onSubmit}>
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface px-5 py-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-text">Questionnaire Status</p>
            <p className="text-sm text-muted">
              {draftSavedAt
                ? `Last saved ${new Date(draftSavedAt).toLocaleString("en-ZM")}`
                : "Not saved yet"}
            </p>
          </div>
          <Badge variant={isSubmitted ? "success" : "secondary"}>
            {isSubmitted ? "SUBMITTED" : "DRAFT"}
          </Badge>
        </div>

        <div className="space-y-6">
          {pcqTemplate.sections.map((section) => (
            <PCQSection
              key={section.id}
              section={section}
              disabled={isSubmitted}
            />
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={handleSaveDraft}
            disabled={isSubmitted || isSavingDraft || isSubmitting}
          >
            {isSavingDraft ? "Saving..." : "Save Draft"}
          </Button>
          <Button type="submit" disabled={isSubmitted || isSubmitting}>
            {isSubmitted ? "Submitted" : isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
