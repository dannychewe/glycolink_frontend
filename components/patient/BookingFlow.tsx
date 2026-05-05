"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useRouter } from "next/navigation";
import { BookingCalendar } from "@/components/patient/BookingCalendar";
import { BookingSummary } from "@/components/patient/BookingSummary";
import { TimeSlotPicker } from "@/components/patient/TimeSlotPicker";
import { getGraphQLErrorCode, getGraphQLErrorMessage } from "@/features/auth/auth-context";
import { AVAILABLE_SLOTS_QUERY, BOOK_APPOINTMENT_MUTATION } from "@/lib/bookings/graphql";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { BookableProvider } from "@/types";

type BookingFlowProps = Readonly<{
  provider: BookableProvider;
}>;

type AvailableSlotsData = {
  availableSlots: Array<{
    startTime: string;
    endTime: string;
  }>;
};

type BookAppointmentData = {
  bookAppointment: {
    appointment: {
      id: string;
      providerId: string;
      patientId: string;
      startsAt: string;
      endsAt: string;
      status: string;
      consultationType: string | null;
    };
  };
};

function buildDateWindow(days = 14) {
  const today = new Date();
  return Array.from({ length: days }).map((_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index + 1);
    return date.toISOString().slice(0, 10);
  });
}

function formatSlotLabel(startTime: string) {
  const parsed = new Date(startTime);
  if (Number.isNaN(parsed.getTime())) return startTime;

  return parsed.toLocaleTimeString("en-ZM", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mapBookingError(error: unknown) {
  const code = getGraphQLErrorCode(error);
  if (code === "UNAUTHENTICATED") return "Please sign in to book an appointment.";
  if (code === "PATIENT_PROFILE_INCOMPLETE") {
    return "Please complete your patient profile before booking.";
  }
  if (code === "PROVIDER_NOT_AVAILABLE") {
    return "This provider is not currently eligible for booking.";
  }
  if (code === "INVALID_SLOT") return "This slot is invalid. Please choose another slot.";
  if (code === "SLOT_UNAVAILABLE") return "This slot is no longer available. Please pick another one.";
  if (code === "INVALID_CONSULTATION_TYPE") return "Invalid consultation type selected.";
  if (code === "TENANT_ACCESS_DENIED") return "You do not have access in this tenant.";
  return getGraphQLErrorMessage(error, "Unable to create appointment right now. Please try again.");
}

export function BookingFlow({ provider }: BookingFlowProps) {
  const router = useRouter();
  const dateWindow = useMemo(() => buildDateWindow(14), []);
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | undefined>();
  const [bookingAlert, setBookingAlert] = useState<string | null>(null);
  const { data: slotsData, loading: slotsLoading } = useQuery<AvailableSlotsData>(AVAILABLE_SLOTS_QUERY, {
    variables: selectedDate ? { providerId: provider.id, date: selectedDate } : undefined,
    fetchPolicy: "network-only",
    skip: !selectedDate,
  });
  const [bookAppointment, { loading: isCreating }] = useMutation<BookAppointmentData>(
    BOOK_APPOINTMENT_MUTATION,
  );

  const availableDates = useMemo(
    () => dateWindow.map((date) => ({ date, hasSlots: true })),
    [dateWindow],
  );

  const currentSlots = useMemo(
    () =>
      (slotsData?.availableSlots ?? []).map((slot) => ({
        value: slot.startTime,
        label: formatSlotLabel(slot.startTime),
      })),
    [slotsData?.availableSlots],
  );
  const selectedSlot = useMemo(
    () => (slotsData?.availableSlots ?? []).find((slot) => slot.startTime === selectedTime),
    [selectedTime, slotsData?.availableSlots],
  );

  const canConfirm = Boolean(selectedDate && selectedSlot && provider.isAvailable);

  function handleSelectDate(date: string) {
    setSelectedDate(date);
    setSelectedTime(undefined);
    setBookingAlert(null);
  }

  async function handleConfirmBooking() {
    if (!selectedDate || !selectedSlot) {
      return;
    }

    setBookingAlert(null);
    try {
      await bookAppointment({
        variables: {
          providerId: provider.id,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          consultationType: "telemedicine",
        },
      });
      router.push("/patient/bookings");
    } catch (error) {
      setBookingAlert(mapBookingError(error));
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <h2 className="text-lg font-semibold text-text">Provider Summary</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted">Provider</p>
              <p className="text-xl font-semibold text-text">{provider.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted">Specialty</p>
              <p className="text-base font-medium text-text">{provider.specialty}</p>
            </div>
            <div>
              <p className="text-sm text-muted">Consultation fee</p>
              <p className="text-base font-medium text-text">ZMW {provider.consultationFee}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <h2 className="text-lg font-semibold text-text">Select a Date</h2>
          </CardHeader>
          <CardContent>
            <BookingCalendar
              dates={availableDates}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <h2 className="text-lg font-semibold text-text">Choose a Time Slot</h2>
          </CardHeader>
          <CardContent>
            {slotsLoading ? (
              <p className="text-sm text-muted">Loading available slots...</p>
            ) : (
              <TimeSlotPicker
                slots={currentSlots}
                selectedTime={selectedTime}
                onSelectTime={setSelectedTime}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-5">
        <BookingSummary
          provider={provider}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
        />

        <Button
          type="button"
          size="lg"
          fullWidth
          disabled={!canConfirm || isCreating}
          onClick={handleConfirmBooking}
        >
          {isCreating ? "Confirming..." : "Confirm Booking"}
        </Button>
        {bookingAlert ? (
          <p className="rounded-xl border border-warning/30 bg-warning/5 px-3 py-2 text-sm text-warning">
            {bookingAlert}
          </p>
        ) : null}
      </div>
    </div>
  );
}
