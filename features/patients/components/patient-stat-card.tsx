import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PatientStatCardProps = Readonly<{
  label: string;
  value: string;
  tone?: "primary" | "success" | "warning" | "danger";
}>;

export function PatientStatCard({
  label,
  value,
  tone = "primary",
}: PatientStatCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Badge variant={tone}>{label}</Badge>
      </CardHeader>
      <CardContent>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardContent>
    </Card>
  );
}
