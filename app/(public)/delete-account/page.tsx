import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/public/LegalPage";

export const metadata: Metadata = {
  title: "Request Account Deletion | Naje Health",
  description:
    "Request deletion of your Naje Health account and associated personal data.",
};

export default function DeleteAccountPage() {
  return (
    <LegalPage
      eyebrow="Naje Health · Your data"
      title="Request account deletion"
    >
      <p>
        You can request deletion of your Naje Health account and associated
        personal data without signing in. This request applies to your Naje
        account and the information associated with it.
      </p>
      <LegalSection title="How to submit a request">
        <p>
          Email{" "}
          <a
            className="font-semibold text-primary underline"
            href="mailto:support@najehealth.com?subject=Naje%20Health%20account%20deletion%20request"
          >
            support@najehealth.com
          </a>{" "}
          with the subject “Naje Health account deletion request”. Include the
          email address used for your Naje account. Do not send passwords or
          detailed health information. We may ask for reasonable information to
          verify that you control the account before acting.
        </p>
        <p>
          If you cannot email us, ask your clinic to contact Naje on your behalf
          and identify your account using its registered email address.
        </p>
      </LegalSection>
      <LegalSection title="What happens next">
        <p>
          We will confirm receipt and explain any next steps. After verifying
          the request, we will delete or de-identify account information and ask
          relevant service providers to delete it where applicable. Clinical,
          billing, security, or other records may be retained when required or
          permitted by law or needed to resolve a dispute. Any retained records
          will be restricted and kept only for the applicable purpose. Your
          clinic may separately retain its own clinical record under its legal
          obligations.
        </p>
        <p>
          Deletion may end your access to Naje and cannot be undone. We will
          tell you if any information must be retained and why.
        </p>
      </LegalSection>
      <LegalSection title="In-app access">
        <p>
          When signed in, open patient Settings and select “Request account
          deletion” to reach this page and start a request. You can also use the
          email link above from any device.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
