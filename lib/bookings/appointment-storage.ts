import type { Appointment } from "@/types";

const STORAGE_KEY = "glycolink_appointments";

function isBrowser() {
  return typeof window !== "undefined";
}

export function saveAppointment(appointment: Appointment) {
  if (!isBrowser()) {
    return;
  }

  const existing = getAppointmentsFromStorage();
  const nextAppointments = {
    ...existing,
    [appointment.id]: appointment,
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAppointments));
}

export function getAppointmentById(id: string) {
  const appointments = getAppointmentsFromStorage();
  return appointments[id];
}

export function upsertAppointment(appointment: Appointment) {
  if (!isBrowser()) {
    return;
  }

  const existing = getAppointmentsFromStorage();
  const nextAppointments = {
    ...existing,
    [appointment.id]: appointment,
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAppointments));
}

export function getStoredAppointments() {
  return Object.values(getAppointmentsFromStorage());
}

function getAppointmentsFromStorage(): Record<string, Appointment> {
  if (!isBrowser()) {
    return {};
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY);

  if (!rawValue) {
    return {};
  }

  try {
    return JSON.parse(rawValue) as Record<string, Appointment>;
  } catch {
    return {};
  }
}
