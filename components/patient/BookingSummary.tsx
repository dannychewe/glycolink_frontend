import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { BookableProvider } from "@/types";

type BookingSummaryProps = Readonly<{
  provider: BookableProvider;
  selectedDate?: string;
  /** Already formatted for display (e.g. "2:00 PM") — never the raw ISO value. */
  selectedTimeLabel?: string;
}>;

function formatDate(date?: string) {
  if (!date) {
    return "Select a date";
  }

  return new Intl.DateTimeFormat("en-ZM", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function BookingSummary({
  provider,
  selectedDate,
  selectedTimeLabel,
}: BookingSummaryProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <h2 className="text-lg font-semibold text-text">Booking Summary</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted">Provider</p>
          <p className="text-base font-medium text-text">{provider.name}</p>
        </div>
        <div>
          <p className="text-sm text-muted">Date</p>
          <p className="text-base font-medium text-text">{formatDate(selectedDate)}</p>
        </div>
        <div>
          <p className="text-sm text-muted">Time</p>
          <p className="text-base font-medium text-text">{selectedTimeLabel ?? "Select a time slot"}</p>
        </div>
        <div>
          <p className="text-sm text-muted">Consultation fee</p>
          <p className="text-xl font-semibold text-text">ZMW {provider.consultationFee}</p>
        </div>
      </CardContent>
    </Card>
  );
}
