"use client";

import { useState } from "react";
import { useApolloClient } from "@apollo/client";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DetailModal } from "@/components/ui/detail-modal";
import { MonitoringSnapshotCard } from "@/components/patient/monitoring/MonitoringSnapshotCard";
import { GlucoseLogForm } from "@/components/patient/monitoring/GlucoseLogForm";
import { VitalsLogForm } from "@/components/patient/monitoring/VitalsLogForm";
import { GraphqlReadingsList } from "@/components/patient/monitoring/GraphqlReadingsList";
import { PatientAlertsList } from "@/components/patient/monitoring/PatientAlertsList";
import { PatientDevicesList } from "@/components/patient/monitoring/PatientDevicesList";
import { MONITORING_SNAPSHOT_QUERY } from "@/lib/monitoring/graphql";
import { cn } from "@/lib/utils/cn";

const TABS = ["Overview", "Readings", "Alerts", "Devices"] as const;
type Tab = (typeof TABS)[number];

export function GraphqlMonitoringView() {
  const client = useApolloClient();
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [logMode, setLogMode] = useState<"glucose" | "vitals">("glucose");

  function handleLogged() {
    setLogModalOpen(false);
    void client.refetchQueries({ include: [MONITORING_SNAPSHOT_QUERY] });
  }

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex items-center justify-between gap-3 border-b border-border">
        <div className="flex overflow-x-auto">
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
        <Button type="button" size="sm" className="shrink-0" onClick={() => setLogModalOpen(true)}>
          Log reading
        </Button>
      </div>

      {/* Overview */}
      {activeTab === "Overview" ? (
        <MonitoringSnapshotCard onLogReading={() => setLogModalOpen(true)} />
      ) : null}

      {/* Readings */}
      {activeTab === "Readings" ? <GraphqlReadingsList /> : null}

      {/* Alerts */}
      {activeTab === "Alerts" ? <PatientAlertsList /> : null}

      {/* Devices */}
      {activeTab === "Devices" ? <PatientDevicesList /> : null}

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
                onClick={() => setLogMode("glucose")}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium",
                  logMode === "glucose" ? "bg-primary/10 text-primary" : "text-muted hover:bg-background",
                )}
              >
                Glucose
              </button>
              <button
                type="button"
                onClick={() => setLogMode("vitals")}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium",
                  logMode === "vitals" ? "bg-primary/10 text-primary" : "text-muted hover:bg-background",
                )}
              >
                Vitals
              </button>
            </div>
            {logMode === "glucose" ? (
              <GlucoseLogForm onSuccess={handleLogged} />
            ) : (
              <VitalsLogForm onSuccess={handleLogged} />
            )}
          </div>
        </DetailModal>
      ) : null}
    </div>
  );
}
