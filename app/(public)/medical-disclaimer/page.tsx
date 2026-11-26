import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/public/LegalPage";

export const metadata: Metadata = {
  title: "Medical Safety Notice | Naje Health",
  description:
    "Important information about the limits of Naje Health and when to contact a healthcare professional.",
};

export default function MedicalDisclaimerPage() {
  return (
    <LegalPage eyebrow="Naje Health · Safety" title="Medical Safety Notice">
      <LegalSection title="Not emergency care">
        <p>
          Naje Health is not an emergency service. Do not use the app, messages,
          monitoring alerts, or consultation scheduling to seek emergency help.
          If you may be experiencing a medical emergency, contact local
          emergency services or go to the nearest emergency facility.
        </p>
      </LegalSection>
      <LegalSection title="Consult a healthcare professional">
        <p>
          Naje Health provides tools for care coordination and sharing
          information with your care team. Content, readings, reminders, and
          summaries are not a substitute for professional medical advice,
          diagnosis, or treatment. Always consult a qualified healthcare
          professional about medical questions and before changing medicines,
          insulin doses, diet, or treatment. Do not ignore or delay professional
          advice because of something you see in the app.
        </p>
      </LegalSection>
      <LegalSection title="Device status">
        <p>
          Naje Health is not intended to diagnose, treat, cure, or prevent any
          disease. This statement describes intended use; it does not determine
          regulatory classification or replace any authorization that may be
          required for a particular feature or market.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
