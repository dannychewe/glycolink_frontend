"use client";

import { useState } from "react";
import { ProviderPatientAlertsList } from "@/components/consultant/monitoring/ProviderPatientAlertsList";
import { SetThresholdForm } from "@/components/consultant/monitoring/SetThresholdForm";
import { cn } from "@/lib/utils/cn";

const TABS = ["Patient Alerts", "Set Threshold"] as const;
type Tab = (typeof TABS)[number];

export function GraphqlConsultantMonitoringView() {
  const [activeTab, setActiveTab] = useState<Tab>("Patient Alerts");

  return (
    <div className="space-y-6">
      <div className="flex overflow-x-auto border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "shrink-0 px-4 py-3 text-sm font-medium transition-colors",
              activeTab === tab
                ? "border-b-2 border-primary text-primary"
                : "text-muted hover:text-text",
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Patient Alerts" ? <ProviderPatientAlertsList /> : null}
      {activeTab === "Set Threshold" ? <SetThresholdForm /> : null}
    </div>
  );
}
