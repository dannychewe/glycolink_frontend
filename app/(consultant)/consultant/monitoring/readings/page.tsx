import { ConsultantGlucoseReadingsOverview } from "@/components/consultant/monitoring/ConsultantGlucoseReadingsOverview";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";

export default function ConsultantMonitoringReadingsPage() {
  return (
    <Container className="space-y-6 py-2">
      <PageHeader
        eyebrow="Patient monitoring"
        title="Glucose readings"
        description="Review latest glucose logs across patients and open the patient record for the full log."
        breadcrumbs={[
          { label: "Monitoring", href: "/consultant/monitoring" },
          { label: "Readings" },
        ]}
      />
      <ConsultantGlucoseReadingsOverview limit={50} showViewAll={false} />
    </Container>
  );
}
