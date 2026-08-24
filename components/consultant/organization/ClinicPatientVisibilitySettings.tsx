"use client";

import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { Button } from "@/components/ui/button";
import {
  ORGANIZATION_SETTINGS_QUERY,
  UPDATE_ORGANIZATION_SETTINGS_MUTATION,
} from "@/lib/consultant/organization-graphql";
import { getGraphQLErrorMessage } from "@/features/auth/auth-context";

const visibilityOptions = [
  {
    value: "organization_only",
    label: "Clinic consultants only",
    description: "Invited patients can only see consultants attached to this clinic.",
  },
  {
    value: "all_providers",
    label: "All consultants",
    description: "Invited patients can see every public consultant on the platform.",
  },
] as const;

type VisibilityData = {
  organizationSettings: {
    id: string;
    patientProviderVisibility: string;
  } | null;
};

type UpdateVisibilityData = {
  updateOrganizationSettings: {
    settings: {
      id: string;
      patientProviderVisibility: string;
    };
  };
};

export function ClinicPatientVisibilitySettings({
  organizationId,
}: Readonly<{ organizationId: string }>) {
  const { data, loading, error, refetch } = useQuery<VisibilityData>(
    ORGANIZATION_SETTINGS_QUERY,
    {
      variables: { organizationId },
      fetchPolicy: "network-only",
    },
  );
  const [updateVisibility, { loading: saving }] = useMutation<UpdateVisibilityData>(
    UPDATE_ORGANIZATION_SETTINGS_MUTATION,
  );
  const [visibility, setVisibility] = useState("organization_only");
  const [message, setMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (data?.organizationSettings?.patientProviderVisibility) {
      setVisibility(data.organizationSettings.patientProviderVisibility);
    }
  }, [data?.organizationSettings?.patientProviderVisibility]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setSubmitError(null);

    try {
      await updateVisibility({
        variables: {
          organizationId,
          data: { patientProviderVisibility: visibility },
        },
      });
      await refetch();
      setMessage("Patient visibility saved.");
    } catch (err) {
      setSubmitError(getGraphQLErrorMessage(err, "Unable to save patient visibility."));
    }
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
                name="patientProviderVisibility"
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
