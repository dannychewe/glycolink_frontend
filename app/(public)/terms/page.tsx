import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/public/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service | Naje Health",
  description: "Terms for using the Naje Health care coordination platform.",
};

export default function TermsPage() {
  return (
    <LegalPage eyebrow="Naje Health · Service terms" title="Terms of Service">
      <p>
        These terms apply when you access the Naje Health website or platform
        (“service”). By creating an account or using the service, you agree to
        these terms. If you use Naje through a clinic or care programme, that
        organization may also set terms for its services.
      </p>
      <LegalSection title="What Naje provides">
        <p>
          Naje provides digital tools that help patients and care organizations
          coordinate diabetes and related care, including profiles, care plans,
          monitoring, records, messages, appointments, and consultations where
          available. Features may vary by clinic, location, or account role.
        </p>
      </LegalSection>
      <LegalSection title="Healthcare and emergencies">
        <p>
          Naje is a technology service and does not replace your clinician or
          establish a clinician-patient relationship by itself. Your clinician
          is responsible for medical decisions and advice. Information in the
          service may be incomplete or delayed; do not rely on it as the sole
          basis for treatment decisions. For diagnosis or treatment, consult a
          qualified healthcare professional. For an emergency, contact local
          emergency services or seek urgent in-person care; do not use Naje
          messages or alerts as an emergency channel.
        </p>
        <p>
          Unless Naje has separately obtained and disclosed any required
          regulatory authorization, the service is not represented as a medical
          device and is not intended to diagnose, treat, cure, or prevent
          disease.
        </p>
      </LegalSection>
      <LegalSection title="Your account and responsibilities">
        <p>
          Provide accurate information, keep your sign-in credentials private,
          and tell us promptly if you suspect unauthorized access. Use the
          service lawfully and only for its intended care-coordination purpose.
          Do not access another person’s records without authorization,
          interfere with the service, or submit information you are not entitled
          to share.
        </p>
      </LegalSection>
      <LegalSection title="Clinics, clinicians, and care services">
        <p>
          Clinics and clinicians control their own care relationships, clinical
          decisions, and any professional services they provide. They may have
          separate terms, privacy notices, fees, and cancellation rules. Naje
          does not guarantee a particular clinical outcome, response time,
          appointment availability, or continuous, uninterrupted access to the
          platform.
        </p>
      </LegalSection>
      <LegalSection title="Availability and changes">
        <p>
          We may change, suspend, or discontinue features to maintain or improve
          the service, meet legal requirements, or address security or
          operational issues. We will take reasonable steps to communicate
          material changes when appropriate.
        </p>
      </LegalSection>
      <LegalSection title="Privacy and deletion">
        <p>
          Our{" "}
          <a className="font-medium text-primary underline" href="/privacy">
            Privacy Policy
          </a>{" "}
          describes how information is handled. You can request account deletion
          at{" "}
          <a
            className="font-medium text-primary underline"
            href="/delete-account"
          >
            najehealth.com/delete-account
          </a>
          . Some records may be retained when required or permitted by law.
        </p>
      </LegalSection>
      <LegalSection title="Contact">
        <p>
          Questions about these terms can be sent to{" "}
          <a
            className="font-medium text-primary underline"
            href="mailto:support@najehealth.com"
          >
            support@najehealth.com
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
