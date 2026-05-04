import type { Appointment, AppointmentStatus, BookableProvider } from "@/types";

export const bookableProviders: BookableProvider[] = [
  {
    id: "dr-sarah-mensah",
    name: "Dr. Sarah Mensah",
    specialty: "Endocrinology",
    consultationFee: 45,
    isAvailable: true,
  },
  {
    id: "dr-brian-okello",
    name: "Dr. Brian Okello",
    specialty: "Diabetology",
    consultationFee: 38,
    isAvailable: true,
  },
  {
    id: "dr-anita-phiri",
    name: "Dr. Anita Phiri",
    specialty: "Clinical Nutrition",
    consultationFee: 30,
    isAvailable: false,
  },
  {
    id: "dr-james-ncube",
    name: "Dr. James Ncube",
    specialty: "Internal Medicine",
    consultationFee: 52,
    isAvailable: true,
  },
];

export const providerAvailability: Record<string, Record<string, string[]>> = {
  "dr-sarah-mensah": {
    "2026-04-10": ["09:00", "10:00", "14:00"],
    "2026-04-11": ["11:00", "15:00"],
    "2026-04-12": [],
    "2026-04-13": ["08:30", "13:30", "16:00"],
  },
  "dr-brian-okello": {
    "2026-04-10": ["10:00", "12:00"],
    "2026-04-11": ["09:30", "11:30", "15:30"],
    "2026-04-12": [],
    "2026-04-14": ["14:00", "16:00"],
  },
  "dr-anita-phiri": {
    "2026-04-10": [],
    "2026-04-11": [],
  },
  "dr-james-ncube": {
    "2026-04-10": ["09:00", "13:00"],
    "2026-04-11": ["10:30", "14:30"],
    "2026-04-12": [],
    "2026-04-15": ["08:00", "12:00", "15:00"],
  },
};

export function getBookableProviderById(id: string) {
  return bookableProviders.find((provider) => provider.id === id);
}

export function getAvailabilityByProviderId(id: string) {
  return providerAvailability[id] ?? {};
}

export function getStatusBadgeVariant(status: AppointmentStatus) {
  if (status === "AWAITING_PAYMENT") {
    return "warning";
  }

  if (status === "CONFIRMED") {
    return "success";
  }

  if (status === "IN_PROGRESS") {
    return "primary";
  }

  if (status === "COMPLETED") {
    return "secondary";
  }

  if (status === "CANCELLED") {
    return "danger";
  }

  if (status === "NO_SHOW") {
    return "secondary";
  }

  return "secondary";
}

export function createMockAppointment(input: {
  provider: BookableProvider;
  date: string;
  time: string;
}): Appointment {
  const id = `apt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

  return {
    id,
    providerId: input.provider.id,
    providerName: input.provider.name,
    providerSpecialty: input.provider.specialty,
    consultationFee: input.provider.consultationFee,
    date: input.date,
    time: input.time,
    status: "AWAITING_PAYMENT",
    paymentStatus: "AWAITING_PAYMENT",
    createdAt: new Date().toISOString(),
  };
}
