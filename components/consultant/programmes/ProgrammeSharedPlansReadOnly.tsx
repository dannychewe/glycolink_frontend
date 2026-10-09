"use client";

import { useState } from "react";
import { useUrlState } from "@/lib/use-url-state";
import { useQuery } from "@apollo/client";
import { Button } from "@/components/ui/button";
import { DetailModal } from "@/components/ui/detail-modal";
import { WorkspaceTabs } from "@/components/ui/workspace-tabs";
import {
  CARE_PLAN_PROGRAMMES_QUERY,
  type CarePlanProgramme,
} from "@/lib/programmes/graphql";

export function ProgrammeSharedPlansReadOnly({
  programmeId,
  active,
}: {
  programmeId: string;
  active: boolean;
}) {
  const [type, setType] = useUrlState("sharedPlanTab", "GENERAL", [
    "GENERAL",
    "MEAL_PLAN",
    "EXERCISE_PLAN",
  ]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const query = useQuery<{ carePlanProgrammes: CarePlanProgramme[] }>(
    CARE_PLAN_PROGRAMMES_QUERY,
    {
      variables: { programmeId },
      skip: !active,
      fetchPolicy: "cache-and-network",
    },
  );
  const plans = query.data?.carePlanProgrammes ?? [];
  const selected = plans.find((plan) => plan.id === selectedId);
  const tabs = [
    { key: "GENERAL", label: "General Plans" },
    { key: "MEAL_PLAN", label: "Meal Plans" },
    { key: "EXERCISE_PLAN", label: "Exercise Plans" },
  ];
  return (
    <div className="space-y-4">
      <WorkspaceTabs
        id="patient-shared-plans"
        label="Shared programme plans"
        value={type}
        onChange={setType}
        tabs={tabs.map((tab) => ({
          ...tab,
          count: plans.filter((plan) => plan.planType === tab.key).length,
        }))}
      />
      {tabs.map((tab) => (
        <div
          key={tab.key}
          role="tabpanel"
          id={`patient-shared-plans-panel-${tab.key}`}
          aria-labelledby={`patient-shared-plans-tab-${tab.key}`}
          hidden={type !== tab.key}
        >
          {query.error ? (
            <div role="alert" className="space-y-3 text-sm text-danger">
              <p>Unable to load shared programme plans.</p>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => void query.refetch()}
              >
                Retry
              </Button>
            </div>
          ) : query.loading && !query.data ? (
            <p className="py-6 text-sm text-muted">Loading plans...</p>
          ) : plans.some((plan) => plan.planType === tab.key) ? (
            plans
              .filter((plan) => plan.planType === tab.key)
              .map((plan) => (
                <div
                  key={plan.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-semibold">
                      {plan.title}
                    </p>
                    {plan.description ? (
                      <p className="mt-1 line-clamp-2 break-words text-sm text-muted">
                        {plan.description}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setSelectedId(plan.id)}
                  >
                    View details
                  </Button>
                </div>
              ))
          ) : (
            <p className="py-8 text-center text-sm text-muted">
              No shared plans of this type.
            </p>
          )}
        </div>
      ))}
      {selected ? (
        <DetailModal
          title={selected.title}
          onClose={() => setSelectedId(null)}
          footer={
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setSelectedId(null)}
            >
              Close
            </Button>
          }
        >
          <div className="space-y-4 text-sm">
            {selected.description ? (
              <p className="whitespace-pre-wrap break-words">
                {selected.description}
              </p>
            ) : null}
            <dl className="grid grid-cols-3 gap-3">
              <div>
                <dt className="text-xs text-muted">Start day</dt>
                <dd>{selected.startsOnDay ?? "Not set"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">End day</dt>
                <dd>{selected.endsOnDay ?? "Not set"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Duration</dt>
                <dd>
                  {selected.durationDays != null
                    ? `${selected.durationDays} days`
                    : "Not set"}
                </dd>
              </div>
            </dl>
            {selected.instructions ? (
              <p className="whitespace-pre-wrap break-words text-muted">
                {selected.instructions}
              </p>
            ) : null}
            <ul className="divide-y divide-border">
              {selected.items.map((item) => (
                <li key={item.id} className="space-y-2 py-3">
                  <p className="break-words font-medium">{item.title}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-muted">
                    {item.dayNumber != null ? (
                      <span>Day {item.dayNumber}</span>
                    ) : null}
                    {item.timeOfDay ? <span>{item.timeOfDay}</span> : null}
                    {item.mealType ? (
                      <span>{item.mealType.replace(/_/g, " ")}</span>
                    ) : null}
                    {item.exerciseType ? (
                      <span>{item.exerciseType}</span>
                    ) : null}
                    {item.durationMinutes != null ? (
                      <span>{item.durationMinutes} minutes</span>
                    ) : null}
                    {item.intensity ? <span>{item.intensity}</span> : null}
                  </div>
                  {item.description ? (
                    <p className="break-words text-muted">{item.description}</p>
                  ) : null}
                  {item.instructions ? (
                    <p className="whitespace-pre-wrap break-words text-muted">
                      {item.instructions}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </DetailModal>
      ) : null}
    </div>
  );
}
