"use client";

import { useEffect, useMemo, useState } from "react";
import { AppointmentCard } from "@/components/patient/appointments/AppointmentCard";
import { cn } from "@/lib/utils/cn";
import { getStoredAppointments } from "@/lib/bookings/appointment-storage";
import type { Appointment } from "@/types";

type AppointmentsListViewProps = Readonly<{
  appointments: Appointment[];
}>;

type AppointmentTab = "Upcoming" | "Past" | "Cancelled";

const tabs: AppointmentTab[] = ["Upcoming", "Past", "Cancelled"];

export function AppointmentsListView({
  appointments,
}: AppointmentsListViewProps) {
  const [activeTab, setActiveTab] = useState<AppointmentTab>("Upcoming");
  const [allAppointments, setAllAppointments] = useState<Appointment[]>(appointments);

  useEffect(() => {
    const storedAppointments = getStoredAppointments();
    const mergedAppointments = [...appointments];

    storedAppointments.forEach((storedAppointment) => {
      const existingIndex = mergedAppointments.findIndex(
        (appointment) => appointment.id === storedAppointment.id,
      );

      if (existingIndex >= 0) {
        mergedAppointments[existingIndex] = storedAppointment;
      } else {
        mergedAppointments.unshift(storedAppointment);
      }
    });

    setAllAppointments(
      mergedAppointments.sort(
        (left, right) =>
          new Date(right.date).getTime() - new Date(left.date).getTime(),
      ),
    );
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    return allAppointments.filter((appointment) => {
      if (activeTab === "Cancelled") {
        return appointment.status === "CANCELLED" || appointment.status === "RESCHEDULED";
      }

      if (activeTab === "Past") {
        return appointment.status === "COMPLETED" || appointment.status === "NO_SHOW";
      }

      return (
        appointment.status === "PENDING" ||
        appointment.status === "REQUESTED" ||
        appointment.status === "AWAITING_PAYMENT" ||
        appointment.status === "CONFIRMED" ||
        appointment.status === "CHECKED_IN" ||
        appointment.status === "IN_PROGRESS"
      );
    });
  }, [activeTab, allAppointments]);

  return (
    <div className="space-y-6">
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

      <p className="text-sm text-muted">
        {activeTab === "Upcoming"
          ? "Requested, payment-pending, confirmed, and in-progress appointments."
          : activeTab === "Past"
            ? "Completed appointments and missed consultations."
            : "Appointments you have cancelled."}
      </p>

      {filteredAppointments.length > 0 ? (
        <div className="grid gap-4">
          {filteredAppointments.map((appointment) => (
            <AppointmentCard key={appointment.id} appointment={appointment} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center shadow-soft">
          <p className="text-base font-medium text-text">No appointments found</p>
        </div>
      )}
    </div>
  );
}
