"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import Image from "next/image";
import { BadgeCheck, Globe2, MapPin, Star, X } from "lucide-react";
import { useAuth, getGraphQLErrorCode, getGraphQLErrorMessage } from "@/features/auth/auth-context";
import {
  MY_APPOINTMENTS_FOR_REVIEWS_QUERY,
  PROVIDER_QUERY,
  PROVIDER_REVIEWS_QUERY,
  SUBMIT_PROVIDER_REVIEW_MUTATION,
} from "@/lib/providers/directory-graphql";
import { getProviderFallbackImage } from "@/lib/providers/provider-images";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ProviderDetailData = {
  provider: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    profilePictureUrl: string | null;
    status: string;
    verificationStatus: string;
    eligible: boolean;
    averageRating: number | null;
    reviewCount: number;
    specialties: string[];
    subSpecialties: string[];
    languages: string[];
    consultationFeeInitial: string | null;
    consultationFeeFollowup: string | null;
    bio: string | null;
    organization: {
      id: string;
      name: string;
      type: string;
    } | null;
  } | null;
};

type ProviderReviewsData = {
  providerReviews: {
    total: number;
    page: number;
    limit: number;
    items: ProviderReviewItem[];
  };
};

type ProviderReviewItem = {
  id: string;
  rating: number;
  comment: string | null;
  reviewerName: string | null;
  createdAt: string;
};

type SubmitProviderReviewData = {
  submitProviderReview: {
    review: ProviderReviewItem;
  };
};

type MyAppointmentsForReviewsData = {
  myAppointments: ReviewableAppointment[];
};

type ReviewableAppointment = {
  id: string;
  providerId: string;
  startsAt: string | null;
  completedAt: string | null;
  status: string;
};

type GraphqlProviderDetailProps = Readonly<{
  providerId: string;
}>;

const reviewPageSize = 5;

function mapSubmitReviewError(error: unknown) {
  const code = getGraphQLErrorCode(error);

  if (code === "UNAUTHENTICATED") return "Please sign in to submit a review.";
  if (code === "APPOINTMENT_NOT_FOUND") return "Appointment not found.";
  if (code === "INVALID_APPOINTMENT_STATE") return "This appointment is not eligible for review.";
  if (code === "FORBIDDEN") return "You cannot submit a review for this appointment.";
  if (code === "VALIDATION_ERROR") return "Please check the form values and try again.";

  return getGraphQLErrorMessage(error, "Unable to submit your review right now. Please try again.");
}

function formatAppointmentDateLabel(appointment: ReviewableAppointment) {
  const sourceDate = appointment.completedAt ?? appointment.startsAt;
  if (!sourceDate) return "Completed appointment";

  const parsed = new Date(sourceDate);
  if (Number.isNaN(parsed.getTime())) return "Completed appointment";

  return parsed.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function GraphqlProviderDetail({ providerId }: GraphqlProviderDetailProps) {
  const { isAuthenticated } = useAuth();
  const [reviewsPage, setReviewsPage] = useState(1);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    appointmentId: "",
    rating: 5,
    comment: "",
  });
  const [submitAlert, setSubmitAlert] = useState<
    { type: "success" | "error"; message: string } | null
  >(null);

  const { data, loading, error } = useQuery<ProviderDetailData>(PROVIDER_QUERY, {
    variables: { id: providerId },
    fetchPolicy: "network-only",
  });
  const {
    data: reviewsData,
    loading: reviewsLoading,
    error: reviewsError,
    refetch: refetchReviews,
  } = useQuery<ProviderReviewsData>(PROVIDER_REVIEWS_QUERY, {
    variables: {
      providerId,
      page: reviewsPage,
      limit: reviewPageSize,
    },
    fetchPolicy: "network-only",
  });
  const [submitProviderReview, { loading: isSubmittingReview }] = useMutation<
    SubmitProviderReviewData
  >(SUBMIT_PROVIDER_REVIEW_MUTATION);
  const {
    data: reviewableAppointmentsData,
    loading: reviewableAppointmentsLoading,
    error: reviewableAppointmentsError,
  } = useQuery<MyAppointmentsForReviewsData>(MY_APPOINTMENTS_FOR_REVIEWS_QUERY, {
    fetchPolicy: "network-only",
    skip: !isAuthenticated || !isReviewModalOpen,
  });

  const provider = data?.provider ?? null;
  const reviewItems = reviewsData?.providerReviews?.items ?? [];
  const reviewTotal = reviewsData?.providerReviews?.total ?? 0;
  const code = getGraphQLErrorCode(error);
  const accessDenied =
    code === "TENANT_ACCESS_DENIED" ||
    code === "PROVIDER_ACCESS_DENIED" ||
    code === "AUTH_TOKEN_INVALID" ||
    code === "AUTH_TOKEN_EXPIRED" ||
    code === "UNAUTHENTICATED";
  const reviewsCode = getGraphQLErrorCode(reviewsError);
  const reviewsAccessDenied =
    reviewsCode === "TENANT_ACCESS_DENIED" ||
    reviewsCode === "PROVIDER_ACCESS_DENIED" ||
    reviewsCode === "AUTH_TOKEN_INVALID" ||
    reviewsCode === "AUTH_TOKEN_EXPIRED" ||
    reviewsCode === "UNAUTHENTICATED";
  const providerAppointments = useMemo(
    () =>
      (reviewableAppointmentsData?.myAppointments ?? [])
        .filter((appointment) => appointment.providerId === providerId)
        .sort((a, b) => {
          const aTime = new Date(a.completedAt ?? a.startsAt ?? 0).getTime();
          const bTime = new Date(b.completedAt ?? b.startsAt ?? 0).getTime();
          return bTime - aTime;
        }),
    [providerId, reviewableAppointmentsData?.myAppointments],
  );

  useEffect(() => {
    if (!isAuthenticated || providerAppointments.length === 0) return;
    setReviewForm((prev) => {
      if (prev.appointmentId) return prev;
      return { ...prev, appointmentId: providerAppointments[0].id };
    });
  }, [isAuthenticated, providerAppointments]);

  useEffect(() => {
    if (!isReviewModalOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isReviewModalOpen]);

  async function handleSubmitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitAlert(null);

    if (!reviewForm.appointmentId) {
      setSubmitAlert({ type: "error", message: "Please select an appointment." });
      return;
    }

    try {
      await submitProviderReview({
        variables: {
          appointmentId: reviewForm.appointmentId,
          rating: reviewForm.rating,
          comment: reviewForm.comment.trim() || undefined,
        },
      });
      setSubmitAlert({ type: "success", message: "Review submitted successfully." });
      setReviewForm((prev) => ({ ...prev, rating: 5, comment: "" }));
      await refetchReviews({ providerId, page: 1, limit: reviewPageSize });
      setReviewsPage(1);
      setIsReviewModalOpen(false);
    } catch (mutationError) {
      setSubmitAlert({ type: "error", message: mapSubmitReviewError(mutationError) });
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-64 animate-pulse rounded-[2rem] bg-border/40" />
        <div className="h-40 animate-pulse rounded-2xl bg-border/40" />
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="rounded-xl border border-warning/30 bg-warning/5 px-5 py-4 text-sm text-warning">
        {code === "PROVIDER_NOT_FOUND"
          ? "This clinician profile could not be found."
            : accessDenied
              ? "Please sign in with a verified account to view provider details."
              : getGraphQLErrorMessage(error, "Unable to load this provider right now. Please try again.")}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Profile header */}
      <div className="grid gap-5 rounded-[2rem] border border-border bg-surface p-5 shadow-soft md:grid-cols-[200px_minmax(0,1fr)] md:items-start md:p-8">
        <div className="relative aspect-[3/4] overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-primary/10 via-white to-primary/5">
          {(provider.profilePictureUrl ?? provider.avatarUrl) ? (
            <img
              src={provider.profilePictureUrl ?? provider.avatarUrl!}
              alt={`${provider.displayName} profile photo`}
              className="size-full object-cover"
            />
          ) : (
            <Image
              src={getProviderFallbackImage(provider.id)}
              alt={`${provider.displayName} profile photo`}
              fill
              sizes="(max-width: 768px) 100vw, 200px"
              className="object-cover"
            />
          )}
        </div>

        <div className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
            Diabetes care clinician
          </p>
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl">{provider.displayName}</h1>
            {provider.specialties[0] ? (
              <p className="text-lg font-medium text-primary">{provider.specialties[0]}</p>
            ) : null}
            <p className="flex items-center gap-1 text-sm text-muted">
              <Star className="size-3.5 text-warning" />
              {provider.reviewCount > 0 && provider.averageRating != null
                ? `${provider.averageRating.toFixed(1)} (${provider.reviewCount} review${
                    provider.reviewCount === 1 ? "" : "s"
                  })`
                : "No reviews yet"}
            </p>
          </div>

          {/* Sub-specialties */}
          {provider.subSpecialties.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {provider.subSpecialties.map((item) => (
                <Badge key={item} variant="secondary" className="bg-primary/5 text-text">
                  {item}
                </Badge>
              ))}
            </div>
          ) : null}

          {/* Meta info */}
          <div className="space-y-2 text-sm text-muted">
            {provider.organization ? (
              <div className="flex items-center gap-2">
                <MapPin className="size-4 shrink-0 text-muted" />
                <span>{provider.organization.name}</span>
              </div>
            ) : null}
            {provider.languages.length > 0 ? (
              <div className="flex items-center gap-2">
                <Globe2 className="size-4 shrink-0 text-muted" />
                <span>Speaks {provider.languages.join(", ")}</span>
              </div>
            ) : null}
          </div>

          {/* Verified badge — only show if eligible */}
          {provider.eligible ? (
            <div className="flex items-center gap-1.5 text-sm font-medium text-success">
              <BadgeCheck className="size-4" />
              Verified clinician · Available for diabetes care
            </div>
          ) : (
            <p className="text-sm text-muted">This clinician is not currently available for new patient care.</p>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
        <div className="space-y-10">
          {/* About */}
          {provider.bio ? (
            <section className="space-y-3">
              <h2 className="text-2xl">About</h2>
              <p className="whitespace-pre-line text-base leading-7 text-muted">{provider.bio}</p>
            </section>
          ) : null}

          {/* Specialties */}
          {provider.specialties.length > 0 ? (
            <section className="space-y-3 border-t border-border/80 pt-8">
              <h2 className="text-2xl">Areas of expertise</h2>
              <div className="flex flex-wrap gap-2">
                {provider.specialties.map((item) => (
                  <Badge key={item} variant="secondary" className="bg-primary/5 text-text">
                    {item}
                  </Badge>
                ))}
              </div>
            </section>
          ) : null}

          {provider.subSpecialties.length > 0 ? (
            <section className="space-y-3 border-t border-border/80 pt-8">
              <h2 className="text-2xl">Sub-specialties</h2>
              <div className="flex flex-wrap gap-2">
                {provider.subSpecialties.map((item) => (
                  <Badge key={item} variant="secondary" className="bg-primary/5 text-text">
                    {item}
                  </Badge>
                ))}
              </div>
            </section>
          ) : null}

          <section className="space-y-4 border-t border-border/80 pt-8">
            <h2 className="text-2xl">Patient reviews</h2>

            {reviewsError ? (
              <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
                {reviewsAccessDenied
                  ? "Sign in to view clinician reviews."
                  : getGraphQLErrorMessage(reviewsError, "Unable to load clinician reviews right now.")}
              </div>
            ) : null}

            {reviewsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Card key={i} className="h-28 animate-pulse bg-border/40" />
                ))}
              </div>
            ) : null}

            {!reviewsLoading && !reviewsError && reviewItems.length === 0 ? (
              <p className="text-sm text-muted">No reviews have been submitted yet.</p>
            ) : null}

            <div className="space-y-3">
              {reviewItems.map((review) => (
                <article
                  key={review.id}
                  className="space-y-2 rounded-2xl border border-border bg-surface px-4 py-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-text">
                      {review.reviewerName?.trim() || "Anonymous patient"}
                    </p>
                    <p className="text-xs text-muted">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="flex items-center gap-1 text-sm text-warning">
                    <Star className="size-3.5 fill-current" />
                    {review.rating.toFixed(1)}
                  </p>
                  {review.comment ? <p className="text-sm text-muted">{review.comment}</p> : null}
                </article>
              ))}
            </div>

            {reviewTotal > reviewPageSize ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={reviewsPage <= 1 || reviewsLoading}
                  onClick={() => setReviewsPage((prev) => Math.max(1, prev - 1))}
                >
                  Prev
                </Button>
                <span className="text-sm text-muted">Page {reviewsPage}</span>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={reviewsLoading || reviewsPage * reviewPageSize >= reviewTotal}
                  onClick={() => setReviewsPage((prev) => prev + 1)}
                >
                  Next
                </Button>
              </div>
            ) : null}

            <div className="space-y-3">
              <Button type="button" variant="secondary" onClick={() => setIsReviewModalOpen(true)}>
                Rate this consultant
              </Button>

              {submitAlert && !isReviewModalOpen ? (
                <p
                  className={
                    submitAlert.type === "success"
                      ? "rounded-xl border border-success/30 bg-success/5 px-3 py-2 text-sm text-success"
                      : "rounded-xl border border-warning/30 bg-warning/5 px-3 py-2 text-sm text-warning"
                  }
                >
                  {submitAlert.message}
                </p>
              ) : null}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <h2 className="text-base font-semibold text-text">Consultation details</h2>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="text-xs text-muted">Clinical access fee</p>
                <p className="text-2xl font-semibold text-text">
                  {provider.consultationFeeInitial != null
                    ? `ZMW ${provider.consultationFeeInitial}`
                    : "On request"}
                </p>
              </div>
              {provider.consultationFeeFollowup != null ? (
                <div>
                  <p className="text-xs text-muted">Follow-up fee</p>
                  <p className="text-sm font-medium text-text">
                    ZMW {provider.consultationFeeFollowup}
                  </p>
                </div>
              ) : null}
              {provider.languages.length > 0 ? (
                <div>
                  <p className="text-xs text-muted">Languages spoken</p>
                  <p className="text-sm font-medium text-text">
                    {provider.languages.join(", ")}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* CTAs */}
          <div className="space-y-3">
            {provider.eligible ? (
              isAuthenticated ? (
                <Button href={`/patient/providers/${provider.id}/book`} size="lg" fullWidth>
                  Request Clinical Support
                </Button>
              ) : (
                <>
                  <Button href={`/login?next=/patient/providers/${provider.id}/book`} size="lg" fullWidth>
                    Sign in to Continue
                  </Button>
                  <Button href="/register" variant="secondary" size="lg" fullWidth>
                    Create an Account
                  </Button>
                </>
              )
            ) : (
              <div className="rounded-xl border border-border bg-surface px-4 py-4 text-center text-sm text-muted">
                This clinician is not currently available for new patient care.
              </div>
            )}
          </div>
        </div>
      </div>

      {isReviewModalOpen ? (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/55 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-modal-title"
          onClick={() => setIsReviewModalOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-[1.5rem] bg-surface shadow-subtle"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
              <div className="space-y-1">
                <h2 id="review-modal-title" className="text-xl font-semibold text-text">
                  Rate this consultant
                </h2>
                <p className="text-sm text-muted">Share your care experience.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-surface text-text transition hover:bg-slate-50"
                aria-label="Close review modal"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="px-5 py-5 sm:px-6">
              {!isAuthenticated ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted">Sign in to submit a clinician review.</p>
                  <Button href={`/login?next=/providers/${provider.id}`} fullWidth>
                    Sign in
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="appointmentId">Completed care visit</Label>
                    <select
                      id="appointmentId"
                      value={reviewForm.appointmentId}
                      onChange={(event) =>
                        setReviewForm((prev) => ({ ...prev, appointmentId: event.target.value }))
                      }
                      className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-text shadow-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      required
                      disabled={reviewableAppointmentsLoading || providerAppointments.length === 0}
                    >
                      <option value="">
                        {reviewableAppointmentsLoading
                          ? "Loading appointments..."
                          : providerAppointments.length === 0
                            ? "No completed appointments found"
                            : "Select appointment date"}
                      </option>
                      {providerAppointments.map((appointment) => (
                        <option key={appointment.id} value={appointment.id}>
                          {formatAppointmentDateLabel(appointment)}
                        </option>
                      ))}
                    </select>
                    {reviewableAppointmentsError ? (
                      <p className="text-xs text-warning">
                        {getGraphQLErrorMessage(
                          reviewableAppointmentsError,
                          "Unable to load completed appointments right now.",
                        )}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label>Rating</Label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((starValue) => (
                        <button
                          key={starValue}
                          type="button"
                          onClick={() =>
                            setReviewForm((prev) => ({
                              ...prev,
                              rating: starValue,
                            }))
                          }
                          className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-background transition hover:bg-slate-50"
                          aria-label={`Rate ${starValue} star${starValue === 1 ? "" : "s"}`}
                          aria-pressed={reviewForm.rating === starValue}
                        >
                          <Star
                            className={
                              reviewForm.rating >= starValue
                                ? "size-4 fill-warning text-warning"
                                : "size-4 text-muted"
                            }
                          />
                        </button>
                      ))}
                      <span className="ml-2 text-sm text-muted">{reviewForm.rating}/5</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="comment">Comment (optional)</Label>
                    <Textarea
                      id="comment"
                      value={reviewForm.comment}
                      onChange={(event) =>
                        setReviewForm((prev) => ({ ...prev, comment: event.target.value }))
                      }
                      placeholder="Share your experience with this provider"
                      maxLength={1000}
                    />
                  </div>

                  {submitAlert ? (
                    <p
                      className={
                        submitAlert.type === "success"
                          ? "rounded-xl border border-success/30 bg-success/5 px-3 py-2 text-sm text-success"
                          : "rounded-xl border border-warning/30 bg-warning/5 px-3 py-2 text-sm text-warning"
                      }
                    >
                      {submitAlert.message}
                    </p>
                  ) : null}

                  <Button
                    type="submit"
                    fullWidth
                    disabled={
                      isSubmittingReview ||
                      reviewableAppointmentsLoading ||
                      providerAppointments.length === 0
                    }
                  >
                    {isSubmittingReview ? "Submitting..." : "Submit Review"}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
