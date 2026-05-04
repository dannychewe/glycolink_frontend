import { gql } from "@apollo/client";

export const MY_ENCOUNTERS_QUERY = gql`
  query ConsultantEncounters {
    myEncounters {
      id
      appointmentId
      patientId
      providerId
      encounterType
      status
      startedAt
      endedAt
      finalizedAt
    }
  }
`;

export const ENCOUNTER_QUERY = gql`
  query ConsultantEncounter($id: UUID!) {
    encounter(id: $id) {
      id
      appointmentId
      patientId
      providerId
      encounterType
      status
      clinicalSummary
      startedAt
      endedAt
      finalizedAt
      soapVersions {
        id
        versionNumber
        isFinalized
        subjective
        objective
        assessment
        plan
        createdAt
      }
      diagnoses {
        id
        codeSystem
        code
        description
        isPrimary
      }
      observations {
        id
        type
        valueNumeric
        valueText
        unit
      }
      carePlanActions {
        id
        type
        description
        targetDate
        status
      }
    }
  }
`;

export const START_ENCOUNTER_MUTATION = gql`
  mutation ConsultantStartEncounter($appointmentId: UUID!) {
    startEncounter(appointmentId: $appointmentId) {
      encounter {
        id
        status
        startedAt
      }
    }
  }
`;

export const SAVE_SOAP_MUTATION = gql`
  mutation ConsultantSaveSOAP($encounterId: UUID!, $data: SOAPVersionInput!) {
    saveSoap(encounterId: $encounterId, data: $data) {
      soapVersion {
        id
        versionNumber
        subjective
        objective
        assessment
        plan
        createdAt
      }
    }
  }
`;

export const ADD_DIAGNOSIS_MUTATION = gql`
  mutation ConsultantAddDiagnosis($encounterId: UUID!, $data: DiagnosisInput!) {
    addDiagnosis(encounterId: $encounterId, data: $data) {
      diagnosis {
        id
        description
        codeSystem
        code
        isPrimary
      }
    }
  }
`;

export const ADD_OBSERVATION_MUTATION = gql`
  mutation ConsultantAddObservation($encounterId: UUID!, $data: ObservationInput!) {
    addObservation(encounterId: $encounterId, data: $data) {
      observation {
        id
        type
        valueNumeric
        valueText
        unit
      }
    }
  }
`;

export const CREATE_CARE_PLAN_MUTATION = gql`
  mutation ConsultantCreateCarePlan($encounterId: UUID!, $data: CarePlanInput!) {
    createCarePlan(encounterId: $encounterId, data: $data) {
      carePlanAction {
        id
        type
        description
        targetDate
        status
      }
    }
  }
`;

export const ADD_AMENDMENT_MUTATION = gql`
  mutation ConsultantAddAmendment($encounterId: UUID!, $data: AmendmentInput!) {
    addAmendment(encounterId: $encounterId, data: $data) {
      amendment {
        id
        soapNoteVersionNumber
        amendmentText
        createdAt
      }
    }
  }
`;

export const FINALIZE_ENCOUNTER_MUTATION = gql`
  mutation ConsultantFinalizeEncounter($encounterId: UUID!) {
    finalizeEncounter(encounterId: $encounterId) {
      encounter {
        id
        status
        finalizedAt
      }
    }
  }
`;

export const OBSERVATION_TYPE_OPTIONS = [
  { value: "BLOOD_PRESSURE", label: "Blood Pressure", unit: "mmHg" },
  { value: "HEART_RATE", label: "Heart Rate", unit: "bpm" },
  { value: "TEMPERATURE", label: "Temperature", unit: "°C" },
  { value: "WEIGHT", label: "Weight", unit: "kg" },
  { value: "HEIGHT", label: "Height", unit: "cm" },
  { value: "SPO2", label: "SpO₂", unit: "%" },
  { value: "BLOOD_GLUCOSE", label: "Blood Glucose", unit: "mmol/L" },
  { value: "OTHER", label: "Other", unit: "" },
] as const;

export const CARE_PLAN_TYPE_OPTIONS = [
  { value: "MEDICATION", label: "Medication" },
  { value: "LIFESTYLE", label: "Lifestyle" },
  { value: "FOLLOW_UP", label: "Follow-up" },
  { value: "REFERRAL", label: "Referral" },
  { value: "EDUCATION", label: "Patient Education" },
  { value: "MONITORING", label: "Monitoring" },
  { value: "OTHER", label: "Other" },
] as const;

export const CODE_SYSTEM_OPTIONS = [
  { value: "ICD-10", label: "ICD-10" },
  { value: "ICD-11", label: "ICD-11" },
  { value: "SNOMED", label: "SNOMED CT" },
  { value: "LOCAL", label: "Local / Custom" },
] as const;
