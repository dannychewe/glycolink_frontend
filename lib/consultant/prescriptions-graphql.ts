import { gql } from "@apollo/client";

export const PRESCRIPTIONS_BY_ENCOUNTER_QUERY = gql`
  query ConsultantPrescriptionsByEncounter($encounterId: UUID!) {
    prescriptionsByEncounter(encounterId: $encounterId) {
      id
      status
      issuedAt
      revokedAt
      items {
        id
        drugName
        dosage
        frequency
        duration
        route
        instructions
        status
      }
    }
  }
`;

export const ACTIVE_MEDICATIONS_QUERY = gql`
  query ConsultantActiveMedications {
    activeMedications {
      id
      prescriptionId
      encounterId
      providerId
      drugName
      dosage
      frequency
      duration
      route
      instructions
      status
      issuedAt
    }
  }
`;

export const CREATE_PRESCRIPTION_MUTATION = gql`
  mutation ConsultantCreatePrescription(
    $encounterId: UUID!
    $items: [PrescriptionItemInput!]!
  ) {
    createPrescription(encounterId: $encounterId, items: $items) {
      prescription {
        id
        status
        issuedAt
        items {
          id
          drugName
          dosage
          frequency
          duration
          route
          instructions
          status
        }
      }
    }
  }
`;

export const REVOKE_PRESCRIPTION_MUTATION = gql`
  mutation ConsultantRevokePrescription($prescriptionId: UUID!, $reason: String!) {
    revokePrescription(prescriptionId: $prescriptionId, reason: $reason) {
      prescription {
        id
        status
        revokedAt
        revocationReason
      }
    }
  }
`;

export const DRUG_SUGGESTIONS = [
  "Metformin",
  "Glimepiride",
  "Glibenclamide",
  "Sitagliptin",
  "Empagliflozin",
  "Dapagliflozin",
  "Insulin glargine",
  "Insulin detemir",
  "Insulin lispro",
  "Insulin aspart",
  "Insulin regular",
  "Insulin premix 70/30",
  "Atorvastatin",
  "Lisinopril",
  "Amlodipine",
  "Losartan",
  "Aspirin",
  "Omeprazole",
] as const;

export const FREQUENCY_OPTIONS = [
  { value: "ONCE_DAILY", label: "Once daily" },
  { value: "TWICE_DAILY", label: "Twice daily" },
  { value: "THREE_TIMES_DAILY", label: "Three times daily" },
  { value: "FOUR_TIMES_DAILY", label: "Four times daily" },
  { value: "EVERY_8_HOURS", label: "Every 8 hours" },
  { value: "EVERY_12_HOURS", label: "Every 12 hours" },
  { value: "AS_NEEDED", label: "As needed (PRN)" },
  { value: "WEEKLY", label: "Weekly" },
] as const;

export const ROUTE_OPTIONS = [
  { value: "ORAL", label: "Oral" },
  { value: "SUBLINGUAL", label: "Sublingual" },
  { value: "INJECTION", label: "Injection (SC/IM)" },
  { value: "IV", label: "Intravenous (IV)" },
  { value: "TOPICAL", label: "Topical" },
  { value: "INHALATION", label: "Inhalation" },
  { value: "NASAL", label: "Nasal" },
  { value: "OPHTHALMIC", label: "Ophthalmic" },
] as const;
