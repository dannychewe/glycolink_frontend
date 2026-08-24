"use client";

import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { Button } from "@/components/ui/button";
import {
  CLINIC_PATIENT_CONSULTANT_VISIBILITY_QUERY,
  UPDATE_CLINIC_PATIENT_CONSULTANT_VISIBILITY_MUTATION,
} from "@/lib/healthcare/graphql";

const visibilityOptions = [
  {
    value: "clinic_only",
    label: "Clinic consultants only",
    description: "Invited patients can only see consultants attached to this clinic.",
  },
  {
    value: "all_consultants",
    label: "All consultants",
    description: "Invited patients can see every public consultant on the platform.",
  },
  {
    value: "assigned_consultant_only",
    label: "Assigned consultant only",
    description: "Invited patients can only see the consultant assigned to them.",
  },
] as const;

type VisibilityData = {
  organization: {
    id: string;
    name: string;
    patientConsultantVisibility: string;
  } | null;
};

type UpdateVisibilityData = {
  updateOrganization: {
    success: boolean;
    message: string;
    errors: Array<{ code: string; message: string }>;
    data: {
      organization: {
        id: string;
        patientConsultantVisibility: string;
      };
    } | null;
  };
};

export function ClinicPatientVisibilitySettings({
  organizationId,
}: Readonly<{ organizationId: string }>) {
  const { data, loading, error, refetch } = useQuery<VisibilityData>(
    CLINIC_PATIENT_CONSULTANT_VISIBILITY_QUERY,
    {
      variables: { id: organizationId },
      fetchPolicy: "network-only",
    },
  );
  const [updateVisibility, { loading: saving }] = useMutation<UpdateVisibilityData>(
    UPDATE_CLINIC_PATIENT_CONSULTANT_VISIBILITY_MUTATION,
  );
  const [visibility, setVisibility] = useState("clinic_only");
  const [message, setMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (data?.organization?.patientConsultantVisibility) {
      setVisibility(data.organization.patientConsultantVisibility);
    }
  }, [data?.organization?.patientConsultantVisibility]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setSubmitError(null);

    const result = await updateVisibility({
      variables: {
        id: organizationId,
        patientConsultantVisibility: visibility,
      },
    });
    const payload = result.data?.updateOrganization;

    if (!payload?.success) {
      setSubmitError(payload?.errors?.[0]?.message ?? "Unable to save patient visibility.");
      return;
    }

    await refetch();
    setMessage("Patient visibility saved.");
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-5 sm:p-6">
      <div className="mb-5">
        <p className="text-sm font-semibold text-text">Invited patient consultant visibility</p>
        <p className="mt-1 text-sm text-muted">
          Control which consultants clinic-invited patients can discover from their patient portal.
        </p>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
          Unable to load this clinic setting.
        </div>
      ) : null}

      <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
        <div className="space-y-3">
          {visibilityOptions.map((option) => (
            <label
              key={option.value}
              className="flex gap-3 rounded-lg border border-border bg-background px-4 py-3"
            >
              <input
                type="radio"
                name="patientConsultantVisibility"
                value={option.value}
                checked={visibility === option.value}
                onChange={(event) => setVisibility(event.target.value)}
                className="mt-1"
                disabled={loading}
              />
              <span>
                <span className="text-sm font-semibold text-text">{option.label}</span>
                <span className="mt-1 block text-sm text-muted">{option.description}</span>
              </span>
            </label>
          ))}
        </div>

        {submitError ? (
          <div className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
            {submitError}
          </div>
        ) : null}
        {message ? (
          <div className="rounded-lg border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">
            {message}
          </div>
        ) : null}

        <Button type="submit" disabled={loading || saving}>
          {saving ? "Saving..." : "Save patient visibility"}
        </Button>
      </form>
    </div>
  );
}
