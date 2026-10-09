"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useRouter } from "next/navigation";
import { CalendarDays, ClipboardList, CreditCard, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DetailModal } from "@/components/ui/detail-modal";
import {
  useAuth,
  getUserAccountType,
  getGraphQLErrorMessage,
} from "@/features/auth/auth-context";
import {
  PROVIDER_PROGRAMME_OFFERS_QUERY,
  JOIN_PROVIDER_PROGRAMME_MUTATION,
  type ProviderProgrammeOffer,
} from "@/lib/providers/care-options";
import { rememberCareDestination } from "@/lib/auth/care-destination";

type Props = {
  providerId: string;
  bookingAvailable: boolean;
  bookingUnavailableReason?: string | null;
  consultationFee?: string | null;
};

export function ProviderCareOptions({
  providerId,
  bookingAvailable,
  bookingUnavailableReason,
  consultationFee,
}: Props) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { data, loading, error, refetch } = useQuery<{
    providerProgrammeOffers: ProviderProgrammeOffer[];
  }>(PROVIDER_PROGRAMME_OFFERS_QUERY, {
    variables: { providerId },
    fetchPolicy: "cache-and-network",
  });
  const [join, joinState] = useMutation<{
    joinProviderProgramme: {
      enrolment: { id: string };
      invoiceId: string | null;
    };
  }>(JOIN_PROVIDER_PROGRAMME_MUTATION);
  const [selected, setSelected] = useState<ProviderProgrammeOffer | null>(null);
  const [priceId, setPriceId] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const restoredProgramme = useRef(false);
  const isPatient = !isAuthenticated || getUserAccountType(user) === "PATIENT";
  const destination = `/providers/${providerId}`;

  useEffect(() => {
    const programmeId = new URLSearchParams(window.location.search).get(
      "programme",
    );
    const offer = data?.providerProgrammeOffers.find(
      (item) => item.id === programmeId,
    );
    if (offer && !offer.myEnrolmentId && !restoredProgramme.current) {
      restoredProgramme.current = true;
      setSelected(offer);
      setPriceId(offer.prices[0]?.id ?? "");
    }
  }, [data]);

  async function handleJoin() {
    if (!selected || !priceId || joinState.loading) return;
    setJoinError(null);
    try {
      const result = await join({
        variables: { providerId, programmeId: selected.id, priceId },
      });
      const joined = result.data?.joinProviderProgramme;
      if (!joined)
        throw new Error("Unable to join this programme. Please try again.");
      router.push(
        joined.invoiceId
          ? `/patient/payments/${joined.invoiceId}`
          : `/patient/care-plan/${joined.enrolment.id}`,
      );
    } catch (err) {
      setJoinError(
        getGraphQLErrorMessage(
          err,
          "Unable to join this programme. Please try again.",
        ),
      );
      void refetch();
    }
  }

  return (
    <section className="space-y-5" aria-label="Care options">
      <div>
        <h2 className="text-lg font-semibold text-text">Choose your care</h2>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {bookingAvailable && isPatient ? (
            <Button
              href={
                isAuthenticated
                  ? `/patient/providers/${providerId}/book`
                  : `/login?next=${encodeURIComponent(`/patient/providers/${providerId}/book`)}`
              }
              onClick={() =>
                rememberCareDestination(`/patient/providers/${providerId}/book`)
              }
            >
              <CalendarDays className="size-4" />
              Book a consultation
            </Button>
          ) : (
            <Button disabled variant="secondary">
              <CalendarDays className="size-4" />
              Consultation unavailable
            </Button>
          )}
          {consultationFee ? (
            <span className="text-sm text-muted">
              ZMW {consultationFee} per initial consultation
            </span>
          ) : null}
        </div>
        {!bookingAvailable && bookingUnavailableReason ? (
          <p className="mt-2 text-sm text-muted">{bookingUnavailableReason}</p>
        ) : null}
      </div>
      <div className="border-t border-border pt-4">
        <h3 className="flex items-center gap-2 text-base font-semibold text-text">
          <ClipboardList className="size-4" />
          Care programmes
        </h3>
        {loading && !data ? (
          <p className="mt-3 text-sm text-muted">Loading programmes...</p>
        ) : null}
        {error ? (
          <p role="alert" className="mt-3 text-sm text-danger">
            Unable to load programmes.{" "}
            <button className="underline" onClick={() => void refetch()}>
              Try again
            </button>
          </p>
        ) : null}
        {!loading && !error && !data?.providerProgrammeOffers.length ? (
          <p className="mt-3 text-sm text-muted">
            No programmes are currently open through this consultant.
          </p>
        ) : null}
        {data?.providerProgrammeOffers.map((offer) => (
          <div
            key={offer.id}
            className="space-y-2 border-b border-border py-4 last:border-b-0"
          >
            <p className="font-semibold text-text">{offer.name}</p>
            <p className="text-sm text-muted">
              {offer.patientOffer ?? offer.description}
            </p>
            <p className="text-sm text-muted">
              {offer.organizationName}
              {offer.defaultDurationDays
                ? ` | ${offer.defaultDurationDays} days`
                : ""}
            </p>
            {offer.myEnrolmentId ? (
              <Button
                href={`/patient/care-plan/${offer.myEnrolmentId}`}
                variant="secondary"
                size="sm"
              >
                View your programme
              </Button>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                disabled={!isPatient || !offer.prices.length}
                onClick={() => {
                  setSelected(offer);
                  setPriceId(offer.prices[0]?.id ?? "");
                  setJoinError(null);
                }}
              >
                <ClipboardList className="size-4" />
                {offer.prices.length
                  ? "Join a care programme"
                  : "Enrolment unavailable"}
              </Button>
            )}
            {!offer.prices.length ? (
              <p className="text-sm text-muted">
                The clinic needs to finish pricing before you can join.
              </p>
            ) : null}
          </div>
        ))}
      </div>
      {selected ? (
        <DetailModal
          title={selected.name}
          subtitle={selected.organizationName ?? undefined}
          onClose={() => {
            if (!joinState.loading) setSelected(null);
          }}
          footer={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                title="Close programme details"
                aria-label="Close programme details"
                disabled={joinState.loading}
                onClick={() => setSelected(null)}
                className="size-9 px-0"
              >
                <X className="size-4" />
              </Button>
              {isAuthenticated && user?.isVerified ? (
                <Button
                  className="h-auto min-h-11 whitespace-normal"
                  disabled={!priceId || joinState.loading}
                  onClick={() => void handleJoin()}
                >
                  <CreditCard className="size-4 shrink-0" />
                  {joinState.loading
                    ? "Joining..."
                    : "Join and continue to payment"}
                </Button>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Button
                    href={`${isAuthenticated ? "/verify-email" : "/login"}?next=${encodeURIComponent(`${destination}?programme=${selected.id}`)}`}
                    onClick={() =>
                      rememberCareDestination(
                        `${destination}?programme=${selected.id}`,
                      )
                    }
                  >
                    {isAuthenticated
                      ? "Verify email to join"
                      : "Sign in to join"}
                  </Button>
                  {!isAuthenticated ? (
                    <Button
                      variant="secondary"
                      href={`/register?next=${encodeURIComponent(`${destination}?programme=${selected.id}`)}`}
                      onClick={() =>
                        rememberCareDestination(
                          `${destination}?programme=${selected.id}`,
                        )
                      }
                    >
                      Create account
                    </Button>
                  ) : null}
                </div>
              )}
            </div>
          }
        >
          <div className="space-y-4">
            {joinError ? (
              <p role="alert" className="text-sm text-danger">
                {joinError}
              </p>
            ) : null}
            <p className="text-sm text-text">
              {selected.patientOffer ?? selected.description}
            </p>
            {selected.whoItIsFor ? (
              <p className="text-sm text-muted">{selected.whoItIsFor}</p>
            ) : null}
            {selected.whatHappensNext ? (
              <p className="text-sm text-muted">{selected.whatHappensNext}</p>
            ) : null}
            <fieldset className="space-y-3">
              <legend className="mb-2 text-sm font-semibold text-text">
                Programme price
              </legend>
              {selected.prices.map((price) => (
                <label
                  key={price.id}
                  className="flex cursor-pointer items-start gap-3 border-b border-border pb-3"
                >
                  <input
                    type="radio"
                    name="programme-price"
                    value={price.id}
                    checked={priceId === price.id}
                    onChange={() => setPriceId(price.id)}
                    className="mt-1"
                  />
                  <span className="text-sm text-text">
                    <span className="block font-semibold">
                      {price.name}: {price.currency} {price.amount}
                    </span>
                    <span className="block text-muted">
                      {price.billingModel.replaceAll("_", " ").toLowerCase()}
                      {price.billingInterval
                        ? ` | ${price.billingInterval.toLowerCase()}`
                        : ""}
                    </span>
                    {price.includedServiceSummary ? (
                      <span className="block text-muted">
                        {price.includedServiceSummary}
                      </span>
                    ) : null}
                  </span>
                </label>
              ))}
            </fieldset>
            <p className="text-sm text-muted">
              Joining enrols you with this clinic and consultant. Payment is
              collected by mobile money on the next screen. Your clinic will
              complete your baseline assessment and care plan before clinical
              activation.
            </p>
          </div>
        </DetailModal>
      ) : null}
    </section>
  );
}
