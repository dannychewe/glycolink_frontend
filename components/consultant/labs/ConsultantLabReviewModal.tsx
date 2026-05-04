"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { ConsultantLabInterpretationBadge } from "@/components/consultant/labs/ConsultantLabInterpretationBadge";
import { ConsultantLabStatusBadge } from "@/components/consultant/labs/ConsultantLabStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DetailModal } from "@/components/ui/detail-modal";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ConsultantLabReview } from "@/types";

type ConsultantLabReviewModalProps = Readonly<{
  lab: ConsultantLabReview;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: { doctorNotes: string }) => Promise<void>;
}>;

type ReviewFormValues = {
  doctorNotes: string;
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-ZM", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

function getInterpretationCopy(interpretation: ConsultantLabReview["interpretation"]) {
  if (interpretation === "NORMAL") {
    return "This result is within the expected clinical range based on the current review criteria.";
  }

  if (interpretation === "HIGH") {
    return "This result is above the target range and may need treatment adjustment or closer follow-up.";
  }

  return "This result is clinically significant and should be reviewed urgently in the consultation workflow.";
}

export function ConsultantLabReviewModal({
  lab,
  isSubmitting,
  onClose,
  onSubmit,
}: ConsultantLabReviewModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReviewFormValues>({
    defaultValues: {
      doctorNotes: lab.doctorNotes ?? "",
    },
  });

  useEffect(() => {
    reset({
      doctorNotes: lab.doctorNotes ?? "",
    });
  }, [lab, reset]);

  return (
    <DetailModal
      title={lab.patientName}
      subtitle={lab.testName}
      onClose={isSubmitting ? () => undefined : onClose}
      className="sm:max-w-4xl"
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Close
          </Button>
          <Button
            type="submit"
            form="consultant-lab-review-form"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Mark as Reviewed"}
          </Button>
        </div>
      }
    >
      <form
        id="consultant-lab-review-form"
        className="space-y-6"
        onSubmit={handleSubmit(async (values) => {
          if (!values.doctorNotes.trim()) {
            return;
          }
          await onSubmit(values);
        })}
      >
        <div className="flex flex-wrap gap-3">
          <ConsultantLabStatusBadge status={lab.status} />
          <ConsultantLabInterpretationBadge interpretation={lab.interpretation} />
        </div>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">
            Result
          </h3>
          <Card>
            <CardContent className="grid gap-5 px-5 py-5 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted">Result Value</p>
                <p className="text-sm font-medium text-text">
                  {lab.resultValue} {lab.unit}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted">Summary</p>
                <p className="text-sm leading-6 text-text">{lab.resultSummary}</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">
            Interpretation
          </h3>
          <Card>
            <CardContent className="space-y-3 px-5 py-5">
              <ConsultantLabInterpretationBadge interpretation={lab.interpretation} />
              <p className="text-sm leading-6 text-muted">
                {getInterpretationCopy(lab.interpretation)}
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">
            Order Info
          </h3>
          <Card>
            <CardContent className="grid gap-5 px-5 py-5 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted">Ordered By</p>
                <p className="text-sm font-medium text-text">{lab.orderedBy}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted">Date Ordered</p>
                <p className="text-sm font-medium text-text">
                  {formatDate(lab.dateOrdered)}
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">
            Doctor Review
          </h3>
          <div className="space-y-2">
            <Label htmlFor="doctorNotes">Doctor Notes</Label>
            <Textarea
              id="doctorNotes"
              {...register("doctorNotes", {
                required: "Doctor notes are required before marking as reviewed.",
              })}
            />
            <p className="text-sm text-danger">{errors.doctorNotes?.message}</p>
          </div>
        </section>
      </form>
    </DetailModal>
  );
}
