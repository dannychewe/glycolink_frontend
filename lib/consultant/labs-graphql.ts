import { gql } from "@apollo/client";

export const PENDING_LAB_REVIEWS_QUERY = gql`
  query ConsultantPendingLabReviews($limit: Int) {
    pendingLabReviews(limit: $limit) {
      patientName
      labOrder {
        id
        status
        orderedAt
        encounterId
        patientId
      }
      results {
        testId
        testName
        result {
          id
          valueText
          valueNumeric
          unit
          referenceRange
          flag
          resultedAt
          criticalFlags {
            id
            severity
            notifiedProviderAt
            acknowledgedAt
          }
        }
      }
    }
  }
`;

export const LAB_ORDERS_BY_ENCOUNTER_QUERY = gql`
  query ConsultantLabOrdersByEncounter($encounterId: UUID!) {
    labOrdersByEncounter(encounterId: $encounterId) {
      id
      status
      orderedAt
      patientId
      tests {
        id
        testName
        priority
        results {
          id
          valueText
          valueNumeric
          unit
          flag
          resultedAt
        }
      }
    }
  }
`;

export const CREATE_LAB_ORDER_MUTATION = gql`
  mutation ConsultantCreateLabOrder($encounterId: UUID!, $tests: [LabOrderTestInput!]!) {
    createLabOrder(encounterId: $encounterId, tests: $tests) {
      labOrder {
        id
        status
        orderedAt
        tests {
          id
          testName
          priority
        }
      }
    }
  }
`;

export const REVIEW_LAB_RESULTS_MUTATION = gql`
  mutation ConsultantReviewLabResults($labOrderId: UUID!, $notes: String!) {
    reviewLabResults(labOrderId: $labOrderId, notes: $notes) {
      reviewNote {
        id
        note
        createdAt
        providerId
      }
    }
  }
`;

export const CLOSE_LAB_ORDER_MUTATION = gql`
  mutation ConsultantCloseLabOrder($labOrderId: UUID!) {
    closeLabOrder(labOrderId: $labOrderId) {
      labOrder {
        id
        status
      }
    }
  }
`;

export const LAB_TEST_SUGGESTIONS = [
  "HbA1c",
  "Fasting Blood Glucose",
  "Random Blood Glucose",
  "Urine Albumin-Creatinine Ratio (UACR)",
  "Creatinine & eGFR",
  "Lipid Panel",
  "Liver Function Tests",
  "Complete Blood Count (CBC)",
  "Thyroid Function (TSH)",
  "Urine Dipstick",
  "Urea & Electrolytes",
  "Vitamin B12",
] as const;

export const LAB_PRIORITY_OPTIONS = [
  { value: "ROUTINE", label: "Routine" },
  { value: "URGENT", label: "Urgent" },
  { value: "STAT", label: "STAT" },
] as const;
