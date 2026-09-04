import { gql } from "@apollo/client";

// Payment status (Payment.status): INITIATED | PENDING | CONFIRMED | FAILED | EXPIRED | CANCELLED
// Attempt status (PaymentAttempt.status): REQUESTED | PENDING | COMPLETED | SUCCESS | FAILED | CANCELLED | TIMEOUT
// Confirmation is asynchronous (PawaPay webhook). There is no payment-status query — callers
// detect success by polling the appointment status for AWAITING_PAYMENT -> CONFIRMED.

export const MY_APPOINTMENT_PAYMENTS_QUERY = gql`
  query MyAppointmentPayments($limit: Int, $status: String) {
    myAppointmentPayments(limit: $limit, status: $status) {
      id
      amount
      currency
      method
      status
      confirmedAt
      expiresAt
      appointment {
        id
        startsAt
        consultationType
        providerName
      }
    }
  }
`;

export const CREATE_PAYMENT_INTENT_MUTATION = gql`
  mutation PatientCreatePaymentIntent($appointmentId: UUID!) {
    createPaymentIntent(appointmentId: $appointmentId) {
      paymentIntent {
        id
        appointmentId
        amount
        currency
        method
        status
        expiresAt
        confirmedAt
      }
    }
  }
`;

export const INITIATE_PAYMENT_MUTATION = gql`
  mutation PatientInitiatePayment($intentId: UUID!, $phone: String!) {
    initiatePayment(intentId: $intentId, phone: $phone) {
      attempt {
        id
        gateway
        gatewayReference
        msisdn
        status
        requestedAt
        completedAt
      }
    }
  }
`;

export const RETRY_PAYMENT_MUTATION = gql`
  mutation PatientRetryPayment($intentId: UUID!, $phone: String!) {
    retryPayment(intentId: $intentId, phone: $phone) {
      attempt {
        id
        gateway
        gatewayReference
        msisdn
        status
        requestedAt
        completedAt
      }
    }
  }
`;

export const RECORD_APPOINTMENT_CASH_PAYMENT_MUTATION = gql`
  mutation RecordAppointmentCashPayment(
    $appointmentId: UUID!
    $amount: Decimal
    $reference: String
    $note: String
  ) {
    recordAppointmentCashPayment(
      appointmentId: $appointmentId
      amount: $amount
      reference: $reference
      note: $note
    ) {
      payment {
        id
        appointmentId
        amount
        currency
        method
        status
        confirmedAt
      }
    }
  }
`;
