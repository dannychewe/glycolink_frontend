import { gql } from "@apollo/client";

export const MY_PRESCRIPTIONS_QUERY = gql`
  query PatientPrescriptions {
    myPrescriptions {
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

export const PATIENT_RECENT_PRESCRIPTIONS_QUERY = gql`
  query PatientRecentPrescriptions($limit: Int) {
    recentPrescriptions(limit: $limit) {
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
`;

export const PATIENT_ACTIVE_MEDICATIONS_QUERY = gql`
  query PatientActiveMedications {
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

export const PATIENT_PHARMACY_ORDERS_QUERY = gql`
  query PatientPharmacyOrders($pharmacyId: UUID) {
    pharmacyOrders(pharmacyId: $pharmacyId) {
      id
      status
      totalAmount
      prescriptionId
      patientId
    }
  }
`;
