import { getGraphQLErrorCode, getGraphQLErrorMessage } from "@/features/auth/auth-context";

/** How often the payment screens re-check for confirmation. */
export const PAYMENT_POLL_INTERVAL_MS = 4000;
/** Stop waiting for the mobile-money approval after this long. */
export const PAYMENT_POLL_TIMEOUT_MS = 2 * 60 * 1000;
/** Minimum wait before the patient can ask for another prompt. */
export const PAYMENT_RESEND_COOLDOWN_MS = 30 * 1000;

/**
 * Local (0XX) prefixes the backend can route to a PawaPay provider
 * (see PAWAPAY_PROVIDER_BY_PREFIX in glycolink-api payments/services/payment_service.py).
 */
const SUPPORTED_LOCAL_PREFIXES = ["057", "077", "097", "076", "096", "095"] as const;

/** Accepts common Zambian formats and normalizes to digits (e.g. 26097xxxxxxx). */
export function normalizePhone(raw: string) {
  const digits = raw.replace(/[^\d]/g, "");
  if (digits.startsWith("260")) return digits;
  if (digits.startsWith("0")) return `260${digits.slice(1)}`;
  if (digits.length === 9) return `260${digits}`;
  return digits;
}

export function isValidPhone(raw: string) {
  const normalized = normalizePhone(raw);
  if (!/^260\d{9}$/.test(normalized)) return false;
  const localPrefix = `0${normalized.slice(3, 5)}`;
  return (SUPPORTED_LOCAL_PREFIXES as readonly string[]).includes(localPrefix);
}

export const INVALID_PHONE_MESSAGE =
  "Enter a valid Airtel, MTN or Zamtel number (starting 097, 077, 057, 096, 076 or 095).";

/** Turns PawaPay's failure code (PaymentType.failureReason) into something a patient can act on. */
export function describePaymentFailure(reason: string | null | undefined) {
  switch (reason?.trim().toUpperCase()) {
    case "PAYMENT_NOT_APPROVED":
      return "The payment wasn't approved on your phone. Check your number and try again.";
    case "INSUFFICIENT_BALANCE":
      return "Your mobile money balance is too low to complete this payment.";
    case "PAYER_LIMIT_REACHED":
      return "You've reached your mobile money transaction limit. Try again later or use another number.";
    case "PAYER_NOT_FOUND":
      return "That number isn't registered for mobile money. Check it and try again.";
    default:
      return "The payment couldn't be completed. Check your number and try again.";
  }
}

export function mapPaymentError(error: unknown) {
  const code = getGraphQLErrorCode(error);
  if (code === "PAYMENT_INVALID_PHONE") return INVALID_PHONE_MESSAGE;
  if (code === "PAYMENT_INVALID_STATE") {
    return "This payment can no longer be made. Refresh and try again.";
  }
  if (
    code === "PAYMENT_ACCESS_DENIED" ||
    code === "TENANT_ACCESS_DENIED" ||
    code === "PROGRAMME_BILLING_ACCESS_DENIED"
  ) {
    return "You do not have access to this payment.";
  }
  if (code === "PAYMENT_NOT_FOUND" || code === "PROGRAMME_BILLING_NOT_FOUND") {
    return "Payment could not be found.";
  }
  if (code === "PROGRAMME_BILLING_INVALID_STATE") {
    return "This invoice can no longer be paid. Refresh and try again.";
  }
  if (code === "PAYMENT_GATEWAY_ERROR") {
    return "The mobile money provider could not be reached. Please retry.";
  }
  return getGraphQLErrorMessage(error, "Unable to process the payment right now. Please try again.");
}
