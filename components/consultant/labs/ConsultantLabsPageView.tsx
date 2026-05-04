"use client";

import { useMemo, useState } from "react";
import { ConsultantLabInterpretationBadge } from "@/components/consultant/labs/ConsultantLabInterpretationBadge";
import { ConsultantLabReviewModal } from "@/components/consultant/labs/ConsultantLabReviewModal";
import { ConsultantLabStatusBadge } from "@/components/consultant/labs/ConsultantLabStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ConsultantLabReview } from "@/types";

type ConsultantLabsPageViewProps = Readonly<{
  labs: ConsultantLabReview[];
}>;

export function ConsultantLabsPageView({
  labs,
}: ConsultantLabsPageViewProps) {
  const [items, setItems] = useState(labs);
  const [selectedLabId, setSelectedLabId] = useState<string | null>(null);
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);

  const selectedLab = useMemo(
    () => items.find((lab) => lab.id === selectedLabId) ?? null,
    [items, selectedLabId],
  );

  async function handleMarkReviewed(labId: string, doctorNotes: string) {
    setIsReviewSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    setItems((current) =>
      current.map((lab) =>
        lab.id === labId
          ? {
              ...lab,
              doctorNotes,
              status: "REVIEWED",
            }
          : lab,
      ),
    );
    setIsReviewSubmitting(false);
    setSelectedLabId(null);
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
          Clinical Reviews
        </p>
        <h1 className="text-3xl font-semibold text-text sm:text-4xl">Lab Reviews</h1>
      </header>

      {items.length > 0 ? (
        <div className="grid gap-4">
          {items.map((lab) => (
            <Card key={lab.id}>
              <CardContent className="px-5 py-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-text">{lab.patientName}</p>
                      <p className="text-sm font-medium text-text">{lab.testName}</p>
                      <p className="text-sm leading-6 text-muted">{lab.resultSummary}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <ConsultantLabStatusBadge status={lab.status} />
                      <ConsultantLabInterpretationBadge interpretation={lab.interpretation} />
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
                    <Button
                      type="button"
                      variant="secondary"
                      fullWidth
                      className="xl:w-auto"
                      onClick={() => setSelectedLabId(lab.id)}
                    >
                      Review
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center shadow-soft">
          <p className="text-base font-medium text-text">No lab reviews available</p>
        </div>
      )}

      {selectedLab ? (
        <ConsultantLabReviewModal
          lab={selectedLab}
          isSubmitting={isReviewSubmitting}
          onClose={() => setSelectedLabId(null)}
          onSubmit={async ({ doctorNotes }) =>
            handleMarkReviewed(selectedLab.id, doctorNotes)
          }
        />
      ) : null}
    </div>
  );
}
