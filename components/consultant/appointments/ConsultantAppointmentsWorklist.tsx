"use client";

import { useMemo, useState } from "react";
import { ConsultantAppointmentCard } from "@/components/consultant/appointments/ConsultantAppointmentCard";
import { cn } from "@/lib/utils/cn";
import type { ConsultantWorklistAppointment } from "@/types";

type ConsultantAppointmentsWorklistProps = Readonly<{
  appointments: ConsultantWorklistAppointment[];
}>;

type ConsultantAppointmentsTab = "Today" | "Upcoming" | "Completed";

const tabs: ConsultantAppointmentsTab[] = ["Today", "Upcoming", "Completed"];

function getPriorityRank(status: ConsultantWorklistAppointment["status"]) {
  if (status === "READY") {
    return 0;
  }

  if (status === "UPCOMING" || status === "IN_PROGRESS") {
    return 1;
  }

  return 2;
}

function sortAppointments(appointments: ConsultantWorklistAppointment[]) {
  return [...appointments].sort((left, right) => {
    const priorityDifference =
      getPriorityRank(left.status) - getPriorityRank(right.status);

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    const leftDateTime = new Date(`${left.date}T${left.time}:00`).getTime();
    const rightDateTime = new Date(`${right.date}T${right.time}:00`).getTime();

    return leftDateTime - rightDateTime;
  });
}

export function ConsultantAppointmentsWorklist({
  appointments,
}: ConsultantAppointmentsWorklistProps) {
  const [activeTab, setActiveTab] = useState<ConsultantAppointmentsTab>("Today");

  const filteredAppointments = useMemo(() => {
    const today = "2026-04-13";

    const nextAppointments = appointments.filter((appointment) => {
      if (activeTab === "Today") {
        return appointment.date === today;
      }

      if (activeTab === "Upcoming") {
        return (
          appointment.status === "READY" ||
          appointment.status === "UPCOMING" ||
          appointment.status === "IN_PROGRESS"
        );
      }

      return appointment.status === "COMPLETED" || appointment.status === "NO_SHOW";
    });

    return sortAppointments(nextAppointments);
  }, [activeTab, appointments]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3">
        {tabs.map((tab) => {
          const isActive = tab === activeTab;

          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "rounded-xl border px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                isActive
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-surface text-text hover:bg-slate-50",
              )}
              aria-pressed={isActive}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {filteredAppointments.length > 0 ? (
        <div className="grid gap-4">
          {filteredAppointments.map((appointment) => (
            <ConsultantAppointmentCard
              key={appointment.id}
              appointment={appointment}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center shadow-soft">
          <p className="text-base font-medium text-text">No appointments available</p>
        </div>
      )}
    </div>
  );
}
