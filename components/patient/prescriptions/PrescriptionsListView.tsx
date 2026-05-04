"use client";

import { useMemo, useState } from "react";
import { PrescriptionCard } from "@/components/patient/prescriptions/PrescriptionCard";
import { cn } from "@/lib/utils/cn";
import type { PrescriptionRecord } from "@/types";

type PrescriptionsListViewProps = Readonly<{
  prescriptions: PrescriptionRecord[];
}>;

type PrescriptionTab = "Active" | "Past";

const tabs: PrescriptionTab[] = ["Active", "Past"];

export function PrescriptionsListView({
  prescriptions,
}: PrescriptionsListViewProps) {
  const [activeTab, setActiveTab] = useState<PrescriptionTab>("Active");

  const filteredPrescriptions = useMemo(() => {
    return prescriptions.filter((prescription) =>
      activeTab === "Active"
        ? prescription.status === "ACTIVE"
        : prescription.status !== "ACTIVE",
    );
  }, [activeTab, prescriptions]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        {tabs.map((tab) => {
          const isActive = tab === activeTab;

          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "rounded-xl border px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                isActive
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-surface text-text hover:bg-slate-50",
              )}
              aria-pressed={isActive}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {filteredPrescriptions.length > 0 ? (
        <div className="grid gap-4">
          {filteredPrescriptions.map((prescription) => (
            <PrescriptionCard key={prescription.id} prescription={prescription} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center shadow-soft">
          <p className="text-base font-medium text-text">No prescriptions available</p>
        </div>
      )}
    </div>
  );
}
