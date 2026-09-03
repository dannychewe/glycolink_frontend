"use client";

import { useState } from "react";
import { MonitoringSnapshotCard } from "@/components/patient/monitoring/MonitoringSnapshotCard";
import { GlucoseLogForm } from "@/components/patient/monitoring/GlucoseLogForm";
import { VitalsLogForm } from "@/components/patient/monitoring/VitalsLogForm";
import { GraphqlReadingsList } from "@/components/patient/monitoring/GraphqlReadingsList";
import { PatientAlertsList } from "@/components/patient/monitoring/PatientAlertsList";
import { PatientDevicesList } from "@/components/patient/monitoring/PatientDevicesList";
import { cn } from "@/lib/utils/cn";

const TABS = ["Overview", "Log Reading", "Readings", "Alerts", "Devices"] as const;
type Tab = (typeof TABS)[number];

export function GraphqlMonitoringView() {
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [logSubTab, setLogSubTab] = useState<"glucose" | "vitals">("glucose");

  return (
    <div className="space-y-6">
      {/* Tab bar */}
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

      {/* Overview */}
      {activeTab === "Overview" ? (
        <MonitoringSnapshotCard onLogReading={() => setActiveTab("Log Reading")} />
      ) : null}

      {/* Log Reading */}
      {activeTab === "Log Reading" ? (
        <div className="space-y-6">
          <div className="flex gap-2 border-b border-border/60 pb-4">
            <button
              type="button"
              onClick={() => setLogSubTab("glucose")}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                logSubTab === "glucose"
                  ? "bg-primary/10 text-primary"
                  : "text-muted hover:bg-surface hover:text-text",
              )}
            >
              Glucose
            </button>
            <button
              type="button"
              onClick={() => setLogSubTab("vitals")}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                logSubTab === "vitals"
                  ? "bg-primary/10 text-primary"
                  : "text-muted hover:bg-surface hover:text-text",
              )}
            >
              Vital Signs
            </button>
          </div>

          {logSubTab === "glucose" ? (
            <div className="rounded-lg border border-border bg-surface p-5 sm:p-6">
              <GlucoseLogForm />
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-surface p-5 sm:p-6">
              <VitalsLogForm />
            </div>
          )}
        </div>
      ) : null}

      {/* Readings */}
      {activeTab === "Readings" ? <GraphqlReadingsList /> : null}

      {/* Alerts */}
      {activeTab === "Alerts" ? <PatientAlertsList /> : null}

      {/* Devices */}
      {activeTab === "Devices" ? <PatientDevicesList /> : null}
    </div>
  );
}
