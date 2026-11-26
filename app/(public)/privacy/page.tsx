import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/public/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy | Naje Health",
  description:
    "How Naje Health collects, uses, shares, and protects personal and health information.",
};

export default function PrivacyPage() {
  return (
    <LegalPage eyebrow="Naje Health · Privacy" title="Privacy Policy">
      <p>
        This policy explains how Naje Health (“Naje”, “we”, “us”) handles
        information through the Naje Health website and care platform, including
        the Naje app. It applies to patients, clinicians, clinic staff, and
        visitors. Your clinic or clinician may also have its own privacy notice
        and responsibilities for your clinical record.
      </p>
      <LegalSection title="Information we handle">
        <p>Depending on the features you use, information may include:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            Account and contact details, such as your name, email address, phone
            number, and account credentials.
          </li>
          <li>
            Health and care information you or your care team enter: date of
            birth, diabetes type and diagnosis history, allergies, medicines,
            notes, glucose readings and trends, labs, prescriptions, care plans,
            questionnaires, alerts, and clinical records.
          </li>
          <li>
            Emergency contact details you provide, and information about
            appointments, consultations, care-team messages, programme
            participation, and payments or billing where those features are
            used.
          </li>
          <li>
            Basic technical information needed to authenticate you, keep the
            service working, and protect accounts, such as session data and
            service logs.
          </li>
        </ul>
        <p>
          Please provide only information needed for your care and use of the
          service. Do not use messages for emergencies.
        </p>
      </LegalSection>
      <LegalSection title="How we use information">
        <p>
          We use information to create and secure accounts; provide patient and
          clinic workspaces; support care coordination, monitoring,
          appointments, consultations, messaging, records, and billing; respond
          to requests; maintain and troubleshoot the service; and meet legal,
          safety, and operational obligations.
        </p>
      </LegalSection>
      <LegalSection title="Who may receive information">
        <p>
          Your information may be available to the clinic, programme staff, and
          clinicians responsible for your care or whom you choose to connect
          with, according to account roles and your privacy settings. Naje
          processes information to provide the platform. We may use service
          providers for hosting and platform infrastructure, authentication,
          communications or video consultations, and payment processing when
          those features are used. They may process information only to provide
          or support their services to us.
        </p>
        <p>
          We may disclose information when required by law, to protect people or
          the service, or in connection with a business transfer with
          appropriate notice. We do not sell personal health information.
        </p>
      </LegalSection>
      <LegalSection title="Your choices and rights">
        <p>
          You can review and update some profile details, privacy preferences,
          and consent records in your account settings. Depending on applicable
          law, you may also ask to access, correct, restrict, or delete personal
          information. To request account and associated data deletion, visit{" "}
          <a
            className="font-medium text-primary underline"
            href="/delete-account"
          >
            Delete account
          </a>
          . Some clinical, payment, security, or legal records may need to be
          retained where the law requires or permits it; we will restrict those
          records and explain the applicable reason when responding.
        </p>
      </LegalSection>
      <LegalSection title="Retention">
        <p>
          We keep account and related information while your account or care
          relationship is active and for as long as needed for the purposes
          above. When an account deletion request is completed, we delete or
          de-identify associated information where feasible, subject to records
          we must or may retain for clinical, legal, accounting, security, or
          dispute-resolution reasons. Retained information is kept only as long
          as that reason applies. Retention periods can depend on the clinic and
          the laws that apply to the record.
        </p>
      </LegalSection>
      <LegalSection title="Security and international processing">
        <p>
          We use administrative, technical, and organizational safeguards
          intended to protect information. No online service can promise
          absolute security. Naje and its service providers may process
          information in locations where they or their systems operate, subject
          to applicable safeguards and law.
        </p>
      </LegalSection>
      <LegalSection title="Children and changes">
        <p>
          Naje is designed for care programmes overseen by clinics. A parent,
          guardian, or authorized representative should contact the clinic
          before a minor uses the service. We may update this policy as the
          service or law changes; the current version and effective date will be
          posted here.
        </p>
      </LegalSection>
      <LegalSection title="Contact Naje Health">
        <p>
          For privacy questions or requests, email{" "}
          <a
            className="font-medium text-primary underline"
            href="mailto:support@najehealth.com"
          >
            support@najehealth.com
          </a>{" "}
          with “Privacy request” in the subject. Do not include detailed medical
          information in an ordinary email. You may also contact your clinic
          about records it holds.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
