import { gql } from "@apollo/client";

export const RECENT_LAB_RESULTS_QUERY = gql`
  query PatientRecentLabResults($limit: Int, $abnormalOnly: Boolean) {
    recentLabResults(limit: $limit, abnormalOnly: $abnormalOnly) {
      labOrderId
      encounterId
      testId
      testName
      orderedAt
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
`;

export const LATEST_LAB_RESULT_QUERY = gql`
  query PatientLatestLabResult($abnormalOnly: Boolean) {
    latestLabResult(abnormalOnly: $abnormalOnly) {
      labOrderId
      encounterId
      testId
      testName
      orderedAt
      result {
        id
        valueText
        valueNumeric
        unit
        referenceRange
        flag
        resultedAt
      }
    }
  }
`;

export const LAB_ORDER_DETAIL_QUERY = gql`
  query PatientLabOrderDetail($labOrderId: UUID!) {
    labOrderDetail(labOrderId: $labOrderId) {
      id
      status
      orderedAt
      encounterId
      providerId: orderedByProviderId
      tests {
        id
        testName
        priority
        results {
          id
          valueText
          valueNumeric
          unit
          referenceRange
          flag
          resultedAt
        }
      }
    }
  }
`;
