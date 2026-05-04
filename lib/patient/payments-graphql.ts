import { gql } from "@apollo/client";

export const MY_PAYMENTS_QUERY = gql`
  query PatientPayments($limit: Int) {
    myPayments(limit: $limit) {
      id
      appointmentId
      amount
      currency
      status
      method
      paidAt
      createdAt
      appointment {
        id
        startsAt
        provider {
          id
          displayName
        }
      }
    }
  }
`;

export const MY_PAYMENT_DETAIL_QUERY = gql`
  query PatientPaymentDetail($id: UUID!) {
    myPayment(id: $id) {
      id
      appointmentId
      amount
      currency
      status
      method
      paidAt
      createdAt
      appointment {
        id
        startsAt
        endsAt
        consultationType
        provider {
          id
          displayName
          consultationFeeInitial
        }
      }
    }
  }
`;
