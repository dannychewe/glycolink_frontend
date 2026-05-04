import type { PaymentRecord } from "@/types";

const STORAGE_KEY = "glycolink_payments";

function isBrowser() {
  return typeof window !== "undefined";
}

function getStoredPayments(): Record<string, PaymentRecord> {
  if (!isBrowser()) {
    return {};
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY);

  if (!rawValue) {
    return {};
  }

  try {
    return JSON.parse(rawValue) as Record<string, PaymentRecord>;
  } catch {
    return {};
  }
}

function persistPayments(payments: Record<string, PaymentRecord>) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payments));
}

export function getStoredPaymentById(id: string) {
  return getStoredPayments()[id];
}

export function upsertStoredPayment(payment: PaymentRecord) {
  const payments = getStoredPayments();
  persistPayments({
    ...payments,
    [payment.id]: payment,
  });
}
