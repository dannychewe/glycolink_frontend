export type UserRole = "patient" | "consultant" | "admin";

export type NavItem = {
  href: string;
  label: string;
};

export type ProviderReview = {
  id: string;
  author: string;
  title: string;
  comment: string;
  rating: number;
};

export type AppointmentStatus =
  | "PENDING"
  | "REQUESTED"
  | "AWAITING_PAYMENT"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW"
  | "RESCHEDULED";

export type BookableProvider = {
  id: string;
  name: string;
  specialty: string;
  consultationFee: number;
  isAvailable: boolean;
};

export type Appointment = {
  id: string;
  providerId: string;
  providerName: string;
  providerSpecialty: string;
  date: string;
  time: string;
  consultationFee: number;
  status: AppointmentStatus;
  paymentStatus: AppointmentPaymentStatus;
  createdAt: string;
};

export type PendingActionType = "PAYMENT" | "PCQ";

export type DashboardPendingAction = {
  type: PendingActionType;
  message: string;
};

export type DashboardNotification = {
  message: string;
  timestamp: string;
};

export type NotificationType = "APPOINTMENT" | "PAYMENT" | "LAB" | "SYSTEM";

export type PatientNotification = {
  id: string;
  message: string;
  type: NotificationType;
  timestamp: string;
  isRead: boolean;
};

export type ConsultantNotificationType =
  | "APPOINTMENT"
  | "LAB"
  | "ALERT"
  | "SYSTEM";

export type ConsultantNotification = {
  id: string;
  message: string;
  type: ConsultantNotificationType;
  timestamp: string;
  isRead: boolean;
};

export type PaymentStatus = "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED";

export type PaymentRecord = {
  id: string;
  appointmentId: string;
  providerName: string;
  amount: number;
  status: PaymentStatus;
  createdAt: string;
};

export type AppointmentPaymentStatus = "AWAITING_PAYMENT" | "PAID";

export type PrescriptionStatus = "ACTIVE" | "COMPLETED" | "REVOKED";

export type PrescriptionRecord = {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  instructions: string;
  prescribedBy: string;
  dateIssued: string;
  status: PrescriptionStatus;
};

export type LabOrderStatus =
  | "ORDERED"
  | "SAMPLE_COLLECTED"
  | "RESULT_READY"
  | "REVIEWED";

export type LabOrderRecord = {
  id: string;
  testName: string;
  orderedBy: string;
  dateOrdered: string;
  status: LabOrderStatus;
  resultSummary?: string;
  hasAttachment: boolean;
};

export type GlucoseReading = {
  id: string;
  value: number;
  unit: "mg/dL";
  timestamp: string;
};

export type PCQQuestionType = "text" | "textarea" | "select" | "boolean";

export type PCQQuestion = {
  id: string;
  label: string;
  type: PCQQuestionType;
  required: boolean;
  options?: string[];
};

export type PCQSection = {
  id: string;
  title: string;
  questions: PCQQuestion[];
};

export type PCQTemplate = {
  sections: PCQSection[];
};

export type PatientDashboardData = {
  nextAppointment: {
    id: string;
    providerName: string;
    date: string;
    time: string;
    status: Extract<AppointmentStatus, "AWAITING_PAYMENT" | "CONFIRMED">;
  };
  pendingActions: DashboardPendingAction[];
  latestPrescription: PrescriptionRecord;
  latestLab: LabOrderRecord;
  recentReadings: number[];
  notifications: DashboardNotification[];
};

export type PatientProfile = {
  fullName: string;
  email: string;
  phone: string;
  diabetesType: "Type 1" | "Type 2" | "Prediabetes";
  diagnosisDate: string;
  allergies: string;
  medications: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
};

export type PatientSettings = {
  emailNotifications: boolean;
  smsNotifications: boolean;
};

export type ConsultantProfile = {
  fullName: string;
  email: string;
  phone: string;
  specialty: string;
  subSpecialties: string;
  bio: string;
  languages: string;
  consultationFee: number;
  organization: string;
  hpczNumber: string;
  licenseExpiryDate: string;
};

export type ConsultantSettings = {
  emailNotifications: boolean;
  smsNotifications: boolean;
};

export type ConsultantAppointmentStatus =
  | "UPCOMING"
  | "READY"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "NO_SHOW";

export type ConsultantTodayAppointment = {
  id: string;
  patientId: string;
  patientName: string;
  time: string;
  status: ConsultantAppointmentStatus;
};

export type ConsultantPcqStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "SUBMITTED";

export type ConsultantPaymentStatus = "AWAITING_PAYMENT" | "PAID";

export type ConsultantWorklistAppointment = {
  id: string;
  patientId: string;
  patientName: string;
  time: string;
  date: string;
  status: ConsultantAppointmentStatus;
  pcqStatus: ConsultantPcqStatus;
  paymentStatus: ConsultantPaymentStatus;
};

export type ConsultantPendingLab = {
  id: string;
  patientId: string;
  patientName: string;
  testName: string;
};

export type ConsultantAlertSeverity = "HIGH" | "MEDIUM";

export type ConsultantAlert = {
  patientId: string;
  patientName: string;
  message: string;
  severity: ConsultantAlertSeverity;
};

export type ConsultantMessage = {
  patientId: string;
  patientName: string;
  lastMessage: string;
};

export type ConsultantProviderStatus = "APPROVED" | "PENDING" | "SUSPENDED";

export type ConsultantDashboardData = {
  todayAppointments: ConsultantTodayAppointment[];
  pendingLabs: ConsultantPendingLab[];
  alerts: ConsultantAlert[];
  messages: ConsultantMessage[];
  providerStatus: ConsultantProviderStatus;
};

export type ConsultantPatientPcqItem = {
  question: string;
  answer: string;
};

export type ConsultantPatientLab = Pick<
  LabOrderRecord,
  "testName" | "resultSummary" | "status"
>;

export type ConsultantPatientPrescription = Pick<
  PrescriptionRecord,
  "medicationName" | "dosage" | "dateIssued"
>;

export type ConsultantPrescriptionMedication = {
  medicationName: string;
  dosage: string;
  frequency: string;
  instructions: string;
};

export type ConsultantPrescription = ConsultantPatientPrescription & {
  id: string;
  patientName: string;
  status: PrescriptionStatus;
  frequency: string;
  instructions: string;
  prescribedBy: string;
  medications: ConsultantPrescriptionMedication[];
};

export type ConsultantLabReview = {
  id: string;
  patientName: string;
  testName: string;
  resultSummary: string;
  resultValue: string;
  unit: string;
  interpretation: "NORMAL" | "HIGH" | "CRITICAL";
  orderedBy: string;
  dateOrdered: string;
  status: Extract<LabOrderStatus, "RESULT_READY" | "REVIEWED">;
  doctorNotes?: string;
};

export type ConsultantAvailabilityDay =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export type ConsultantAvailabilitySlot = {
  day: ConsultantAvailabilityDay;
  startTime: string;
  endTime: string;
};

export type ConsultantPatientContext = {
  id: string;
  name: string;
  age: number;
  gender: string;
  diabetesType: PatientProfile["diabetesType"];
  diagnosisDate: string;
  allergies: string;
  medications: string;
  pcq: ConsultantPatientPcqItem[];
  prescriptions: ConsultantPatientPrescription[];
  labs: ConsultantPatientLab[];
  monitoring: GlucoseReading[];
};

export type ConsultantPatientListItem = {
  id: string;
  name: string;
  age: number;
  diabetesType: PatientProfile["diabetesType"];
  lastVisitDate: string;
};

export type ConsultationMedicationInput = {
  medicationName: string;
  dosage: string;
  frequency: string;
  instructions: string;
};

export type ConsultationLabOrderInput = {
  testName: string;
  notes: string;
};

export type ConsultantSoapNotes = {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
};

export type ConsultantEncounterPrescription = {
  medicationName: string;
  dosage: string;
  instructions: string;
};

export type ConsultantEncounterLabOrder = {
  testName: string;
  notes: string;
};

export type ConsultantEncounterSummary = {
  id: string;
  patientName: string;
  date: string;
  time: string;
  soap: ConsultantSoapNotes;
  diagnosis: string;
  prescriptions: ConsultantEncounterPrescription[];
  labOrders: ConsultantEncounterLabOrder[];
};

export type Provider = {
  slug: string;
  name: string;
  image: string;
  specialty: string;
  subSpecialty: string;
  city: string;
  country: string;
  bio: string;
  consultationFee: number;
  rating?: number;
  reviewCount?: number;
  isAvailable: boolean;
  yearsExperience: number;
  languages: string[];
  focusAreas: string[];
  reviews: ProviderReview[];
};

export type ProviderPriceRange = "all" | "under-40" | "40-50" | "above-50";
