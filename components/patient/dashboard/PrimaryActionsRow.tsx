"use client";

import { useState } from "react";
import Link from "next/link";
import { useApolloClient } from "@apollo/client";
import { CalendarPlus, Activity, X } from "lucide-react";
import { DetailModal } from "@/components/ui/detail-modal";
import { Button } from "@/components/ui/button";
import { GlucoseLogForm } from "@/components/patient/monitoring/GlucoseLogForm";
import { VitalsLogForm } from "@/components/patient/monitoring/VitalsLogForm";
import { PATIENT_GLUCOSE_SUMMARY_QUERY } from "@/lib/monitoring/graphql";
import { MY_NEXT_EXPECTED_READINGS_QUERY } from "@/lib/programmes/graphql";

/**
 * The two headline actions on the patient dashboard — always visible once
 * setup clears, ahead of anything programme-specific. Booking goes to the
 * provider directory; logging a reading happens right here in a modal so it
 * stays a two-tap action instead of a page trip.
 */
export function PrimaryActionsRow() {
  const client = useApolloClient();
  const [mode, setMode] = useState<"glucose" | "vitals">("glucose");
  const [logModalOpen, setLogModalOpen] = useState(false);

  function handleLogged() {
    setLogModalOpen(false);
    void client.refetchQueries({ include: [PATIENT_GLUCOSE_SUMMARY_QUERY, MY_NEXT_EXPECTED_READINGS_QUERY] });
  }

  return (
    <section className="grid gap-3 sm:grid-cols-2" aria-label="Primary actions">
      <Link
        href="/patient/providers"
        className="flex items-center gap-4 rounded-lg border border-border bg-surface px-5 py-4 transition-colors hover:bg-background"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
          <CalendarPlus className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-base font-semibold text-text">Book a consultation</p>
          <p className="mt-0.5 text-sm text-muted">Find a consultant and pick a time</p>
        </div>
      </Link>
      <button
        type="button"
        onClick={() => setLogModalOpen(true)}
        className="flex items-center gap-4 rounded-lg border border-border bg-surface px-5 py-4 text-left transition-colors hover:bg-background"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
          <Activity className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-base font-semibold text-text">Log a glucose reading</p>
          <p className="mt-0.5 text-sm text-muted">Takes less than a minute</p>
        </div>
      </button>

      {logModalOpen ? (
        <DetailModal
          title="Log reading"
          subtitle="Record a glucose or vitals reading"
          onClose={() => setLogModalOpen(false)}
          className="sm:max-w-2xl"
          footer={
            <div className="flex justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={() => setLogModalOpen(false)}>
                <X className="size-4" />
                Close
              </Button>
            </div>
          }
        >
          <div className="space-y-5">
            <div className="flex gap-2 border-b border-border pb-3">
              <button
                type="button"
                onClick={() => setMode("glucose")}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  mode === "glucose" ? "bg-primary/10 text-primary" : "text-muted hover:bg-background"
                }`}
              >
                Glucose
              </button>
              <button
                type="button"
                onClick={() => setMode("vitals")}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  mode === "vitals" ? "bg-primary/10 text-primary" : "text-muted hover:bg-background"
                }`}
              >
                Vitals
              </button>
            </div>
            {mode === "glucose" ? (
              <GlucoseLogForm onSuccess={handleLogged} />
            ) : (
              <VitalsLogForm onSuccess={handleLogged} />
            )}
          </div>
        </DetailModal>
      ) : null}
    </section>
  );
}
