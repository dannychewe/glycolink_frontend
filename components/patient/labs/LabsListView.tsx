"use client";

import { useMemo, useState } from "react";
import { LabCard } from "@/components/patient/labs/LabCard";
import { cn } from "@/lib/utils/cn";
import type { LabOrderRecord } from "@/types";

type LabsListViewProps = Readonly<{
  labOrders: LabOrderRecord[];
}>;

type LabsTab = "Pending" | "Results";

const tabs: LabsTab[] = ["Pending", "Results"];

export function LabsListView({ labOrders }: LabsListViewProps) {
  const [activeTab, setActiveTab] = useState<LabsTab>("Pending");

  const filteredLabOrders = useMemo(() => {
    return labOrders.filter((labOrder) =>
      activeTab === "Pending"
        ? labOrder.status === "ORDERED" || labOrder.status === "SAMPLE_COLLECTED"
        : labOrder.status === "RESULT_READY" || labOrder.status === "REVIEWED",
    );
  }, [activeTab, labOrders]);

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

      {filteredLabOrders.length > 0 ? (
        <div className="grid gap-4">
          {filteredLabOrders.map((labOrder) => (
            <LabCard key={labOrder.id} labOrder={labOrder} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center">
          <p className="text-base font-medium text-text">No lab tests available</p>
        </div>
      )}
    </div>
  );
}
