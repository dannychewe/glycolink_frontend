import { ProviderBookingPageView } from "@/components/patient/providers/ProviderBookingPageView";
import { Container } from "@/components/ui/container";

type BookingPageProps = Readonly<{
  params: Promise<{
    id: string;
  }>;
}>;

export default async function BookingPage({ params }: BookingPageProps) {
  const { id } = await params;

  return (
    <Container className="space-y-6 py-2">
      <div className="max-w-2xl space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
          Booking
        </p>
        <h1 className="text-3xl sm:text-4xl">Book your consultation</h1>
        <p>
          Choose a date and time that works for you, then confirm your appointment with your
          selected provider.
        </p>
      </div>

      <ProviderBookingPageView providerId={id} />
    </Container>
  );
}
