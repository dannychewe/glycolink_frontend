"use client";

import { useMutation, useQuery } from "@apollo/client";
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Flag,
  MessageSquareWarning,
  Star,
  X,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ADMIN_MODERATE_REVIEW_MUTATION,
  ADMIN_REVIEW_QUEUE_QUERY,
} from "@/lib/admin/graphql";
import { cn } from "@/lib/utils/cn";

type AlertState = { type: "success" | "error"; message: string } | null;
type ReviewStatus = "" | "pending" | "approved" | "rejected" | "flagged";
type Decision = "approved" | "rejected" | "flagged";

type ReviewQueueItem = {
  id: string;
  appointmentId: string;
  providerId: string;
  rating: number;
  comment: string | null;
  moderationStatus: string;
  providerReply: string | null;
  providerRepliedAt: string | null;
  reviewerName: string | null;
  createdAt: string;
};

type ReviewQueueData = {
  reviewQueue: {
    items: ReviewQueueItem[];
    total: number;
    page: number;
    limit: number;
  } | null;
};

const STATUS_FILTERS: ReviewStatus[] = ["pending", "flagged", "approved", "rejected", ""];

function formatDate(value: string | null | undefined) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-ZM", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatLabel(value: string | null | undefined) {
  if (!value) return "All";
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function statusVariant(status: string | null | undefined) {
  const normalized = status?.toLowerCase();
  if (normalized === "approved") return "success" as const;
  if (normalized === "pending" || normalized === "flagged") return "warning" as const;
  if (normalized === "rejected") return "danger" as const;
  return "secondary" as const;
}

function InlineAlert({ alert, onDismiss }: Readonly<{ alert: AlertState; onDismiss: () => void }>) {
  if (!alert) return null;
  const isError = alert.type === "error";

  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm",
        isError ? "border-danger/30 bg-danger/5 text-danger" : "border-success/30 bg-success/5 text-success",
      )}
    >
      {isError ? <AlertCircle className="mt-0.5 size-4 shrink-0" /> : <CheckCircle className="mt-0.5 size-4 shrink-0" />}
      <p className="flex-1">{alert.message}</p>
      <button type="button" onClick={onDismiss} className="shrink-0 opacity-60 hover:opacity-100">
        <X className="size-4" />
      </button>
    </div>
  );
}

function Rating({ value }: Readonly<{ value: number }>) {
  return (
    <div className="flex items-center gap-1 text-warning">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={cn("size-4", index < value ? "fill-current" : "opacity-30")}
          aria-hidden="true"
        />
      ))}
      <span className="ml-1 text-xs font-medium text-muted">{value}/5</span>
    </div>
  );
}

export function AdminReviewsManager() {
  const [status, setStatus] = useState<ReviewStatus>("pending");
  const [page, setPage] = useState(1);
  const [alert, setAlert] = useState<AlertState>(null);
  const limit = 10;
  const { data, loading, error } = useQuery<ReviewQueueData>(ADMIN_REVIEW_QUEUE_QUERY, {
    variables: {
      status: status || undefined,
      page,
      limit,
    },
    fetchPolicy: "cache-and-network",
  });
  const [moderateReview, { loading: moderating }] = useMutation(ADMIN_MODERATE_REVIEW_MUTATION);

  const reviews = data?.reviewQueue?.items ?? [];
  const total = data?.reviewQueue?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  async function handleModerate(reviewId: string, decision: Decision) {
    setAlert(null);
    try {
      await moderateReview({
        variables: { reviewId, decision },
        refetchQueries: [
          {
            query: ADMIN_REVIEW_QUEUE_QUERY,
            variables: { status: status || undefined, page, limit },
          },
        ],
      });
      setAlert({ type: "success", message: `Review marked ${decision}.` });
    } catch {
      setAlert({ type: "error", message: "Unable to moderate review." });
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
          Admin Workspace
        </p>
        <h1 className="text-3xl font-semibold text-text sm:text-4xl">Reviews</h1>
        <p className="max-w-3xl text-sm text-muted">
          Moderate provider reviews before they appear on public provider pages.
        </p>
      </header>

      <InlineAlert alert={alert} onDismiss={() => setAlert(null)} />

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquareWarning className="size-5 text-primary" />
                Review Queue
              </CardTitle>
              <p className="mt-2 text-sm text-muted">
                Filter pending, approved, rejected, or flagged reviews.
              </p>
            </div>
            <Badge variant="secondary">{total}</Badge>
          </div>
          <div className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl border border-border bg-surface p-1">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter || "all"}
                type="button"
                onClick={() => {
                  setStatus(filter);
                  setPage(1);
                }}
                className={cn(
                  "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition",
                  status === filter ? "bg-primary text-white shadow-sm" : "text-muted hover:text-text",
                )}
              >
                {filter || "all"}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <p className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
              Unable to load review queue.
            </p>
          ) : null}
          {loading && reviews.length === 0 ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-28 animate-pulse rounded-xl bg-border/50" />
              ))}
            </div>
          ) : null}
          {!loading && reviews.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted">
              No reviews match the current status.
            </p>
          ) : null}
          <div className="space-y-3">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-xl border border-border bg-surface px-4 py-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={statusVariant(review.moderationStatus)}>
                        {formatLabel(review.moderationStatus)}
                      </Badge>
                      <Rating value={review.rating} />
                    </div>
                    <p className="text-sm font-semibold text-text">
                      {review.reviewerName ?? "Reviewer"}
                    </p>
                    <p className="text-sm leading-6 text-muted">
                      {review.comment ?? "No comment provided."}
                    </p>
                    <p className="text-xs text-muted">
                      Appointment {review.appointmentId} · Provider {review.providerId} · {formatDate(review.createdAt)}
                    </p>
                    {review.providerReply ? (
                      <div className="rounded-xl border border-border bg-background px-3 py-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                          Provider reply
                        </p>
                        <p className="mt-1 text-sm text-text">{review.providerReply}</p>
                        <p className="mt-1 text-xs text-muted">{formatDate(review.providerRepliedAt)}</p>
                      </div>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <Button
                      type="button"
                      size="sm"
                      disabled={moderating}
                      onClick={() => void handleModerate(review.id, "approved")}
                    >
                      <CheckCircle className="size-4" />
                      Approve
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={moderating}
                      onClick={() => void handleModerate(review.id, "flagged")}
                    >
                      <Flag className="size-4" />
                      Flag
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={moderating}
                      onClick={() => void handleModerate(review.id, "rejected")}
                    >
                      <X className="size-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">
              Page {page} of {totalPages} · {total} total reviews
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                <ChevronLeft className="size-4" />
                Previous
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

