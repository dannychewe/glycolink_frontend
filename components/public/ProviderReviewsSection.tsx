"use client";

import { useEffect, useState } from "react";
import { Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProviderReview } from "@/types";

type ProviderReviewsSectionProps = Readonly<{
  reviews: ProviderReview[];
}>;

export function ProviderReviewsSection({ reviews }: ProviderReviewsSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const previewReviews = reviews.slice(0, 2);

  return (
    <>
      <section className="border-t border-border/80 pt-8">
        <div className="space-y-5">
          <div className="space-y-2">
            <h2 className="text-2xl">Patient reviews</h2>
            <p>Recent feedback from patients who have consulted this provider.</p>
          </div>

          <div className="space-y-4">
            {previewReviews.map((review) => (
              <article
                key={review.id}
                className="space-y-3 rounded-2xl bg-surface px-5 py-5 shadow-soft"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-text">{review.title}</h3>
                    <p className="text-sm text-muted">{review.author}</p>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-medium text-warning">
                    <Star className="size-4 fill-current" />
                    {review.rating.toFixed(1)}
                  </div>
                </div>
                <p>{review.comment}</p>
              </article>
            ))}
          </div>

          {reviews.length > previewReviews.length ? (
            <div>
              <Button type="button" variant="secondary" onClick={() => setIsOpen(true)}>
                See more reviews
              </Button>
            </div>
          ) : null}
        </div>
      </section>

      {isOpen ? (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/55 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reviews-modal-title"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-[1.75rem] bg-surface shadow-subtle"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
              <div className="space-y-1">
                <h2 id="reviews-modal-title" className="text-xl font-semibold text-text">
                  All patient reviews
                </h2>
                <p className="text-sm text-muted">Browse the full set of recent patient feedback.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-surface text-text transition hover:bg-slate-50"
                aria-label="Close reviews modal"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
              {reviews.map((review) => (
                <article
                  key={review.id}
                  className="space-y-3 rounded-2xl border border-border bg-background px-5 py-5"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold text-text">{review.title}</h3>
                      <p className="text-sm text-muted">{review.author}</p>
                    </div>
                    <div className="flex items-center gap-1 text-sm font-medium text-warning">
                      <Star className="size-4 fill-current" />
                      {review.rating.toFixed(1)}
                    </div>
                  </div>
                  <p>{review.comment}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
