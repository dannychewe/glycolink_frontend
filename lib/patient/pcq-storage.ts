import { pcqDefaultValues, type PCQFormValues } from "@/lib/patient/pcq-template";

export type StoredPCQRecord = {
  status: "DRAFT" | "SUBMITTED";
  values: PCQFormValues;
  updatedAt: string;
};

const storageKeyPrefix = "glycolink_pcq_";

function getStorageKey(appointmentId: string) {
  return `${storageKeyPrefix}${appointmentId}`;
}

function isBrowser() {
  return typeof window !== "undefined";
}

export function getPCQRecord(appointmentId: string): StoredPCQRecord | null {
  if (!isBrowser()) {
    return null;
  }

  const rawValue = window.localStorage.getItem(getStorageKey(appointmentId));

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as StoredPCQRecord;
  } catch {
    return null;
  }
}

export function savePCQDraft(appointmentId: string, values: PCQFormValues) {
  if (!isBrowser()) {
    return;
  }

  const record: StoredPCQRecord = {
    status: "DRAFT",
    values,
    updatedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(getStorageKey(appointmentId), JSON.stringify(record));
}

export function submitPCQ(appointmentId: string, values: PCQFormValues) {
  if (!isBrowser()) {
    return;
  }

  const record: StoredPCQRecord = {
    status: "SUBMITTED",
    values,
    updatedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(getStorageKey(appointmentId), JSON.stringify(record));
}

export function getPCQInitialValues(appointmentId: string): PCQFormValues {
  return getPCQRecord(appointmentId)?.values ?? pcqDefaultValues;
}
