import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ConsultantPatientPcqItem } from "@/types";

type PatientPcqSectionProps = Readonly<{
  items: ConsultantPatientPcqItem[];
}>;

export function PatientPcqSection({ items }: PatientPcqSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>PCQ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item, index) => (
          <div
            key={`${item.question}-${index}`}
            className="rounded-xl border border-border bg-background px-4 py-4"
          >
            <p className="text-sm font-semibold text-text">{item.question}</p>
            <p className="mt-2 text-sm leading-6 text-muted">{item.answer}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
