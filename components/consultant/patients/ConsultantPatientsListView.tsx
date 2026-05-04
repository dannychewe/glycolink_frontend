"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ConsultantPatientListItem } from "@/types";

type ConsultantPatientsListViewProps = Readonly<{
  patients: ConsultantPatientListItem[];
}>;

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-ZM", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function ConsultantPatientsListView({
  patients,
}: ConsultantPatientsListViewProps) {
  const [searchValue, setSearchValue] = useState("");

  const filteredPatients = useMemo(() => {
    const normalizedQuery = searchValue.trim().toLowerCase();

    if (!normalizedQuery) {
      return patients;
    }

    return patients.filter((patient) =>
      patient.name.toLowerCase().includes(normalizedQuery),
    );
  }, [patients, searchValue]);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
          Patient Directory
        </p>
        <h1 className="text-3xl font-semibold text-text sm:text-4xl">Patients</h1>
      </header>

      <div className="max-w-xl">
        <Input
          type="search"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="Search patients by name"
          aria-label="Search patients by name"
        />
      </div>

      {filteredPatients.length > 0 ? (
        <div className="grid gap-4">
          {filteredPatients.map((patient) => (
            <Card key={patient.id}>
              <CardContent className="px-5 py-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-text">{patient.name}</p>
                      <p className="text-sm text-muted">
                        {patient.age} years • {patient.diabetesType}
                      </p>
                    </div>
                    <p className="text-xs uppercase tracking-[0.14em] text-muted">
                      Last visit {formatDate(patient.lastVisitDate)}
                    </p>
                  </div>

                  <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
                    <Button
                      href={`/consultant/patients/${patient.id}`}
                      variant="secondary"
                      fullWidth
                      className="xl:w-auto"
                    >
                      View Patient
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center shadow-soft">
          <p className="text-base font-medium text-text">No patients found</p>
        </div>
      )}
    </div>
  );
}
