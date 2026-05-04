"use client";

import { useState } from "react";
import { ConsultantLabInterpretationBadge } from "@/components/consultant/labs/ConsultantLabInterpretationBadge";
import { ConsultantLabStatusBadge } from "@/components/consultant/labs/ConsultantLabStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ConsultantLabReview } from "@/types";

type ConsultantLabDetailViewProps = Readonly<{
  lab: ConsultantLabReview;
}>;

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-ZM", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

function getInterpretationCopy(interpretation: ConsultantLabReview["interpretation"]) {
  if (interpretation === "NORMAL") {
    return "This result is within the expected clinical range for the current review criteria.";
  }

  if (interpretation === "HIGH") {
    return "This result is above the target range and should be correlated with the patient context.";
  }

  return "This result is clinically significant and needs urgent consultant review.";
}

export function ConsultantLabDetailView({
  lab,
}: ConsultantLabDetailViewProps) {
  const [status, setStatus] = useState(lab.status);
  const [doctorNotes, setDoctorNotes] = useState(lab.doctorNotes ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleMarkReviewed() {
    if (!doctorNotes.trim()) {
      return;
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    setStatus("REVIEWED");
    setIsSubmitting(false);
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
          Lab Review
        </p>
        <h1 className="text-3xl font-semibold text-text sm:text-4xl">{lab.patientName}</h1>
        <p className="text-base text-muted">{lab.testName}</p>
        <div className="flex flex-wrap gap-2 pt-2">
          <ConsultantLabStatusBadge status={status} />
          <ConsultantLabInterpretationBadge interpretation={lab.interpretation} />
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Result</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted">Result Value</p>
                <p className="text-base font-semibold text-text">
                  {lab.resultValue} {lab.unit}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted">Summary</p>
                <p className="text-sm leading-6 text-text">{lab.resultSummary}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Interpretation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ConsultantLabInterpretationBadge interpretation={lab.interpretation} />
              <p className="text-sm leading-6 text-muted">
                {getInterpretationCopy(lab.interpretation)}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm text-muted">Ordered By</p>
                <p className="text-sm font-medium text-text">{lab.orderedBy}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted">Date Ordered</p>
                <p className="text-sm font-medium text-text">{formatDate(lab.dateOrdered)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Doctor Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="doctorNotes">Doctor Notes</Label>
                <Textarea
                  id="doctorNotes"
                  value={doctorNotes}
                  onChange={(event) => setDoctorNotes(event.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button href="/consultant/labs" variant="secondary" fullWidth>
                  Back to Labs
                </Button>
                <Button
                  type="button"
                  onClick={handleMarkReviewed}
                  disabled={isSubmitting || !doctorNotes.trim() || status === "REVIEWED"}
                  fullWidth
                >
                  {status === "REVIEWED"
                    ? "Reviewed"
                    : isSubmitting
                      ? "Saving..."
                      : "Mark as Reviewed"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
