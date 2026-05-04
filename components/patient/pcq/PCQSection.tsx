import { QuestionRenderer } from "@/components/patient/pcq/QuestionRenderer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { PCQSection as PCQSectionType } from "@/types";

type PCQSectionProps = Readonly<{
  section: PCQSectionType;
  disabled?: boolean;
}>;

export function PCQSection({ section, disabled = false }: PCQSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <h2 className="text-lg font-semibold text-text">{section.title}</h2>
      </CardHeader>
      <CardContent className="space-y-5">
        {section.questions.map((question) => (
          <QuestionRenderer
            key={question.id}
            question={question}
            disabled={disabled}
          />
        ))}
      </CardContent>
    </Card>
  );
}
