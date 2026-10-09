"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ORGANIZATION_PROVIDERS_QUERY } from "@/lib/consultant/organization-graphql";
import { CONFIGURE_PROVIDER_PROGRAMME_OFFER_MUTATION } from "@/lib/providers/care-options";
import { type CareProgramme } from "@/lib/programmes/graphql";
import { getGraphQLErrorMessage } from "@/features/auth/auth-context";

export function ProgrammeProviderOfferSettings({
  programme,
  canManage,
  onSaved,
}: {
  programme: CareProgramme;
  canManage: boolean;
  onSaved: () => Promise<unknown>;
}) {
  const [enabled, setEnabled] = useState(
    Boolean(programme.publicEnrolmentEnabled),
  );
  const [providerIds, setProviderIds] = useState(
    (programme.offeringProviders ?? []).map((provider) => provider.id),
  );
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const {
    data,
    loading,
    error: providersError,
  } = useQuery<{
    organizationProviders: {
      id: string;
      displayName: string;
      lifecycleStatus: string;
    }[];
  }>(ORGANIZATION_PROVIDERS_QUERY, {
    variables: { organizationId: programme.organization?.id },
    skip: !programme.organization?.id || !canManage,
  });
  const [configure, state] = useMutation(
    CONFIGURE_PROVIDER_PROGRAMME_OFFER_MUTATION,
  );

  async function handleSave() {
    setError(null);
    setSaved(false);
    try {
      await configure({
        variables: { programmeId: programme.id, providerIds, enabled },
      });
      setSaved(true);
      await onSaved();
    } catch (err) {
      setError(getGraphQLErrorMessage(err, "Unable to save provider offers."));
    }
  }

  return (
    <section
      className="mt-5 space-y-4 border-t border-border px-5 py-5"
      aria-label="Provider enrolment offers"
    >
      <h2 className="text-base font-semibold text-text">
        Provider enrolment offers
      </h2>
      {canManage ? (
        <Button href="/consultant/billing/prices" variant="ghost" size="sm">
          Programme prices
        </Button>
      ) : null}
      <label className="flex items-center gap-3 text-sm text-text">
        <input
          type="checkbox"
          checked={enabled}
          disabled={!canManage || state.loading}
          onChange={(event) => {
            setEnabled(event.target.checked);
            setSaved(false);
          }}
        />
        Allow patients to join and pay from consultant profiles
      </label>
      <fieldset disabled={!canManage || state.loading} className="space-y-2">
        <legend className="mb-2 text-sm font-medium text-text">
          Offering consultants
        </legend>
        {loading ? (
          <p className="text-sm text-muted">Loading consultants...</p>
        ) : null}
        {providersError ? (
          <p role="alert" className="text-sm text-danger">
            Unable to load clinic consultants.
          </p>
        ) : null}
        {(data?.organizationProviders ?? programme.offeringProviders ?? []).map(
          (provider) => (
            <label
              key={provider.id}
              className="flex items-center gap-3 text-sm text-text"
            >
              <input
                type="checkbox"
                checked={providerIds.includes(provider.id)}
                onChange={(event) => {
                  setProviderIds((ids) =>
                    event.target.checked
                      ? [...ids, provider.id]
                      : ids.filter((id) => id !== provider.id),
                  );
                  setSaved(false);
                }}
              />
              {provider.displayName}
            </label>
          ),
        )}
        {!loading && data?.organizationProviders.length === 0 ? (
          <p className="text-sm text-muted">
            No consultants are assigned to this clinic.
          </p>
        ) : null}
      </fieldset>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p role="status" className="text-sm text-success">
          Provider offers saved.
        </p>
      ) : null}
      {canManage ? (
        <Button
          size="sm"
          disabled={state.loading || loading || Boolean(providersError)}
          onClick={() => void handleSave()}
        >
          <Save className="size-4" />
          {state.loading ? "Saving..." : "Save offers"}
        </Button>
      ) : null}
    </section>
  );
}
