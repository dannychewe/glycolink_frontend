import { Badge } from "@/components/ui/badge";

type SectionHeadingProps = Readonly<{
  eyebrow?: string;
  title: string;
  description?: string;
}>;

export function SectionHeading({ eyebrow, title, description }: SectionHeadingProps) {
  return (
    <div className="max-w-3xl space-y-4">
      {eyebrow ? <Badge variant="secondary">{eyebrow}</Badge> : null}
      <div className="space-y-3">
        <h2 className="text-3xl sm:text-4xl">{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
    </div>
  );
}
