import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AppointmentCardProps = Readonly<{
  title: string;
  meta: string;
  description: string;
}>;

export function AppointmentCard({ title, meta, description }: AppointmentCardProps) {
  return (
    <Card>
      <CardHeader>
        <p className="text-sm font-medium uppercase tracking-[0.14em] text-muted">{meta}</p>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{description}</p>
      </CardContent>
    </Card>
  );
}
