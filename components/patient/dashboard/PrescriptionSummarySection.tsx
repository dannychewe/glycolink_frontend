"use client";

import { useQuery } from "@apollo/client";
import { Icons } from "@/components/ui/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader, PanelTitle, PanelBody, PanelEmpty } from "@/components/ui/panel";
import { MY_PRESCRIPTIONS_QUERY } from "@/lib/patient/prescriptions-graphql";

type PrescriptionItem = {
  id: string;
  drugName: string;
  dosage: string;
  frequency: string;
  instructions: string | null;
  status: string;
};

type Prescription = {
  id: string;
  status: string;
  issuedAt: string | null;
  items: PrescriptionItem[];
};

type MyPrescriptionsData = {
  myPrescriptions: Prescription[];
};

function formatDate(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString("en-ZM", { month: "short", day: "numeric", year: "numeric" });
}

export function PrescriptionSummarySection() {
  const { data, loading } = useQuery<MyPrescriptionsData>(MY_PRESCRIPTIONS_QUERY, {
    fetchPolicy: "cache-and-network",
  });

  if (loading && !data) {
    return <div className="h-44 animate-pulse rounded-lg border border-border bg-border/30" />;
  }

  const prescriptions = data?.myPrescriptions ?? [];
  const active = prescriptions.find((p) => p.status?.toUpperCase() === "ACTIVE");
  const latest = active ?? prescriptions[0] ?? null;
  const latestItem = latest?.items[0] ?? null;

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle icon={Icons.prescriptions}>Prescriptions</PanelTitle>
      </PanelHeader>

      {!latest || !latestItem ? (
        <PanelEmpty>No prescriptions on record.</PanelEmpty>
      ) : (
        <PanelBody>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
                Latest prescription
              </p>
              <p className="mt-0.5 font-semibold text-text">{latestItem.drugName}</p>
            </div>
            <Badge variant={latest.status?.toUpperCase() === "ACTIVE" ? "success" : "secondary"}>
              {latest.status}
            </Badge>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border">
            <div className="bg-surface px-4 py-3">
              <p className="text-xs text-muted">Dosage</p>
              <p className="mt-0.5 text-sm font-semibold text-text">{latestItem.dosage}</p>
            </div>
            <div className="bg-surface px-4 py-3">
              <p className="text-xs text-muted">Frequency</p>
              <p className="mt-0.5 text-sm font-semibold text-text">{latestItem.frequency}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted">
            {formatDate(latest.issuedAt) ? (
              <span>Issued {formatDate(latest.issuedAt)}</span>
            ) : null}
          </div>

          <div className="mt-5 border-t border-border pt-4">
            <Button href="/patient/prescriptions" variant="secondary" size="sm">
              View Prescriptions
            </Button>
          </div>
        </PanelBody>
      )}
    </Panel>
  );
}
