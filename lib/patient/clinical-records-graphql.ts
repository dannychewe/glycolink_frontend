import { gql } from "@apollo/client";

export const PATIENT_ENCOUNTERS_QUERY = gql`
  query PatientEncounters {
    myEncounters {
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
    }
  }
`;

export const PATIENT_ENCOUNTER_QUERY = gql`
  query PatientEncounter($id: UUID!) {
    encounter(id: $id) {
      id
      appointmentId
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
      amendments {
        id
        soapNoteVersionNumber
        amendmentText
        createdAt
      }
    }
  }
`;
